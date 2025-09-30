// src/pages/ProfileSetup.tsx (Updated)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import { BITS_BRANCHES, isMscBranch } from '../data/bitsBranches'; // <-- IMPORT our new data

const BITS_CAMPUSES = ['Pilani', 'Goa', 'Hyderabad', 'Dubai'];
const RELATIONSHIP_STATUSES = ['Single', 'In a Relationship', 'Married', "It's Complicated"];

const ProfileSetup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    full_name: '',
    campus: '',
    admission_year: '',
    branch: '',
    dual_degree_branch: '', // <-- NEW field for the BE branch
    relationship_status: '',
    dorm_building: '',
    dorm_room: '',
    dining_hall: '',
    bio: '',
  });

  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [isDualDegreeStudent, setIsDualDegreeStudent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // EFFECT 1: Update available branches when campus changes
  useEffect(() => {
    if (formData.campus && BITS_BRANCHES[formData.campus]) {
        const campusData = BITS_BRANCHES[formData.campus];
        // Combine BE and MSc branches for the main dropdown
        setAvailableBranches([...campusData['B.E.'], ...campusData['M.Sc.']]);
    } else {
        setAvailableBranches([]);
    }
    // Reset branch selection when campus changes
    setFormData(prev => ({ ...prev, branch: '', dual_degree_branch: '' }));
  }, [formData.campus]);

  // EFFECT 2: Check if the user is a dual degree student based on their selected branch
  useEffect(() => {
    const isMsc = isMscBranch(formData.branch, formData.campus);
    setIsDualDegreeStudent(isMsc);
    if (!isMsc) {
      setFormData(prev => ({ ...prev, dual_degree_branch: '' })); // Clear dual degree if not MSc
    }
  }, [formData.branch, formData.campus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          campus: formData.campus,
          admission_year: parseInt(formData.admission_year),
          branch: formData.branch,
          dual_degree_branch: formData.dual_degree_branch || null, // <-- SEND new field to DB
          relationship_status: formData.relationship_status,
          dorm_building: formData.dorm_building,
          dorm_room: formData.dorm_room,
          dining_hall: formData.dining_hall,
          bio: formData.bio,
          profile_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id); 

      if (updateError) throw updateError;
      
      navigate('/'); 

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Condition to show the dual degree dropdown
  const showDualDegreeField = isDualDegreeStudent && 
                              formData.admission_year && 
                              new Date().getFullYear() >= parseInt(formData.admission_year) + 1;

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark p-4">
      <div className="bg-dark-secondary p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-3xl font-bold text-gray-100 mb-2 text-center">Almost there!</h2>
        <p className="text-gray-400 mb-6 text-center">Let's set up your profile so others can find you.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full"><label htmlFor="full_name" className="block text-gray-300 text-sm font-bold mb-2">Full Name <span className="text-bits-red">*</span></label><input type="text" name="full_name" id="full_name" value={formData.full_name} onChange={handleChange} required className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm" /></div>
            
            {/* Campus Dropdown */}
            <div><label htmlFor="campus" className="block text-gray-300 text-sm font-bold mb-2">Campus <span className="text-bits-red">*</span></label><select name="campus" id="campus" value={formData.campus} onChange={handleChange} required className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Select Campus</option>{BITS_CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>

            {/* Admission Year Dropdown */}
            <div><label htmlFor="admission_year" className="block text-gray-300 text-sm font-bold mb-2">Admission Year <span className="text-bits-red">*</span></label><select name="admission_year" id="admission_year" value={formData.admission_year} onChange={handleChange} required className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Select Year</option>{Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select></div>
            
            {/* Primary Branch Dropdown (Now Dynamic) */}
            <div className={showDualDegreeField ? 'col-span-1' : 'col-span-full'}><label htmlFor="branch" className="block text-gray-300 text-sm font-bold mb-2">Primary Degree <span className="text-bits-red">*</span></label><select name="branch" id="branch" value={formData.branch} onChange={handleChange} required disabled={!formData.campus} className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm disabled:opacity-50"><option value="">Select Branch</option>{availableBranches.map(b => <option key={b} value={b}>{b}</option>)}</select></div>

            {/* DUAL DEGREE B.E. BRANCH (Conditional) */}
            {showDualDegreeField && (
                <div>
                    <label htmlFor="dual_degree_branch" className="block text-gray-300 text-sm font-bold mb-2">
                        B.E. Branch <span className="text-gray-400">(Optional)</span>
                    </label>
                    <select name="dual_degree_branch" id="dual_degree_branch" value={formData.dual_degree_branch} onChange={handleChange} className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm">
                        <option value="">Select B.E. Branch</option>
                        {BITS_BRANCHES[formData.campus]['B.E.'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
            )}

            {/* Other Fields */}
            <div><label htmlFor="relationship_status" className="block text-gray-300 text-sm font-bold mb-2">Relationship Status</label><select name="relationship_status" id="relationship_status" value={formData.relationship_status} onChange={handleChange} className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Select Status</option>{RELATIONSHIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label htmlFor="dorm_building" className="block text-gray-300 text-sm font-bold mb-2">Dorm Building</label><input type="text" name="dorm_building" id="dorm_building" value={formData.dorm_building} onChange={handleChange} placeholder="e.g. Ram Bhawan" className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm" /></div>
            <div><label htmlFor="dorm_room" className="block text-gray-300 text-sm font-bold mb-2">Dorm Room</label><input type="text" name="dorm_room" id="dorm_room" value={formData.dorm_room} onChange={handleChange} placeholder="e.g. 101" className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm" /></div>
            
            <div className="col-span-full"><label htmlFor="bio" className="block text-gray-300 text-sm font-bold mb-2">Bio</label><textarea name="bio" id="bio" value={formData.bio} onChange={handleChange} rows={3} placeholder="Tell us a little about yourself..." className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm resize-y" /></div>
            {error && <p className="col-span-full text-red-400 text-center text-sm">{error}</p>}
            <div className="col-span-full mt-4"><button type="submit" disabled={isSaving} className="w-full bg-bits-red text-white font-semibold rounded-md py-3 transition duration-300 ease-in-out hover:bg-red-700 disabled:opacity-50">{isSaving ? <Spinner /> : 'Save Profile & Continue'}</button></div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;