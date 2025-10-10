// src/pages/Home.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import PostComponent from '../components/Post';
import CreatePost from '../components/CreatePost';
import { Profile } from '../types';
import Spinner from '../components/Spinner';

export const HomePage: React.FC = () => {
    const { posts, loading: postsLoading, error: postsError, addPostToContext } = usePosts();
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);

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

    // Fade-in animation effect
    useEffect(() => {
        setIsVisible(true);
    }, []);

    if (postsLoading || profileLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Spinner />
                <p className="mt-4 text-text-secondary-light dark:text-text-secondary animate-pulse">Loading your feed...</p>
            </div>
        );
    }

    if (postsError) {
        return (
            <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-red-400 mb-2">Oops! Something went wrong</h3>
                    <p className="text-red-300">{postsError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[52rem] mx-auto relative">
            {/* Decorative background elements */}
            <div className="fixed top-20 right-10 w-72 h-72 bg-brand-green/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
            <div className="fixed bottom-20 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

            {/* Welcome Header with animation */}
            <div className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                <div className="relative bg-gradient-to-br from-brand-green/10 via-secondary-light to-secondary-light dark:from-brand-green/5 dark:via-secondary dark:to-secondary rounded-2xl p-8 shadow-lg border border-tertiary-light dark:border-tertiary overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 rounded-full blur-2xl"></div>
                    <div className="relative">
                        {/*<div className="flex items-center space-x-3 mb-2">
                               <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></div> 
                            <span className="text-sm font-semibold text-brand-green uppercase tracking-wider">Life is Unfair</span>
                        </div>*/}
                        <h1 className="text-3xl md:text-4xl font-bold text-text-main-light dark:text-text-main">
                            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 🔥 
                        </h1>
                        <p className="mt-2 text-text-secondary-light dark:text-text-secondary">
                            See what your friends are talking about and join the discussion.
                        </p>
                    </div>
                </div>
            </div>

            {/* Create Post Section */}
            {profile && (
                <div className={`mb-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                    <CreatePost onPostCreated={addPostToContext} profile={profile} />
                </div>
            )}

            {/* Posts Feed */}
            {posts.length > 0 ? (
                <div className="space-y-6">
                    {posts.map((post, index) => (
                        <div 
                            key={post.id}
                            className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                            style={{ transitionDelay: `${200 + index * 50}ms` }}
                        >
                            <PostComponent post={post} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    <div className="relative bg-gradient-to-br from-secondary-light to-tertiary-light dark:from-secondary dark:to-tertiary rounded-2xl p-12 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary overflow-hidden">
                        {/* Animated background circles */}
                        <div className="absolute top-0 left-1/4 w-32 h-32 bg-brand-green/5 rounded-full blur-2xl animate-pulse"></div>
                        <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                        
                        <div className="relative">
                            {/* Icon */}
                            <div className="w-24 h-24 bg-gradient-to-br from-brand-green/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                <svg className="w-12 h-12 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                </svg>
                            </div>

                            {/* Content */}
                            <h3 className="text-2xl md:text-3xl font-bold text-text-main-light dark:text-text-main mb-3">
                                Welcome to <span className="text-brand-green">litelelo</span>! 🎉
                            </h3>
                            <p className="text-lg text-text-secondary-light dark:text-text-secondary max-w-md mx-auto mb-6">
                                It's quiet in here. Be the first to share something amazing with the community!
                            </p>

                            {/* Call to action */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                                <div className="flex items-center space-x-2 text-sm text-text-tertiary-light dark:text-text-tertiary">
                                    <div className="w-8 h-8 bg-brand-green/10 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </div>
                                    <span>Share your thoughts</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-text-tertiary-light dark:text-text-tertiary">
                                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <span>Connect with others</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-text-tertiary-light dark:text-text-tertiary">
                                    <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                    </div>
                                    <span>Discover new ideas</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating scroll indicator for long feeds */}
            {posts.length > 3 && (
                <div className="fixed bottom-8 right-8 opacity-50 hover:opacity-100 transition-opacity duration-300">
                    <button 
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="w-12 h-12 bg-brand-green rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-300"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};