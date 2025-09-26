// src/pages/Profile.tsx (Final Version with Edit Modal and Image Uploads)

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Profile } from '../types';
import Spinner from '../components/Spinner';
import { ChatIcon, CameraIcon } from '../components/icons'; // Assuming you have a CameraIcon

// ==================================================================
// The fully functional EditProfileModal
// ==================================================================
const EditProfileModal: React.FC<{ userProfile: Profile, onClose: () => void, onSave: () => void }> = ({ userProfile, onClose, onSave }) => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(userProfile);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.avatar_url);
    const [bannerPreview, setBannerPreview] = useState<string | null>(userProfile.banner_url);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setProfileData(prev => ({ ...prev, [name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        setError('');

        try {
            let avatar_url = profileData.avatar_url;
            let banner_url = profileData.banner_url;

            // Upload Avatar if a new one was selected
            if (avatarFile) {
                const filePath = `public/${user.id}/avatar.${avatarFile.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                avatar_url = `${publicUrl}?t=${new Date().getTime()}`; // Add timestamp to bust cache
            }

            // Upload Banner if a new one was selected
            if (bannerFile) {
                const filePath = `public/${user.id}/banner.${bannerFile.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, bannerFile, { upsert: true });
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                banner_url = `${publicUrl}?t=${new Date().getTime()}`;
            }

            // Update the profiles table with the new text and image URLs
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    ...profileData,
                    avatar_url,
                    banner_url,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);

            if (updateError) throw updateError;
            
            onSave(); // Tell the profile page to refetch data
            onClose();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-bits-light-dark rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-2xl font-bold text-bits-red mb-6">Edit Profile</h2>
                    
                    {/* Banner and Avatar Upload */}
                    <div className="relative h-48 bg-gray-700 rounded-t-lg mb-16">
                        {bannerPreview && <img src={bannerPreview} className="w-full h-full object-cover rounded-t-lg" />}
                        <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <CameraIcon className="w-8 h-8 text-white" />
                        </button>
                        <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" hidden />

                        <div className="absolute -bottom-16 left-6 w-32 h-32 rounded-full border-4 border-bits-light-dark bg-gray-600">
                            {avatarPreview && <img src={avatarPreview} className="w-full h-full rounded-full object-cover" />}
                            <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
                                <CameraIcon className="w-8 h-8 text-white" />
                            </button>
                            <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" hidden />
                        </div>
                    </div>

                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    
                    {/* Text Fields */}
                    <div className="space-y-4 pt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Full Name</label>
                            <input type="text" name="full_name" value={profileData.full_name || ''} onChange={handleChange} className="mt-1 block w-full bg-bits-medium-dark rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Bio</label>
                            <textarea name="bio" value={profileData.bio || ''} onChange={handleChange} rows={3} className="mt-1 block w-full bg-bits-medium-dark rounded p-2 text-white" />
                        </div>
                        {/* Add all your other form fields here */}
                    </div>

                    <div className="flex justify-end space-x-4 pt-6">
                        <button type="button" onClick={onClose} className="py-2 px-6 rounded-full text-white hover:bg-gray-700">Cancel</button>
                        <button type="submit" disabled={isSaving} className="py-2 px-6 rounded-full text-white bg-bits-red hover:bg-red-700 disabled:opacity-50">
                            {isSaving ? <Spinner /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ==================================================================
// ProfilePage: The main component that fetches and displays data
// ==================================================================
const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchProfileData = async () => {
        if (!username) return;
        setLoading(true);
        const { data: profileData } = await supabase.from('profiles').select('*').eq('username', username).single();
        if (profileData) {
            setProfile(profileData);
            const { data: postsData } = await supabase.from('posts').select('*, profiles(*)').eq('user_id', profileData.user_id).order('created_at', { ascending: false });
            setPosts((postsData as any) || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProfileData();
    }, [username]);

    if (loading) return <div className="text-center py-10"><Spinner /></div>;
    if (!profile) return <div className="text-center py-10 text-red-400">User not found</div>;
    
    const isOwnProfile = currentUser?.id === profile.user_id;

    return (
        <>
        {isEditModalOpen && <EditProfileModal userProfile={profile} onClose={() => setIsEditModalOpen(false)} onSave={fetchProfileData} />}
        
        <div className="w-full max-w-4xl mx-auto pb-10">
            <div className="h-48 sm:h-64 bg-gray-800">
                {profile.banner_url ? <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-700"></div>}
            </div>
            
            <div className="px-4 sm:px-6 relative">
                <div className="flex items-end -mt-16 sm:-mt-20">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-black bg-gray-700 flex-shrink-0">
                        {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center text-4xl font-bold">{(profile.full_name || '?').charAt(0)}</div>}
                    </div>
                    <div className="ml-auto pb-4">
                        {isOwnProfile && <button onClick={() => setIsEditModalOpen(true)} className="bg-gray-700 text-white font-bold py-2 px-4 rounded-full hover:bg-gray-600">Edit Profile</button>}
                        {!isOwnProfile && <button className="flex items-center bg-bits-red text-white font-bold py-2 px-4 rounded-full hover:bg-red-700"><ChatIcon className="w-5 h-5 mr-2" />Message</button>}
                    </div>
                </div>

                {/* The rest of your profile display JSX */}
                <div className="mt-4">
                    <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                    <p className="text-gray-400">@{profile.username}</p>
                </div>
                {/* ... other details ... */}

                <div className="mt-8">
                    <h2 className="text-xl font-bold">Posts</h2>
                    <div className="mt-4 space-y-4">
                        {posts.length > 0 ? (
                            posts.map(post => <PostComponent key={post.id} post={post} />)
                        ) : (<p className="text-center text-gray-500 py-8">No posts yet.</p>)}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default ProfilePage;