// src/pages/Profile.tsx (Simplified)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext'; // <-- 1. IMPORT usePosts
import PostComponent from '../components/Post';
import { Post as PostType, Profile } from '../types';
import Spinner from '../components/Spinner';
import { CameraIcon } from '../components/icons';

// EditProfileModal and ProfileDetail components remain unchanged...
// ... (You can keep their code here as it was)

// ProfilePage Component (Updated and Simplified)
const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const { posts, loading: postsLoading } = usePosts(); // <-- 2. GET posts from context

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // This function now ONLY fetches the profile data. Posts come from the context.
    const fetchProfileData = useCallback(async () => {
        if (!username) return;
        setProfileLoading(true);
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('username', username).single();
            if (error || !data) throw error || new Error("Profile not found");
            setProfile(data);
        } catch (error) {
            console.error("Error fetching profile data:", error);
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    }, [username]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    if (profileLoading || postsLoading) {
        return <div className="flex items-center justify-center h-screen"><Spinner /></div>;
    }
    
    if (!profile) return <div className="text-center py-10 text-xl text-red-400">User not found.</div>;
    
    // 3. Filter the posts from the global state on the fly.
    const userPosts = posts.filter(post => post.user_id === profile.user_id);
    
    const isOwnProfile = currentUser?.id === profile.user_id;
    const graduationYear = profile.admission_year ? profile.admission_year + 4 : null;
    const dormInfo = profile.dorm_building ? `${profile.dorm_building}${profile.dorm_room ? `, Room ${profile.dorm_room}` : ''}` : null;

    return (
        <>
            {isEditModalOpen && <EditProfileModal userProfile={profile} onClose={() => setIsEditModalOpen(false)} onSave={fetchProfileData} />}
            
            <div className="w-full">
                {/* ... The rest of the JSX for profile details remains the same ... */}

                <div className="mt-8">
                    <h2 className="text-xl font-bold border-b border-gray-700 pb-2">Posts</h2>
                    <div className="mt-4 space-y-4">
                        {/* 4. The `onVoteSuccess` prop is gone. */}
                        {userPosts.length > 0 
                            ? userPosts.map(post => <PostComponent key={post.id} post={post} />) 
                            : <p className="text-center text-gray-500 py-8">No posts yet.</p>
                        }
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfilePage;