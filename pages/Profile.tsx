// src/pages/Profile.tsx (Corrected with the final import fix)

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
// ==================================================================
// THE FIX IS HERE:
// Corrected the import to handle the default export from Post.tsx.
import PostComponent from '../components/Post';
// ==================================================================
import { Post as PostType, Profile } from '../types';
import Spinner from '../components/Spinner';
import { ChatIcon } from '../components/icons';

// ==================================================================
// EditProfileModal: Manages the pop-up form and saves data to Supabase
// ==================================================================
const EditProfileModal: React.FC<{ userProfile: Profile, onClose: () => void, onSave: () => void }> = ({ userProfile, onClose, onSave }) => {
    const [profile, setProfile] = useState(userProfile);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile.full_name?.trim()) {
            setError('Full Name is a required field.');
            return;
        }
        setIsSaving(true);
        setError('');

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                full_name: profile.full_name,
                bio: profile.bio,
                // You can add all the other fields from your form here
            })
            .eq('user_id', profile.user_id);

        if (updateError) {
            setError(updateError.message);
        } else {
            onSave();
            onClose();
        }
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-bits-light-dark rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-8">
                    <h2 className="text-2xl font-bold text-bits-red mb-6">Edit Profile</h2>
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-bits-text-muted">Full Name <span className="text-bits-red">*</span></label>
                            <input type="text" name="full_name" value={profile.full_name || ''} onChange={handleChange} required className="mt-1 block w-full bg-bits-medium-dark rounded-md p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-bits-text-muted">Bio</label>
                            <textarea name="bio" value={profile.bio || ''} onChange={handleChange} rows={3} className="mt-1 block w-full bg-bits-medium-dark rounded-md p-2 text-white" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-6">
                        <button type="button" onClick={onClose} className="py-2 px-6 rounded-full text-white hover:bg-bits-medium-dark">Cancel</button>
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
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchProfileData = async () => {
        if (!username) return;
        setLoading(true);

        const { data: profileData, error: profileError } = await supabase
            .from('profiles').select('*').eq('username', username).single();
        
        if (profileError || !profileData) {
            setError("User not found.");
            setLoading(false);
            return;
        }
        
        setProfile(profileData);

        const { data: postsData } = await supabase
            .from('posts').select('*, profiles(*)').eq('user_id', profileData.user_id).order('created_at', { ascending: false });
        
        setPosts((postsData as any) || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchProfileData();
    }, [username]);

    if (loading) return <div className="text-center py-10"><Spinner /></div>;
    if (error || !profile) return <div className="text-center py-10 text-red-400">{error}</div>;
    
    const isOwnProfile = currentUser?.id === profile.user_id;

    return (
        <>
        {isEditModalOpen && <EditProfileModal userProfile={profile} onClose={() => setIsEditModalOpen(false)} onSave={fetchProfileData} />}
        
        <div className="w-full max-w-4xl mx-auto pb-10">
            <div className="h-48 sm:h-64 bg-gray-700">{profile.banner_url && <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />}</div>
            
            <div className="px-4 sm:px-6 relative">
                <div className="flex items-end -mt-16 sm:-mt-20">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-bits-dark bg-bits-dark">
                        {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-gray-600"></div>}
                    </div>
                    <div className="ml-auto pb-4">
                        {isOwnProfile && <button onClick={() => setIsEditModalOpen(true)} className="bg-bits-medium-dark text-white font-bold py-2 px-4 rounded-full hover:bg-bits-light-dark">Edit Profile</button>}
                        {!isOwnProfile && <button className="flex items-center bg-bits-red text-white font-bold py-2 px-4 rounded-full hover:bg-red-700"><ChatIcon className="w-5 h-5 mr-2" />Message</button>}
                    </div>
                </div>

                <div className="mt-4">
                    <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                    <p className="text-bits-text-muted">@{profile.username}</p>
                </div>

                <div className="mt-8 border-t border-bits-medium-dark">
                    <h2 className="text-xl font-bold px-4 sm:px-6 pt-6">Posts</h2>
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