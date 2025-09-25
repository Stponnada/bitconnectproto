import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import Spinner from '../components/Spinner';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
      fullName: '', username: '', bio: '', campus: '', admissionYear: '', branch: '', relationshipStatus: '', dormBuilding: '', dormRoom: '', diningHall: '', clubs: ''
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (profile) {
            setFormData({
              fullName: profile.full_name || '',
              username: profile.username || '',
              bio: profile.bio || '',
              campus: profile.campus || '',
              admissionYear: profile.admission_year?.toString() || '',
              branch: profile.branch || '',
              relationshipStatus: profile.relationship_status || '',
              dormBuilding: profile.dorm_building || '',
              dormRoom: profile.dorm_room || '',
              diningHall: profile.dining_hall || '',
              clubs: profile.clubs || '',
            });
            setAvatarPreview(profile.avatar_url || null);
            setBannerPreview(profile.banner_url || null);
        }
    }, [profile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
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

    const uploadFile = async (file: File, bucket: string, userId: string) => {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data.publicUrl;
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !profile) return;
        setLoading(true);
        setMessage('');
        setError('');

        try {
            let avatarUrl = profile.avatar_url;
            if (avatarFile) {
                avatarUrl = await uploadFile(avatarFile, 'avatars', user.id);
            }
            let bannerUrl = profile.banner_url;
            if (bannerFile) {
                bannerUrl = await uploadFile(bannerFile, 'avatars', user.id);
            }

            const updates = {
                user_id: user.id,
                full_name: formData.fullName,
                username: formData.username,
                bio: formData.bio,
                campus: formData.campus,
                admission_year: parseInt(formData.admissionYear, 10),
                branch: formData.branch,
                relationship_status: formData.relationshipStatus,
                dorm_building: formData.dormBuilding,
                dorm_room: formData.dormRoom,
                dining_hall: formData.diningHall,
                clubs: formData.clubs,
                avatar_url: avatarUrl,
                banner_url: bannerUrl,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            setMessage('Profile updated successfully!');
            setTimeout(() => navigate(`/profile/${formData.username}`), 1000);
        } catch (error: any) {
            setError(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    if (authLoading || !profile) return <div className="flex justify-center items-center h-screen"><Spinner isRed={true} /></div>

    const InputField = ({ label, name, value, ...props }: any) => (
      <div className="grid grid-cols-3 gap-4 items-start">
        <label htmlFor={name} className="text-right font-semibold pt-2">{label}</label>
        <input name={name} id={name} value={value} onChange={handleInputChange} {...props} className="col-span-2 p-2 bg-dark-tertiary border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bits-red" />
      </div>
    );
     const TextareaField = ({ label, name, value, ...props }: any) => (
      <div className="grid grid-cols-3 gap-4 items-start">
        <label htmlFor={name} className="text-right font-semibold pt-2">{label}</label>
        <textarea name={name} id={name} value={value} onChange={handleInputChange} {...props} className="col-span-2 p-2 bg-dark-tertiary border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bits-red"></textarea>
      </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto bg-dark-secondary p-8 rounded-lg">
            <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
                 <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="text-right font-semibold">Profile Picture</div>
                    <div className="col-span-2 flex items-center space-x-4">
                        <img src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.username}`} alt="Avatar" className="w-16 h-16 rounded-full bg-dark-tertiary object-cover" />
                        <label htmlFor="avatar-upload" className="cursor-pointer text-sm font-semibold text-bits-red hover:underline">Change Photo</label>
                        <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                    </div>
                </div>
                 <div className="grid grid-cols-3 gap-4 items-center">
                    <div className="text-right font-semibold">Banner</div>
                    <div className="col-span-2 flex items-center space-x-4">
                        <div className="w-32 h-16 rounded bg-dark-tertiary">{bannerPreview && <img src={bannerPreview} className="w-full h-full object-cover rounded" />}</div>
                        <label htmlFor="banner-upload" className="cursor-pointer text-sm font-semibold text-bits-red hover:underline">Change Banner</label>
                        <input id="banner-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                    </div>
                </div>
                
                <InputField label="Full Name" name="fullName" value={formData.fullName} />
                <InputField label="Username" name="username" value={formData.username} />
                <TextareaField label="Bio" name="bio" value={formData.bio} rows={3} />

                <div className="pt-4 mt-4 border-t border-dark-tertiary">
                   <InputField label="Dorm Building" name="dormBuilding" value={formData.dormBuilding} placeholder="e.g. Ram Bhawan"/>
                   <InputField label="Dorm Room" name="dormRoom" value={formData.dormRoom} placeholder="e.g. 101" />
                   <InputField label="Dining Hall" name="diningHall" value={formData.diningHall} placeholder="e.g. Mess 1" />
                   <TextareaField label="Clubs" name="clubs" value={formData.clubs} placeholder="e.g. ACM Student Chapter, Saavan"/>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div></div>
                    <div className="col-span-2">
                        <button type="submit" disabled={loading} className="bg-bits-red text-white font-semibold rounded-md py-2 px-6 disabled:bg-red-900 transition-colors hover:bg-red-700">
                            {loading ? <Spinner /> : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {message && <p className="text-center text-green-400">{message}</p>}
                {error && <p className="text-center text-red-400">{error}</p>}
            </form>
        </div>
    );
};

export default Settings;