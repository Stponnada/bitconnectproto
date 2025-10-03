// src/pages/ProfileSetup.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';
import { CameraIcon } from '../components/icons';
import { BITS_BRANCHES, isMscBranch } from '../data/bitsBranches.ts';
import { getKeyPair } from '../services/encryption';

const RELATIONSHIP_STATUSES = ['Single', 'In a Relationship', 'Married', "It's Complicated"];
const DINING_HALLS = ['Mess 1', 'Mess 2'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 20 }, (_, i) => currentYear - 17 - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const ProfileSetup: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    full_name: '', campus: '', admission_year: '', branch: '',
    dual_degree_branch: '', relationship_status: '', dorm_building: '',
    dorm_room: '', dining_hall: '', bio: '', gender: '',
    birth_day: '', birth_month: '', birth_year: '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [isDualDegreeStudent, setIsDualDegreeStudent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user?.email) {
      const emailDomain = user.email.split('@')[1]; 
      const campusSubdomain = emailDomain?.split('.')[0]; 
      const campusMap: { [key: string]: string } = { pilani: 'Pilani', goa: 'Goa', hyderabad: 'Hyderabad', dubai: 'Dubai' };
      const detectedCampus = campusSubdomain ? campusMap[campusSubdomain] : '';
      if (detectedCampus) {
        setFormData(prev => ({ ...prev, campus: detectedCampus }));
      }
    }
  }, [user]);
  
  useEffect(() => {
    if (formData.campus && BITS_BRANCHES[formData.campus]) {
        const campusData = BITS_BRANCHES[formData.campus];
        setAvailableBranches([...campusData['B.E.'], ...campusData['M.Sc.']]);
    } else { setAvailableBranches([]); }
    setFormData(prev => ({ ...prev, branch: '', dual_degree_branch: '' }));
  }, [formData.campus]);

  useEffect(() => {
    const isMsc = isMscBranch(formData.branch, formData.campus);
    setIsDualDegreeStudent(isMsc);
    if (!isMsc) setFormData(prev => ({ ...prev, dual_degree_branch: '' }));
  }, [formData.branch, formData.campus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const previewUrl = URL.createObjectURL(file);
          if (type === 'avatar') {
              setAvatarFile(file);
              setAvatarPreview(previewUrl);
          } else {
              setBannerFile(file);
              setBannerPreview(previewUrl);
          }
      }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setError(null);
    try {
        let avatar_url = null;
        let banner_url = null;
        
        if (avatarFile) {
            const filePath = `${user.id}/avatar.${avatarFile.name.split('.').pop()}`;
            await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            avatar_url = `${publicUrl}?t=${new Date().getTime()}`;
        }
        if (bannerFile) {
            const filePath = `${user.id}/banner.${bannerFile.name.split('.').pop()}`;
            await supabase.storage.from('avatars').upload(filePath, bannerFile, { upsert: true });
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            banner_url = `${publicUrl}?t=${new Date().getTime()}`;
        }
        
        const birthdayString = formData.birth_year && formData.birth_month && formData.birth_day
            ? `${formData.birth_year}-${String(formData.birth_month).padStart(2, '0')}-${String(formData.birth_day).padStart(2, '0')}`
            : null;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          campus: formData.campus,
          admission_year: parseInt(formData.admission_year),
          branch: formData.branch,
          gender: formData.gender,
          birthday: birthdayString,
          dual_degree_branch: formData.dual_degree_branch || null,
          relationship_status: formData.relationship_status,
          dorm_building: formData.dorm_building,
          dorm_room: formData.dorm_room,
          dining_hall: formData.dining_hall,
          bio: formData.bio,
          avatar_url,
          banner_url,
          profile_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id); 

      if (updateError) throw updateError;
      
      await getKeyPair();
      navigate('/'); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  const showDualDegreeField = isDualDegreeStudent && formData.admission_year && new Date().getFullYear() >= parseInt(formData.admission_year) + 1;

  return (
    <div className="flex items-center justify-center min-h-screen bg-dark p-4">
      <div className="bg-dark-secondary p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-gray-100 mb-2 text-center">Set Up Your Profile</h2>
        <p className="text-gray-400 mb-6 text-center">Let's get your profile ready so others can find you.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative h-40 bg-dark-tertiary rounded-lg mb-16 border border-gray-700">
                {bannerPreview && <img src={bannerPreview} className="w-full h-full object-cover rounded-lg" alt="Banner Preview"/>}
                <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg"><CameraIcon className="w-8 h-8 text-white" /></button>
                <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" hidden />
                <div className="absolute -bottom-16 left-6 w-32 h-32 rounded-full border-4 border-dark-secondary bg-dark-tertiary">
                    {avatarPreview ? <img src={avatarPreview} className="w-full h-full rounded-full object-cover" alt="Avatar Preview"/> : <div className="w-full h-full rounded-full flex items-center justify-center text-gray-500"><CameraIcon className="w-10 h-10" /></div>}
                    <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 rounded-full transition-opacity"><CameraIcon className="w-8 h-8 text-white" /></button>
                    <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" hidden />
                </div>
            </div>

            <div className="col-span-full"><label htmlFor="full_name" className="block text-gray-300 text-sm font-bold mb-2">Full Name <span className="text-red-500">*</span></label><input type="text" name="full_name" id="full_name" value={formData.full_name} onChange={handleChange} required className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm" /></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-bold mb-2">Campus</label>
                  <div className="w-full p-3 bg-dark-primary border border-gray-600 rounded-md text-sm text-gray-300 cursor-not-allowed">
                    {formData.campus ? (<>{formData.campus} <span className="text-xs text-gray-500">(Auto-Detected)</span></>) : ('Detecting...')}
                  </div>
                </div>
                <div><label htmlFor="admission_year" className="block text-gray-300 text-sm font-bold mb-2">Admission Year <span className="text-red-500">*</span></label><select name="admission_year" id="admission_year" value={formData.admission_year} onChange={handleChange} required className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Select Year</option>{Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => <option key={y} value={y}>{y}</option>)}</select></div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Birthday <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                <select name="birth_month" value={formData.birth_month} onChange={handleChange} required className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Month</option>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
                <select name="birth_day" value={formData.birth_day} onChange={handleChange} required className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Day</option>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                <select name="birth_year" value={formData.birth_year} onChange={handleChange} required className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Year</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Gender <span className="text-red-500">*</span></label>
              <div className="flex items-center space-x-6 mt-2">
                <label className="flex items-center space-x-2 text-gray-200 cursor-pointer">
                  <input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} required className="form-radio bg-dark-tertiary text-brand-green focus:ring-brand-green" />
                  <span>Female</span>
                </label>
                <label className="flex items-center space-x-2 text-gray-200 cursor-pointer">
                  <input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} required className="form-radio bg-dark-tertiary text-brand-green focus:ring-brand-green" />
                  <span>Male</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dark-tertiary">
                <div className={showDualDegreeField ? 'col-span-1' : 'md:col-span-2'}><label htmlFor="branch" className="block text-gray-300 text-sm font-bold mb-2">Primary Degree <span className="text-red-500">*</span></label><select name="branch" id="branch" value={formData.branch} onChange={handleChange} required disabled={!formData.campus} className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm disabled:opacity-50"><option value="">Select Branch</option>{availableBranches.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                {showDualDegreeField && ( <div><label htmlFor="dual_degree_branch" className="block text-gray-300 text-sm font-bold mb-2">B.E. Branch <span className="text-gray-400">(Optional)</span></label><select name="dual_degree_branch" id="dual_degree_branch" value={formData.dual_degree_branch} onChange={handleChange} className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Select B.E. Branch</option>{formData.campus ? BITS_BRANCHES[formData.campus]['B.E.'].map(b => <option key={b} value={b}>{b}</option>): null}</select></div> )}
                <div><label htmlFor="relationship_status" className="block text-gray-300 text-sm font-bold mb-2">Relationship Status</label><select name="relationship_status" id="relationship_status" value={formData.relationship_status} onChange={handleChange} className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Select Status</option>{RELATIONSHIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label htmlFor="dorm_building" className="block text-gray-300 text-sm font-bold mb-2">Dorm Building</label><input type="text" name="dorm_building" id="dorm_building" value={formData.dorm_building} onChange={handleChange} placeholder="e.g. Ram Bhawan" className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm" /></div>
                <div><label htmlFor="dorm_room" className="block text-gray-300 text-sm font-bold mb-2">Dorm Room</label><input type="text" name="dorm_room" id="dorm_room" value={formData.dorm_room} onChange={handleChange} placeholder="e.g. 101" className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm" /></div>
                <div><label htmlFor="dining_hall" className="block text-gray-300 text-sm font-bold mb-2">Dining Hall</label><select name="dining_hall" id="dining_hall" value={formData.dining_hall} onChange={handleChange} className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm"><option value="">Select Mess</option>{DINING_HALLS.map(hall => <option key={hall} value={hall}>{hall}</option>)}</select></div>
            </div>

            <div className="col-span-full"><label htmlFor="bio" className="block text-gray-300 text-sm font-bold mb-2">Bio</label><textarea name="bio" id="bio" value={formData.bio} onChange={handleChange} rows={3} placeholder="Intro de ..." className="w-full p-3 bg-dark-tertiary border border-gray-700 rounded-md text-sm resize-y" /></div>
            {error && <p className="col-span-full text-red-400 text-center text-sm">{error}</p>}
            <div className="col-span-full mt-4"><button type="submit" disabled={isSaving || !formData.campus} className="w-full bg-brand-green text-black font-bold rounded-md py-3 transition duration-300 ease-in-out hover:bg-brand-green-darker disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? <Spinner /> : 'Save Profile & Continue'}</button></div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;