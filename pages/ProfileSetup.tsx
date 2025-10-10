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
  const [currentStep, setCurrentStep] = useState(1);
  
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
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-secondary-light to-primary-light dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-text-main-light dark:text-text-main mb-3 bg-gradient-to-r from-brand-green to-emerald-400 bg-clip-text text-transparent">
            Welcome to BITS Connect
          </h1>
          <p className="text-lg text-text-secondary-light dark:text-text-secondary">
            Let's create your profile and get you connected
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10 px-4">
          <div className="flex items-center space-x-2 md:space-x-4">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all duration-300 ${
                  currentStep >= step 
                    ? 'bg-brand-green text-black scale-110' 
                    : 'bg-tertiary-light dark:bg-tertiary text-text-tertiary-light dark:text-text-tertiary'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`h-1 w-12 md:w-20 rounded transition-all duration-300 ${
                    currentStep > step ? 'bg-brand-green' : 'bg-tertiary-light dark:bg-tertiary'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-secondary-light dark:bg-secondary rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
          <form onSubmit={handleSubmit}>
            {/* Banner & Avatar Section */}
            <div className="relative">
              <div className="relative h-48 md:h-56 bg-gradient-to-r from-brand-green/20 to-emerald-400/20 dark:from-brand-green/10 dark:to-emerald-400/10 group">
                {bannerPreview ? (
                  <img src={bannerPreview} className="w-full h-full object-cover" alt="Banner Preview"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-text-tertiary-light dark:text-text-tertiary">
                      <CameraIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Add a cover photo</p>
                    </div>
                  </div>
                )}
                <button 
                  type="button" 
                  onClick={() => bannerInputRef.current?.click()} 
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <div className="text-center text-white">
                    <CameraIcon className="w-10 h-10 mx-auto mb-2" />
                    <span className="text-sm font-medium">Change Cover</span>
                  </div>
                </button>
                <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" hidden />
              </div>

              {/* Avatar */}
              <div className="absolute -bottom-16 md:-bottom-20 left-1/2 transform -translate-x-1/2">
                <div className="relative group">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-secondary-light dark:border-secondary bg-tertiary-light dark:bg-tertiary shadow-xl overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="w-full h-full object-cover" alt="Avatar Preview"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-tertiary-light dark:text-text-tertiary">
                        <CameraIcon className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => avatarInputRef.current?.click()} 
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <CameraIcon className="w-8 h-8 text-white" />
                  </button>
                  <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" hidden />
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="px-6 md:px-10 pt-20 md:pt-24 pb-8 space-y-8">
              {/* Step 1: Basic Info */}
              <div className={`space-y-6 transition-all duration-500 ${currentStep === 1 ? 'block' : 'hidden'}`}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-2">Basic Information</h3>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary">Tell us about yourself</p>
                </div>

                <div>
                  <label htmlFor="full_name" className="block text-text-secondary-light dark:text-text-secondary text-sm font-semibold mb-2">
                    Full Name <span className="text-brand-green">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="full_name" 
                    id="full_name" 
                    value={formData.full_name} 
                    onChange={handleChange} 
                    required 
                    className="w-full p-4 bg-tertiary-light dark:bg-tertiary border-2 border-transparent focus:border-brand-green rounded-xl text-text-main-light dark:text-text-main transition-all duration-300 outline-none"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-text-secondary-light dark:text-text-secondary text-sm font-semibold mb-2">Campus</label>
                    <div className="w-full p-4 bg-gradient-to-r from-brand-green/10 to-emerald-400/10 border-2 border-brand-green/30 rounded-xl text-text-main-light dark:text-text-main">
                      {formData.campus ? (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{formData.campus}</span>
                          <span className="text-xs bg-brand-green/20 text-brand-green px-2 py-1 rounded-full">Auto-detected</span>
                        </div>
                      ) : (
                        'Detecting from email...'
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-text-secondary-light dark:text-text-secondary text-sm font-semibold mb-2">Admission Year</label>
                    <div className="w-full p-4 bg-gradient-to-r from-brand-green/10 to-emerald-400/10 border-2 border-brand-green/30 rounded-xl text-text-main-light dark:text-text-main">
                      {formData.admission_year ? (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{formData.admission_year}</span>
                          <span className="text-xs bg-brand-green/20 text-brand-green px-2 py-1 rounded-full">Auto-detected</span>
                        </div>
                      ) : (
                        'Detecting from email...'
                      )}
                    </div>
                  </div>
                </div>

                <div className={`grid gap-6 ${showDualDegreeField ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <label htmlFor="branch" className="block text-text-secondary-light dark:text-text-secondary text-sm font-semibold mb-2">
                      Primary Degree <span className="text-brand-green">*</span>
                    </label>
                    <select 
                      name="branch" 
                      id="branch" 
                      value={formData.branch} 
                      onChange={handleChange} 
                      required 
                      disabled={!formData.campus}
                      className="w-full p-4 bg-tertiary-light dark:bg-tertiary border-2 border-transparent focus:border-brand-green rounded-xl text-text-main-light dark:text-text-main disabled:opacity-50 transition-all duration-300 outline-none"
                    >
                      <option value="">Select Branch</option>
                      {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  {showDualDegreeField && (
                    <div>
                      <label htmlFor="dual_degree_branch" className="block text-text-secondary-light dark:text-text-secondary text-sm font-semibold mb-2">
                        B.E. Branch <span className="text-text-tertiary-light dark:text-text-tertiary text-xs">(Optional)</span>
                      </label>
                      <select 
                        name="dual_degree_branch" 
                        id="dual_degree_branch" 
                        value={formData.dual_degree_branch} 
                        onChange={handleChange}
                        className="w-full p-4 bg-tertiary-light dark:bg-tertiary border-2 border-transparent focus:border-brand-green rounded-xl text-text-main-light dark:text-text-main transition-all duration-300 outline-none"
                      >
                        <option value="">Select B.E. Branch</option>
                        {formData.campus ? BITS_BRANCHES[formData.campus]['B.E.'].map(b => <option key={b} value={b}>{b}</option>) : null}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => setCurrentStep(2)}
                    className="px-8 py-3 bg-brand-green hover:bg-brand-green-darker text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Next Step →
                  </button>
                </div>
              </div>

              {/* Step 2: Personal Details */}
              <div className={`space-y-6 transition-all duration-500 ${currentStep === 2 ? 'block' : 'hidden'}`}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-2">Personal Details</h3>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary">Help others get to know you better</p>
                </div>

                <div>
                  <label className="block text-text-secondary-light dark:text-text-secondary text-sm font-semibold mb-3">Gender</label>
                  <div className="flex gap-4">
                    {['Male', 'Female'].map((gender) => (
                      <label 
                        key={gender}
                        className={`flex-1 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                          formData.gender === gender 
                            ? 'border-brand-green bg-brand-green/10' 
                            : 'border-tertiary-light dark:border-gray-700 hover:border-brand-green/50'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="gender" 
                          value={gender} 
                          checked={formData.gender === gender} 
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <span className="text-text-main-light dark:text-text-main font-medium">{gender}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-text-secondary-light dark:text-text-secondary text-sm font-semibold mb-2">Birthday</label>
                  <div className="grid grid-cols-3 gap-3">
                    <select 
                      name="birthday_day" 
                      value={formData.birthday_day} 
                      onChange={handleChange}
                      className="w-full p-4 bg-tertiary-light dark:bg-tertiary border-2 border-transparent focus:border-brand-green rounded-xl text-text-main-light dark:text-text-main transition-all duration-300 outline-none"
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d.toString().padStart(2, '0')}>{d}</option>)}
                    </select>
                    <select 
                      name="birthday_month" 
                      value={formData.birthday_month} 
                      onChange={handleChange}
                      className="w-full p-4 bg-tertiary-light dark:bg-tertiary border-2 border-transparent focus:border-brand-green rounded-xl text-text-main-light dark:text-text-main transition-all duration-300 outline-none"
                    >
                      <option value="">Month</option>
                      {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select 
                      name="birthday_year" 
                      value={formData.birthday_year} 
                      onChange={handleChange}
                      className="w-full p-4 bg-tertiary-light dark:bg-tertiary border-2 border-transparent focus:border-brand-green rounded-xl text-text-main-light dark:text-text-main transition-all duration-300 outline-none"
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i - 16).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="relationship_status" className="block text-text-secondary-light dark:text-text-secondary text-sm font-semibold mb-2">Relationship Status</label>
                  <select 
                    name="relationship_status" 
                    id="relationship_status" 
                    value={formData.relationship_status} 
                    onChange={handleChange}
                    className="w-full p-4 bg-tertiary-light dark:bg-tertiary border-2 border-transparent focus:border-brand-green rounded-xl text-text-main-light dark:text-text-main transition-all duration-300 outline-none"
                  >
                    <option value="">Select Status</option>
                    {RELATIONSHIP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-text-secondary-light dark:text-text-secondary text-sm font-semibold mb-2">Bio</label>
                  <textarea 
                    name="bio" 
                    id="bio" 
                    value={formData.bio} 
                    onChange={handleChange} 
                    rows={4}
                    placeholder="Tell us about yourself... your interests, hobbies, or anything you'd like to share!"
                    className="w-full p-4 bg-tertiary-light dark:bg-tertiary border-2 border-transparent focus:border-brand-green rounded-xl text-text-main-light dark:text-text-main resize-y transition-all duration-300 outline-none"
                  />
                </div>

                <div className="flex justify-between">
                  <button 
                    type="button" 
                    onClick={() => setCurrentStep(1)}
                    className="px-8 py-3 bg-tertiary-light dark:bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-700 text-text-main-light dark:text-text-main font-bold rounded-xl transition-all duration-300"
                  >
                    ← Back
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setCurrentStep(3)}
                    className="px-8 py-3 bg-brand-green hover:bg-brand-green-darker text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Next Step →
                  </button>
                </div>
              </div>

              {/* Step 3: Campus Life */}
              <div className={`space-y-6 transition-all duration-500 ${currentStep === 3 ? 'block' : 'hidden'}`}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-2">Campus Life</h3>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary">Where can people find you on campus?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="dorm_building" className="block text-text-secondary-light dark:text-text-secondary text-sm font-semibold mb-2">Dorm Building</label>
                    <input 
                      type="text" 
                      name="dorm_building" 
                      id="dorm_building" 
                      value={formData.dorm_building} 
                      onChange={handleChange}
                      placeholder="e.g. Ram Bhawan"
                      className="w-full p-4 bg-tertiary-light dark:bg-tertiary border-2 border-transparent focus:border-brand-green rounded-xl text-text-main-light dark:text-text-main transition-all duration-300 outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="dorm_room" className="block text-text-secondary-light dark:text-text-secondary text-sm font-semibold mb-2">Dorm Room</label>
                    <input 
                      type="text" 
                      name="dorm_room" 
                      id="dorm_room" 
                      value={formData.dorm_room} 
                      onChange={handleChange}
                      placeholder="e.g. 101"
                      className="w-full p-4 bg-tertiary-light dark:bg-tertiary border-2 border-transparent focus:border-brand-green rounded-xl text-text-main-light dark:text-text-main transition-all duration-300 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dining_hall" className="block text-text-secondary-light dark:text-text-secondary text-sm font-semibold mb-2">Dining Hall</label>
                  <select 
                    name="dining_hall" 
                    id="dining_hall" 
                    value={formData.dining_hall} 
                    onChange={handleChange}
                    className="w-full p-4 bg-tertiary-light dark:bg-tertiary border-2 border-transparent focus:border-brand-green rounded-xl text-text-main-light dark:text-text-main transition-all duration-300 outline-none"
                  >
                    <option value="">Select Mess</option>
                    {DINING_HALLS.map(hall => <option key={hall} value={hall}>{hall}</option>)}
                  </select>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border-2 border-red-500 rounded-xl">
                    <p className="text-red-500 text-center font-medium">{error}</p>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button 
                    type="button" 
                    onClick={() => setCurrentStep(2)}
                    className="px-8 py-3 bg-tertiary-light dark:bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-700 text-text-main-light dark:text-text-main font-bold rounded-xl transition-all duration-300"
                  >
                    ← Back
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving || !formData.campus || !formData.full_name}
                    className="px-8 py-3 bg-gradient-to-r from-brand-green to-emerald-400 hover:from-brand-green-darker hover:to-emerald-500 text-black font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Spinner />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Profile</span>
                        <span>✓</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Tips */}
        <div className="mt-8 text-center">
          <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">
            💡 Tip: Add a profile picture and cover photo to make your profile stand out!
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProfileSetup;