// src/pages/Home.tsx

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import PostComponent from '../components/Post';
import { Post as PostType, Profile } from '../types';
import { ImageIcon, XCircleIcon } from '../components/icons';
import Spinner from '../components/Spinner';

// CreatePost Component
const CreatePost: React.FC<{ onPostCreated: (post: PostType) => void, profile: Profile }> = ({ onPostCreated, profile }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

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
            const { data: newPostData, error: insertError } = await supabase
                .from('posts')
                .insert({ user_id: user.id, content: content.trim(), image_url: imageUrl })
                .select()
                .single();

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
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setImageFile(event.target.files[0]);
        }
        event.target.value = '';
    };

    const removeImageFile = () => {
        setImageFile(null);
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
                        <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span className="text-white text-xl">{avatarInitial}</span>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="w-full">
                    <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full bg-dark-tertiary rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green resize-none border border-gray-600" rows={3} placeholder={`What's on your mind, ${displayName.split(' ')[0] || profile.username}?`} />
                    {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
                    {imageFile && <MediaPreview file={imageFile} onRemove={removeImageFile} />}
                    <div className="flex justify-between items-center mt-3">
                        <div className="flex space-x-2">
                            <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" hidden />
                            <button type="button" onClick={() => imageInputRef.current?.click()} className="text-gray-400 hover:text-blue-500 p-2 rounded-full transition-colors"><ImageIcon /></button>
                        </div>
                        <button type="submit" className="bg-brand-green text-black font-bold py-2 px-6 rounded-full hover:bg-brand-green-darker transition-colors duration-200 disabled:opacity-50" disabled={!canPost}>
                            {isSubmitting ? <Spinner /> : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const MediaPreview: React.FC<{ file: File, onRemove: () => void }> = ({ file, onRemove }) => {
    const url = URL.createObjectURL(file);
    useEffect(() => {
        return () => URL.revokeObjectURL(url);
    }, [url]);
    return (
        <div className="mt-3 relative group w-48 h-48">
            <img src={url} alt={file.name} className="w-full h-full object-cover rounded-lg" />
            <button onClick={onRemove} className="absolute top-1 right-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove media">
                <XCircleIcon className="w-6 h-6" />
            </button>
        </div>
    );
};

// HomePage Component
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
        <div className="max-w-3xl mx-auto">
            {profile && <CreatePost onPostCreated={addPostToContext} profile={profile} />}
            {posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map(post => <PostComponent key={post.id} post={post} />)}
                </div>
            ) : (
                <div className="bg-dark-secondary rounded-lg p-8 text-center text-gray-500">
                    <h3 className="text-xl font-semibold text-white">Welcome to litelelo!</h3>
                    <p className="mt-2">It's quiet in here. Be the first to share something!</p>
                </div>
            )}
        </div>
    );
};