// src/pages/Home.tsx (Simplified)

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext'; // <-- 1. IMPORT usePosts
import PostComponent from '../components/Post';
import { Post as PostType, Profile } from '../types';
import { ImageIcon, XCircleIcon } from '../components/icons';
import Spinner from '../components/Spinner';

// MediaPreview and CreatePost components remain unchanged...
// ... (You can keep their code here as it was)

// HomePage Component (Updated and Simplified)
export const HomePage: React.FC = () => {
    // 2. GET a few things from the global context
    const { posts, loading: postsLoading, error: postsError } = usePosts();
    const { user } = useAuth(); // Still need this for the profile
    
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

    // This useEffect is now ONLY for the user's own profile for the create post box
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            setProfileLoading(true);
            const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
            if (error) console.error("Error fetching profile:", error);
            else setProfile(data);
            setProfileLoading(false);
        };
        fetchProfile();
    }, [user]);

    const handlePostCreated = (newPost: PostType) => {
        // This is a future improvement: you would ideally add the new post to the context here.
        // For now, a page reload would be required to see it, or you can implement an `addPost` function in the context.
        window.location.reload(); // Simple solution for now
    };

    if (postsLoading || profileLoading) {
        return <div className="text-center p-8"><Spinner /></div>;
    }

    if (postsError) {
        return <div className="text-center p-8 text-red-400">Error: {postsError}</div>;
    }

    return (
        <div className="w-full">
            {profile && <CreatePost onPostCreated={handlePostCreated} profile={profile} />}
            {posts.length > 0 ? (
                <div className="space-y-4">
                    {/* 3. The `onVoteSuccess` prop is gone. It's no longer needed. */}
                    {posts.map(post => <PostComponent key={post.id} post={post} />)}
                </div>
            ) : (
                <div className="bg-dark-secondary rounded-lg p-8 text-center text-gray-500">
                    <h3 className="text-xl font-semibold text-white">Welcome to BITS Connect!</h3>
                    <p className="mt-2">It's quiet in here. Be the first to share something!</p>
                </div>
            )}
        </div>
    );
};