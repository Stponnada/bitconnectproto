// src/pages/Home.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import PostComponent from '../components/Post';
import CreatePost from '../components/CreatePost'; // <-- Import the new component
import { Profile } from '../types';
import Spinner from '../components/Spinner';

export const HomePage: React.FC = () => {
    const { posts, loading: postsLoading, error: postsError, addPostToContext } = usePosts();
    const { user } = useAuth();
    
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);

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

    if (postsLoading || profileLoading) {
        return <div className="text-center p-8"><Spinner /></div>;
    }

    if (postsError) {
        return <div className="text-center p-8 text-red-400">Error: {postsError}</div>;
    }

    return (
        <div className="max-w-[52rem] mx-auto">
            {profile && (
                <div className="mb-6"> {/* 👈 Added margin below the CreatePost box */}
                    <CreatePost onPostCreated={addPostToContext} profile={profile} />
                </div>
            )}

            {posts.length > 0 ? (
                <div className="space-y-6"> {/* 👈 Slightly increased spacing between posts */}
                    {posts.map(post => (
                        <PostComponent key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="bg-secondary-light dark:bg-secondary rounded-lg p-8 text-center text-text-tertiary-light dark:text-text-tertiary">
                    <h3 className="text-xl font-semibold text-text-main-light dark:text-text-main">Welcome to litelelo!</h3>
                    <p className="mt-2">It's quiet in here. Be the first to share something!</p>
                </div>
            )}
        </div>
    );

};