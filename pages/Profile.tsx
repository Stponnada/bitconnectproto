// src/pages/Profile.tsx (Upgraded with all user details)

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Profile } from '../types';
import Spinner from '../components/Spinner';
import { ChatIcon } from '../components/icons';

// A reusable helper component for displaying details, as you designed.
const ProfileDetail: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    // If the value is empty or null, we don't render anything.
    if (!value) return null;
    return (
        <div>
            <span className="font-semibold text-gray-200">{label}: </span>
            <span className="text-gray-400">{value}</span>
        </div>
    );
};

// ... Your EditProfileModal component can go here when you're ready to build it ...

const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
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
        fetchProfileData();
    }, [username]);

    if (loading) return <div className="text-center py-10"><Spinner /></div>;
    if (!profile) return <div className="text-center py-10 text-red-400">User not found</div>;
    
    const isOwnProfile = currentUser?.id === profile.user_id;

    // --- Data formatting for display ---
    // This assumes a 4-year degree. You can add more logic here if needed.
    const graduationYear = profile.admission_year ? profile.admission_year + 4 : null;
    const dormInfo = profile.dorm_building ? `${profile.dorm_building}${profile.dorm_room ? `, Room ${profile.dorm_room}` : ''}` : null;

    return (
        <>
        {/* {isEditModalOpen && <EditProfileModal ... />} */}
        
        <div className="w-full max-w-4xl mx-auto pb-10">
            {/* Banner (placeholder) */}
            <div className="h-48 sm:h-64 bg-gray-800"></div>
            
            <div className="px-4 sm:px-6 relative">
                <div className="flex items-end -mt-16 sm:-mt-20">
                    {/* Avatar (placeholder) */}
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-black bg-gray-700 flex-shrink-0"></div>
                    <div className="ml-auto pb-4">
                        {isOwnProfile && <button onClick={() => setIsEditModalOpen(true)} className="bg-gray-700 text-white font-bold py-2 px-4 rounded-full hover:bg-gray-600">Edit Profile</button>}
                        {!isOwnProfile && <button className="flex items-center bg-bits-red text-white font-bold py-2 px-4 rounded-full hover:bg-red-700"><ChatIcon className="w-5 h-5 mr-2" />Message</button>}
                    </div>
                </div>

                {/* Main Info */}
                <div className="mt-4">
                    <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                    <p className="text-gray-400">@{profile.username}</p>
                    
                    {/* Campus and Class Year */}
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-400">
                        {profile.campus && <span>{profile.campus} Campus</span>}
                        {graduationYear && <span className="text-gray-500">&middot;</span>}
                        {graduationYear && <span>Class of {graduationYear}</span>}
                    </div>
                </div>

                {/* Bio */}
                {profile.bio && <p className="mt-4 text-gray-300 whitespace-pre-wrap">{profile.bio}</p>}
                
                <hr className="border-gray-700 my-6" />

                {/* ================================================================== */}
                {/* THE NEW INFO PANEL IS HERE */}
                {/* ================================================================== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <ProfileDetail label="Branch" value={profile.branch} />
                    <ProfileDetail label="Relationship Status" value={profile.relationship_status} />
                    <ProfileDetail label="Dorm" value={dormInfo} />
                    <ProfileDetail label="Dining Hall" value={profile.dining_hall} />
                </div>
                {/* ================================================================== */}

                {/* Posts Section */}
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