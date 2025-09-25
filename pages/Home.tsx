// src/pages/Home.tsx (or wherever HomePage.tsx is)

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Post as PostComponent } from '../components/Post'; // Assuming component is named Post
import { Post as PostType, Profile } from '../types';
import { ImageIcon, XCircleIcon } from '../components/icons'; // Assuming you have these icons

// A simpler MediaPreview for a single image
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

// CreatePost Component - Rewritten for your data structure
const CreatePost: React.FC<{ onPostCreated: (post: PostType) => void, profile: Profile }> = ({ onPostCreated, profile }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Cleanup object URLs to prevent memory leaks
    useEffect(() => {
        if (imageFile) {
            const url = URL.createObjectURL(imageFile);
            return () => URL.revokeObjectURL(url);
        }
    }, [imageFile]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setImageFile(event.target.files[0]); // Only take the first file
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
        let imageUrl: string | null = null;

        // 1. If there's an image, upload it to Supabase Storage
        if (imageFile) {
            const filePath = `${user.id}/${Date.now()}-${imageFile.name}`;
            const { error: uploadError } = await supabase.storage.from('post_images').upload(filePath, imageFile); // Assuming a 'post_images' bucket

            if (uploadError) {
                console.error('Upload error:', uploadError);
                setIsSubmitting(false);
                return;
            }
            const { data: { publicUrl } } = supabase.storage.from('post_images').getPublicUrl(filePath);
            imageUrl = publicUrl;
        }

        // 2. Insert the new post record into the 'posts' table
        const { data: newPostData, error: insertError } = await supabase
            .from('posts')
            .insert({ user_id: user.id, content: content.trim(), image_url: imageUrl })
            .select()
            .single();

        if (insertError) {
            console.error('Database error:', insertError);
            setIsSubmitting(false);
            return;
        }

        // 3. Create a complete post object for an optimistic UI update
        const postForUI: PostType = {
            ...newPostData,
            profiles: profile, // Attach the user's profile data for immediate display
            like_count: 0,
            comment_count: 0,
            user_has_liked: false,
        };
        onPostCreated(postForUI);

        // 4. Reset form
        setContent('');
        setImageFile(null);
        setIsSubmitting(false);
    };

    const canPost = (content.trim() || imageFile) && !isSubmitting;

    return (
        <div className="bg-bits-light-dark rounded-lg shadow p-5 mb-6">
            <div className="flex items-start">
                <img src={profile.avatar_url || '/default-avatar.png'} alt={profile.username} className="w-12 h-12 rounded-full mr-4" />
                <form onSubmit={handleSubmit} className="w-full">
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full bg-bits-medium-dark rounded-lg p-3 text-bits-text placeholder-bits-text-muted focus:outline-none focus:ring-2 focus:ring-bits-red resize-none"
                        rows={3}
                        placeholder={`What's on your mind, ${profile.full_name?.split(' ')[0] || profile.username}?`}
                    />
                    {imageFile && <MediaPreview file={imageFile} onRemove={removeImageFile} />}
                    <div className="flex justify-between items-center mt-3">
                        <div className="flex space-x-2">
                            <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" hidden />
                            <button type="button" onClick={() => imageInputRef.current?.click()} className="text-bits-text-muted hover:text-blue-500 p-2 rounded-full transition-colors">
                                <ImageIcon />
                            </button>
                            {/* Removed the video icon as the schema supports one image */}
                        </div>
                        <button type="submit" className="bg-bits-red text-white font-bold py-2 px-6 rounded-full hover:bg-red-700 transition-colors duration-200 disabled:opacity-50" disabled={!canPost}>
                            {isSubmitting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// HomePage Component - Rewritten to fetch data from Supabase
export const HomePage: React.FC = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<PostType[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);

            // 1. Fetch current user's profile for the CreatePost component
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (profileError) console.error("Error fetching profile:", profileError);
            else setProfile(profileData);

            // 2. Fetch all posts with their author's profile, using the 'profiles' join property
            const { data: postsData, error: postsError } = await supabase
                .from('posts')
                .select(`*, profiles(*)`) // Supabase join syntax
                .order('created_at', { ascending: false });

            if (postsError) console.error("Error fetching posts:", postsError);
            else setPosts(postsData as any); // Use 'as any' as a temporary bridge if Supabase types conflict

            setLoading(false);
        };
        fetchData();
    }, [user]);

    const handlePostCreated = (newPost: PostType) => {
        setPosts(currentPosts => [newPost, ...currentPosts]);
    };

    if (loading) {
        return <div className="text-center p-8 text-white">Loading BITS Connect feed...</div>;
    }

    return (
        <div className="w-full max-w-2xl mx-auto py-6">
            {profile && <CreatePost onPostCreated={handlePostCreated} profile={profile} />}
            {posts.length > 0 ? (
                posts.map(post => (
                    <PostComponent key={post.id} post={post} />
                ))
            ) : (
                <div className="bg-bits-light-dark rounded-lg p-8 text-center text-bits-text-muted">
                    <h3 className="text-xl font-semibold text-bits-text">Welcome to BITS Connect!</h3>
                    <p className="mt-2">It's quiet in here. Be the first to share something!</p>
                </div>
            )}
        </div>
    );
};