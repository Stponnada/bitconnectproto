// src/pages/ProfileSetup.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';
import { CameraIcon } from '../components/icons';
import { BITS_BRANCHES, isMscBranch } from '../data/bitsBranches.ts';
import { getKeyPair } from '../services/encryption';
import ImageCropper from '../components/ImageCropper';

const RELATIONSHIP_STATUSES = ['Single', 'In a Relationship', 'Married', "It's Complicated"];
const DINING_HALLS = ['Mess 1', 'Mess 2'];
const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

const ProfileSetup: React.FC = () => {
  const { user, updateProfileContext } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    full_name: '', campus: '', admission_year: '', branch: '',
    dual_degree_branch: '', relationship_status: '', dorm_building: '',
    dorm_room: '', dining_hall: '', bio: '',
    gender: '', birthday_year: '', birthday_month: '', birthday_day: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [cropperState, setCropperState] = useState<{
    isOpen: boolean;
    type: 'avatar' | 'banner' | null;
    src: string | null;
  }>({ isOpen: false, type: null, src: null });
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

      const yearMatch = user.email.match(/20\d{2}/);
      const detectedYear = yearMatch ? yearMatch[0] : '';
      
      setFormData(prev => ({ 
        ...prev, 
        campus: detectedCampus,
        admission_year: detectedYear
      }));
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
          const reader = new FileReader();
          reader.onloadend = () => {
              setCropperState({ isOpen: true, type, src: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
      e.target.value = '';
  };
  const handleCropSave = (croppedImageFile: File) => {
    const previewUrl = URL.createObjectURL(croppedImageFile);
    if (cropperState.type === 'avatar') {
        setAvatarFile(croppedImageFile);
        setAvatarPreview(previewUrl);
    } else if (cropperState.type === 'banner') {
        setBannerFile(croppedImageFile);
        setBannerPreview(previewUrl);
    }
    setCropperState({ isOpen: false, type: null, src: null });
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

      let birthday = null;
      if (formData.birthday_year && formData.birthday_month && formData.birthday_day) {
        birthday = `${formData.birthday_year}-${formData.birthday_month}-${formData.birthday_day}`;
      }

      const { data: updatedProfile, error: updateError } = await supabase.from('profiles').update({
          full_name: formData.full_name, campus: formData.campus, admission_year: parseInt(formData.admission_year),
          branch: formData.branch, dual_degree_branch: formData.dual_degree_branch || null,
          relationship_status: formData.relationship_status, dorm_building: formData.dorm_building,
          dorm_room: formData.dorm_room, dining_hall: formData.dining_hall, bio: formData.bio,
          avatar_url, banner_url, profile_complete: true, updated_at: new Date().toISOString(),
          gender: formData.gender || null,
          birthday: birthday
        }).eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      await getKeyPair();
      
      updateProfileContext(updatedProfile); 
      
      navigate('/'); 
    } catch (err: any) { 
      setError(err.message); 
    } finally { 
      setIsSaving(false); 
    }
  };
  
  const showDualDegreeField = isDualDegreeStudent && formData.admission_year && new Date().getFullYear() >= parseInt(formData.admission_year) + 1;
  if (cropperState.isOpen && cropperState.src) {
    return (
        <ImageCropper
            imageSrc={cropperState.src}
            aspect={cropperState.type === 'avatar' ? 1 : 16 / 6}
            cropShape={cropperState.type === 'avatar' ? 'round' : 'rect'}
            onSave={handleCropSave}
            onClose={() => setCropperState({ isOpen: false, type: null, src: null })}
        />
    );
  }
  return (
    <div className="flex items-center justify-center min-h-screen bg-primary-light dark:bg-primary p-4">
      <div className="bg-secondary-light dark:bg-secondary p-8 rounded-lg shadow-lg w-full max-w-3xl">
        <h2 className="text-3xl font-bold text-text-main-light dark:text-text-main mb-2 text-center">Set Up Your Profile</h2>
        <p className="text-text-secondary-light dark:text-text-secondary mb-6 text-center">Let's get your profile ready so others can find you.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- THIS SECTION IS NOW RE-ADDED --- */}
            <div className="relative h-40 bg-tertiary-light dark:bg-tertiary rounded-lg mb-16 border border-tertiary-light dark:border-gray-700">
                {bannerPreview && <img src={bannerPreview} className="w-full h-full object-cover rounded-lg" alt="Banner Preview"/>}
                <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg"><CameraIcon className="w-8 h-8 text-white" /></button>
                <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" hidden />
                <div className="absolute -bottom-16 left-6 w-32 h-32 rounded-full border-4 border-secondary-light dark:border-secondary bg-tertiary-light dark:bg-tertiary">
                    {avatarPreview ? <img src={avatarPreview} className="w-full h-full rounded-full object-cover" alt="Avatar Preview"/> : <div className="w-full h-full rounded-full flex items-center justify-center text-text-tertiary-light dark:text-text-tertiary"><CameraIcon className="w-10 h-10" /></div>}
                    <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 rounded-full transition-opacity"><CameraIcon className="w-8 h-8 text-white" /></button>
                    <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" hidden />
                </div>
            </div>
            {/* ------------------------------------ */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="md:col-span-2"><label htmlFor="full_name" className="block text-text-secondary-light dark:text-text-secondary text-sm font-bold mb-2">Full Name <span className="text-red-500">*</span></label><input type="text" name="full_name" id="full_name" value={formData.full_name} onChange={handleChange} required className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main" /></div>
                
                <div>
                  <label className="block text-text-secondary-light dark:text-text-secondary text-sm font-bold mb-2">Campus</label>
                  <div className="w-full p-3 bg-primary-light dark:bg-primary border border-tertiary-light dark:border-gray-600 rounded-md text-sm text-text-secondary-light dark:text-text-secondary cursor-not-allowed">
                    {formData.campus ? (<>{formData.campus} <span className="text-xs text-text-tertiary-light dark:text-text-tertiary">(Auto-Detected)</span></>) : ('Detecting from email...')}
                  </div>
                </div>
                <div>
                  <label className="block text-text-secondary-light dark:text-text-secondary text-sm font-bold mb-2">Admission Year</label>
                   <div className="w-full p-3 bg-primary-light dark:bg-primary border border-tertiary-light dark:border-gray-600 rounded-md text-sm text-text-secondary-light dark:text-text-secondary cursor-not-allowed">
                     {formData.admission_year ? (<>{formData.admission_year} <span className="text-xs text-text-tertiary-light dark:text-text-tertiary">(Auto-Detected)</span></>) : ('Detecting from email...')}
                   </div>
                </div>
                
                <div className={showDualDegreeField ? 'col-span-1' : 'md:col-span-2'}><label htmlFor="branch" className="block text-text-secondary-light dark:text-text-secondary text-sm font-bold mb-2">Primary Degree <span className="text-red-500">*</span></label><select name="branch" id="branch" value={formData.branch} onChange={handleChange} required disabled={!formData.campus} className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main disabled:opacity-50"><option value="">Select Branch</option>{availableBranches.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
                {showDualDegreeField && (
                    <div><label htmlFor="dual_degree_branch" className="block text-text-secondary-light dark:text-text-secondary text-sm font-bold mb-2">B.E. Branch <span className="text-gray-400">(Optional)</span></label><select name="dual_degree_branch" id="dual_degree_branch" value={formData.dual_degree_branch} onChange={handleChange} className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main"><option value="">Select B.E. Branch</option>{formData.campus ? BITS_BRANCHES[formData.campus]['B.E.'].map(b => <option key={b} value={b}>{b}</option>): null}</select></div>
                )}
                
                <div className="md:col-span-2">
                    <label className="block text-text-secondary-light dark:text-text-secondary text-sm font-bold mb-2">Birthday</label>
                    <div className="grid grid-cols-3 gap-2">
                        <select name="birthday_day" value={formData.birthday_day} onChange={handleChange} className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main"><option value="">Day</option>{Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>)}</select>
                        <select name="birthday_month" value={formData.birthday_month} onChange={handleChange} className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main"><option value="">Month</option>{MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select>
                        <select name="birthday_year" value={formData.birthday_year} onChange={handleChange} className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main"><option value="">Year</option>{Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i - 16).map(y => <option key={y} value={y}>{y}</option>)}</select>
                    </div>
                </div>

                <div>
                    <label className="block text-text-secondary-light dark:text-text-secondary text-sm font-bold mb-2">Gender</label>
                    <div className="flex items-center space-x-4 mt-1">
                        <label className="flex items-center text-sm text-text-secondary-light dark:text-text-secondary"><input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} className="mr-2" />Male</label>
                        <label className="flex items-center text-sm text-text-secondary-light dark:text-text-secondary"><input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} className="mr-2" />Female</label>
                    </div>
                </div>

                <div><label htmlFor="relationship_status" className="block text-text-secondary-light dark:text-text-secondary text-sm font-bold mb-2">Relationship Status</label><select name="relationship_status" id="relationship_status" value={formData.relationship_status} onChange={handleChange} className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main"><option value="">Select Status</option>{RELATIONSHIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label htmlFor="dorm_building" className="block text-text-secondary-light dark:text-text-secondary text-sm font-bold mb-2">Dorm Building</label><input type="text" name="dorm_building" id="dorm_building" value={formData.dorm_building} onChange={handleChange} placeholder="e.g. Ram Bhawan" className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main" /></div>
                <div><label htmlFor="dorm_room" className="block text-text-secondary-light dark:text-text-secondary text-sm font-bold mb-2">Dorm Room</label><input type="text" name="dorm_room" id="dorm_room" value={formData.dorm_room} onChange={handleChange} placeholder="e.g. 101" className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main" /></div>
                <div className="md:col-span-2"><label htmlFor="dining_hall" className="block text-text-secondary-light dark:text-text-secondary text-sm font-bold mb-2">Dining Hall</label><select name="dining_hall" id="dining_hall" value={formData.dining_hall} onChange={handleChange} className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main"><option value="">Select Mess</option>{DINING_HALLS.map(hall => <option key={hall} value={hall}>{hall}</option>)}</select></div>
            </div>
            <div className="col-span-full"><label htmlFor="bio" className="block text-text-secondary-light dark:text-text-secondary text-sm font-bold mb-2">Bio</label><textarea name="bio" id="bio" value={formData.bio} onChange={handleChange} rows={3} placeholder="Intro de ..." className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main resize-y" /></div>
            {error && <p className="col-span-full text-red-400 text-center text-sm">{error}</p>}
            <div className="col-span-full mt-4"><button type="submit" disabled={isSaving || !formData.campus} className="w-full bg-brand-green text-black font-bold rounded-md py-3 transition duration-300 ease-in-out hover:bg-brand-green-darker disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? <Spinner /> : 'Save Profile & Continue'}</button></div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;