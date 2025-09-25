
import React, { useState } from 'react';
import { Post as PostType } from '../types';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

const HeartIcon = ({ filled }: { filled: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-colors duration-200 ${filled ? 'text-red-500' : 'text-gray-500'}`} viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" strokeWidth={filled ? 0 : 1.5} />
    </svg>
);
const CommentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;

const PostCard: React.FC<{ post: PostType }> = ({ post }) => {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(post.user_has_liked);
    const [likeCount, setLikeCount] = useState(post.like_count);

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m";
        return Math.floor(seconds) + "s";
    };

    const handleLike = async () => {
        if (!user) return;
        
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

        if (newLikedState) {
            const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: post.id });
            if (error) {
                console.error("Error liking post:", error);
                setIsLiked(false);
                setLikeCount(prev => prev - 1);
            }
        } else {
            const { error } = await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id });
            if (error) {
                console.error("Error unliking post:", error);
                setIsLiked(true);
                setLikeCount(prev => prev + 1);
            }
        }
    };

    return (
        <div className="p-4 border-b border-gray-800 hover:bg-gray-900/50 transition-colors duration-200">
            <div className="flex space-x-4">
                <img src={post.profiles?.avatar_url || `https://picsum.photos/seed/${post.user_id}/50`} alt="avatar" className="w-12 h-12 rounded-full bg-gray-700" />
                <div className="flex-1">
                    <div className="flex items-center space-x-2">
                        <span className="font-bold">{post.profiles?.full_name || post.profiles?.username || 'Anonymous'}</span>
                        <span className="text-gray-500 text-sm">@{post.profiles?.username || 'anon'}</span>
                        <span className="text-gray-500 text-sm">&middot;</span>
                        <span className="text-gray-500 text-sm">{timeAgo(post.created_at)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap">{post.content}</p>
                    {post.image_url && (
                        <img src={post.image_url} alt="post" className="mt-3 rounded-lg border border-gray-700 max-h-96 w-auto" />
                    )}
                    <div className="flex items-center space-x-8 mt-4">
                        <button onClick={handleLike} className="flex items-center space-x-2 text-gray-500 hover:text-red-500">
                            <HeartIcon filled={isLiked} />
                            <span>{likeCount}</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-500 hover:text-green-400">
                            <CommentIcon />
                            <span>0</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
