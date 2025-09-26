// src/pages/Profile.tsx (Corrected with a robust loading state)

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Profile } from '../types';
import Spinner from '../components/Spinner';
import { ChatIcon, CameraIcon } from '../components/icons';

// ... (Your EditProfileModal component remains the same and can go here) ...
const EditProfileModal: React.FC<{ userProfile: Profile, onClose: () => void, onSave: () => void }> = ({ userProfile, onClose, onSave }) => {
    // ... all the modal logic ...
};

// ==================================================================
// The Main Profile Page Component
// ==================================================================
const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // This is the corrected data fetching logic
    const fetchProfileData = async () => {
        if (!username) return;
        setLoading(true);

        try {
            // Step 1: Fetch the profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single();
            
            // If the user doesn't exist, stop here.
            if (profileError || !profileData) {
                setProfile(null);
                return; // The 'finally' block below will still run
            }

            setProfile(profileData);

            // Step 2: If profile exists, fetch their posts
            const { data: postsData } = await supabase
                .from('posts')
                .select('*, profiles(*)')
                .eq('user_id', profileData.user_id)
                .order('created_at', { ascending: false });
            
            setPosts((postsData as any) || []);

        } catch (error) {
            console.error("Error fetching profile data:", error);
            setProfile(null); // Clear data on error
        } finally {
            // THIS IS THE FIX: This block is GUARANTEED to run,
            // whether the fetch succeeded or failed.
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, [username]);

    // This is our loading state render
    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Spinner /></div>;
    }

    // This handles the case where the profile was not found
    if (!profile) {
        return <div className="text-center py-10 text-xl text-red-400">User not found.</div>;
    }
    
    // The rest of your component JSX...
    const isOwnProfile = currentUser?.id === profile.user_id;
    const graduationYear = profile.admission_year ? profile.admission_year + 4 : null;
    const dormInfo = profile.dorm_building ? `${profile.dorm_building}${profile.dorm_room ? `, Room ${profile.dorm_room}` : ''}` : null;

    return (
        <>
            {isEditModalOpen && <EditProfileModal userProfile={profile} onClose={() => setIsEditModalOpen(false)} onSave={fetchProfileData} />}
            
            <div className="w-full max-w-4xl mx-auto pb-10">
                <div className="h-48 sm:h-64 bg-gray-800">
                    {profile.banner_url && <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />}
                </div>
                <div className="px-4 sm:px-6 relative">
                    <div className="flex items-end -mt-16 sm:-mt-20">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-black bg-gray-700 flex-shrink-0">
                            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center text-4xl font-bold">{(profile.full_name || '?').charAt(0)}</div>}
                        </div>
                        <div className="ml-auto pb-4">{isOwnProfile && <button onClick={() => setIsEditModalOpen(true)} className="bg-gray-700 text-white font-bold py-2 px-4 rounded-full hover:bg-gray-600">Edit Profile</button>}</div>
                    </div>
                    <div className="mt-4">
                        <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                        <p className="text-gray-400">@{profile.username}</p>
                        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-400">
                            {profile.campus && <span>{profile.campus} Campus</span>}
                            {graduationYear && <span className="text-gray-500">&middot;</span>}
                            {graduationYear && <span>Class of {graduationYear}</span>}
                        </div>
                    </div>
                    {profile.bio && <p className="mt-4 text-gray-300 whitespace-pre-wrap">{profile.bio}</p>}
                    <hr className="border-gray-700 my-6" />
                    {/* ... Your ProfileDetail components ... */}
                    <div className="mt-8">
                        <h2 className="text-xl font-bold">Posts</h2>
                        <div className="mt-4 space-y-4">{posts.length > 0 ? (posts.map(post => <PostComponent key={post.id} post={post} />)) : (<p className="text-center text-gray-500 py-8">No posts yet.</p>)}</div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfilePage;