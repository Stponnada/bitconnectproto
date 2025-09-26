import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';

const BITS_CAMPUSES = ['Pilani', 'Goa', 'Hyderabad', 'Dubai'];
const BITS_BRANCHES = ['Computer Science', 'Electrical & Electronics', 'Mechanical', 'Chemical'];
const RELATIONSHIP_STATUSES = ['Single', 'In a Relationship', 'Married', 'It\'s Complicated'];

const ProfileSetup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    full_name: '',
    campus: '',
    admission_year: '',
    branch: '',
    relationship_status: '',
    dorm_building: '',
    dorm_room: '',
    dining_hall: '',
    bio: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      // THE CRITICAL FIX IS HERE:
      // We use .update() to modify the existing profile.
      // We explicitly list the columns to avoid the 'bigint' error.
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          campus: formData.campus,
          admission_year: parseInt(formData.admission_year),
          branch: formData.branch,
          relationship_status: formData.relationship_status,
          dorm_building: formData.dorm_building,
          dorm_room: formData.dorm_room,
          dining_hall: formData.dining_hall,
          bio: formData.bio,
          profile_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id); // This targets the correct user's profile

      if (updateError) {
        throw updateError;
      }
      
      navigate('/'); // Navigate to home on success

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Your JSX is fine, no changes needed.
  return (
    <div className="flex items-center justify-center min-h-screen bg-dark p-4">
      <div className="bg-dark-secondary p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-3xl font-bold text-gray-100 mb-2 text-center">Almost there!</h2>
        <p className="text-gray-400 mb-6 text-center">Let's set up your profile so others can find you.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-full"><label htmlFor="full_name" className="block text-gray-300 text-sm font-bold mb-2">Full Name <span className="text-bits-red">*</span></label><input type="text" name="full_name" id="full_name" onChange={handleChange} required className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm" /></div>
          <div><label htmlFor="campus" className="block text-gray-300 text-sm font-bold mb-2">Campus <span className="text-bits-red">*</span></label><select name="campus" id="campus" onChange={handleChange} required className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Select Campus</option>{BITS_CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label htmlFor="admission_year" className="block text-gray-300 text-sm font-bold mb-2">Admission Year <span className="text-bits-red">*</span></label><select name="admission_year" id="admission_year" onChange={handleChange} required className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Select Year</option>{Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select></div>
          <div><label htmlFor="branch" className="block text-gray-300 text-sm font-bold mb-2">Branch</label><select name="branch" id="branch" onChange={handleChange} className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Select Branch</option>{BITS_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
          <div><label htmlFor="relationship_status" className="block text-gray-300 text-sm font-bold mb-2">Relationship Status</label><select name="relationship_status" id="relationship_status" onChange={handleChange} className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Select Status</option>{RELATIONSHIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div><label htmlFor="dorm_building" className="block text-gray-300 text-sm font-bold mb-2">Dorm Building</label><input type="text" name="dorm_building" id="dorm_building" onChange={handleChange} placeholder="e.g. Ram Bhawan" className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm" /></div>
          <div><label htmlFor="dorm_room" className="block text-gray-300 text-sm font-bold mb-2">Dorm Room</label><input type="text" name="dorm_room" id="dorm_room" onChange={handleChange} placeholder="e.g. 101" className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm" /></div>
          <div className="col-span-full"><label htmlFor="bio" className="block text-gray-300 text-sm font-bold mb-2">Bio</label><textarea name="bio" id="bio" onChange={handleChange} rows={3} placeholder="Tell us a little about yourself..." className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm resize-y" /></div>
          {error && <p className="col-span-full text-red-400 text-center text-sm">{error}</p>}
          <div className="col-span-full mt-4"><button type="submit" disabled={isSaving} className="w-full bg-bits-red text-white font-semibold rounded-md py-3 transition duration-300 ease-in-out hover:bg-red-700 disabled:opacity-50">{isSaving ? <Spinner /> : 'Save Profile & Continue'}</button></div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;