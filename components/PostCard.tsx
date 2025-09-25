import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Post as PostType } from '../types';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import CommentSection from './CommentSection';

const PostCard: React.FC<{ post: PostType }> = ({ post }) => {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(post.user_has_liked);
    const [likeCount, setLikeCount] = useState(post.like_count);
    const [commentCount, setCommentCount] = useState(post.comment_count);
    const [showComments, setShowComments] = useState(false);

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return `${Math.floor(interval)}y ago`;
        interval = seconds / 2592000;
        if (interval > 1) return `${Math.floor(interval)}mo ago`;
        interval = seconds / 86400;
        if (interval > 1) return `${Math.floor(interval)}d ago`;
        interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)}h ago`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)}m ago`;
        return `${Math.floor(seconds)}s ago`;
    };

    const handleLike = async () => {
        if (!user) return;
        
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);

        try {
            if (newLikedState) {
                const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: post.id });
                if (error) throw error;
            } else {
                const { error } = await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id });
                if (error) throw error;
            }
        } catch (error) {
            console.error("Error updating like:", error);
            setIsLiked(!newLikedState);
            setLikeCount(prev => !newLikedState ? prev + 1 : prev - 1);
        }
    };
    
    return (
        <article className="bg-dark-secondary rounded-lg mb-6">
            <div className="p-4">
                <div className="flex items-center">
                    <Link to={`/profile/${post.profiles?.username}`}>
                        <img
                            src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.username}&background=E53E3E&color=fff`}
                            alt={post.profiles?.username}
                            className="w-11 h-11 rounded-full object-cover"
                        />
                    </Link>
                    <div className="ml-3">
                        <Link to={`/profile/${post.profiles?.username}`} className="font-bold text-white">
                            {post.profiles?.full_name}
                        </Link>
                        <div className="text-xs text-gray-400">
                            <span>@{post.profiles?.username}</span>
                            <span className="mx-1">&middot;</span>
                            <span>{timeAgo(post.created_at)}</span>
                        </div>
                    </div>
                </div>
                <p className="mt-3 text-gray-300 whitespace-pre-wrap">{post.content}</p>
            </div>
            {post.image_url && (
                <div className="mt-2">
                    <img src={post.image_url} alt={`Post by ${post.profiles?.username}`} className="w-full object-cover max-h-[600px]" />
                </div>
            )}
            <div className="p-4">
                 <div className="flex items-center space-x-6 text-gray-400">
                    <button onClick={handleLike} className={`flex items-center space-x-2 transition-colors duration-200 ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                        <span>{likeCount}</span>
                    </button>
                    <button onClick={() => setShowComments(!showComments)} className="flex items-center space-x-2 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" /></svg>
                        <span>{commentCount}</span>
                    </button>
                </div>
            </div>
            {showComments && <CommentSection postId={post.id} onCommentPosted={() => setCommentCount(prev => prev + 1)} />}
        </article>
    );
};

export default PostCard;