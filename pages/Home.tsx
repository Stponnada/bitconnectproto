// src/pages/Home.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Profile } from '../types';
import { ImageIcon, XCircleIcon } from '../components/icons';
import Spinner from '../components/Spinner';

// MediaPreview Component (No changes)
const MediaPreview: React.FC<{ file: File, onRemove: () => void }> = ({ file, onRemove }) => {
    const url = URL.createObjectURL(file);
    return (
        <div className="mt-3 relative group w-48 h-48">
            <img src={url} alt={file.name} className="w-full h-full object-cover rounded-lg" />
            <button
                onClick={onRemove}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove media"
            >
                <XCircleIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

// CreatePost Component (No changes)
const CreatePost: React.FC<{ onPostCreated: (post: PostType) => void, profile: Profile }> = ({ onPostCreated, profile }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            return () => URL.revokeObjectURL(url);
        }
    }, [imageFile]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setImageFile(event.target.files[0]);
        }
        event.target.value = '';
    };

    const removeImageFile = () => {
        setImageFile(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || (!content.trim() && !imageFile)) return;
        setIsSubmitting(true);
        setError(null);
        let imageUrl: string | null = null;
        try {
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const sanitizedFileName = `${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${sanitizedFileName}`;
                const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, imageFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(filePath);
                imageUrl = publicUrl;
            }
            const { data: newPostData, error: insertError } = await supabase.from('posts').insert({ user_id: user.id, content: content.trim(), image_url: imageUrl }).select().single();
            if (insertError) throw insertError;
            const postForUI: PostType = {
                ...newPostData,
                profiles: profile,
                like_count: 0,
                dislike_count: 0,
                comment_count: 0,
                user_has_liked: false,
            };
            onPostCreated(postForUI);
            setContent('');
            setImageFile(null);
        } catch (error: any) {
            console.error('Error creating post:', error);
            setError(`Upload failed: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canPost = (content.trim() || imageFile) && !isSubmitting;
    const displayName = profile.full_name || profile.username || 'User';
    const avatarUrl = profile.avatar_url;
    const avatarInitial = displayName.charAt(0).toUpperCase();

    return (
        <div className="bg-dark-secondary rounded-lg shadow p-5 mb-6 border border-dark-tertiary">
            <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-full h-full rounded-full object-cover"
                        />
                    ) : (
                        <span className="text-white text-xl">{avatarInitial}</span>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="w-full">
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full bg-dark-tertiary rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bits-red resize-none border border-gray-600"
                        rows={3}
                        placeholder={`What's on your mind, ${displayName.split(' ')[0] || profile.username}?`}
                    />

                    {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
                    {imageFile && <MediaPreview file={imageFile} onRemove={removeImageFile} />}
                    <div className="flex justify-between items-center mt-3">
                        <div className="flex space-x-2">
                            <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" hidden />
                            <button type="button" onClick={() => imageInputRef.current?.click()} className="text-gray-400 hover:text-blue-500 p-2 rounded-full transition-colors"><ImageIcon /></button>
                        </div>
                        <button type="submit" className="bg-bits-red text-white font-bold py-2 px-6 rounded-full hover:bg-red-700 transition-colors duration-200 disabled:opacity-50" disabled={!canPost}>
                            {isSubmitting ? <Spinner /> : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// HomePage Component (Updated)
export const HomePage: React.FC = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<PostType[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        // Fetch profile data (no change here)
        const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
        if (profileError) console.error("Error fetching profile:", profileError);
        else setProfile(profileData);

        // THE FIX: Call the RPC function to get posts with calculated counts
        const { data: postsData, error: postsError } = await supabase
            .rpc('get_posts_with_details');

        if (postsError) {
            console.error("Error fetching posts:", postsError);
        } else {
            setPosts(postsData as any);
        }

        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePostCreated = (newPost: PostType) => {
        setPosts(currentPosts => [newPost, ...currentPosts]);
    };

    if (loading) {
        return <div className="text-center p-8"><Spinner /></div>;
    }

    return (
        <div className="w-full">
            {profile && <CreatePost onPostCreated={handlePostCreated} profile={profile} />}
            {posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map(post => <PostComponent key={post.id} post={post} onVoteSuccess={fetchData} />)}
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