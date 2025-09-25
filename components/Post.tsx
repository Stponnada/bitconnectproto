import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Post as PostType } from '../types';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

const Post: React.FC<{ post: PostType }> = ({ post }) => {
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(post.user_has_liked);
    const [likeCount, setLikeCount] = useState(post.like_count);

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
            // Revert optimistic update on error
            setIsLiked(!newLikedState);
            setLikeCount(prev => !newLikedState ? prev + 1 : prev - 1);
        }
    };

    return (
        <article className="border-b border-gray-800 mb-6">
            <div className="flex items-center p-4">
                <Link to={`/${post.profiles?.username}`}>
                    <img
                        src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.username}&background=0D8ABC&color=fff`}
                        alt={post.profiles?.username}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                </Link>
                <Link to={`/${post.profiles?.username}`} className="ml-3 font-semibold text-sm">
                    {post.profiles?.username}
                </Link>
            </div>
            <div>
                <img src={post.image_url} alt={`Post by ${post.profiles?.username}`} className="w-full object-cover" />
            </div>
            <div className="p-4">
                <div className="flex items-center space-x-4">
                    <button onClick={handleLike}>
                        <i className={`${isLiked ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart text-2xl`}></i>
                    </button>
                     <button>
                        <i className="fa-regular fa-comment text-2xl"></i>
                    </button>
                </div>
                <div className="mt-2 text-sm font-semibold">
                    {likeCount} likes
                </div>
                <div className="mt-1 text-sm">
                    <Link to={`/${post.profiles?.username}`} className="font-semibold mr-2">{post.profiles?.username}</Link>
                    <span>{post.content}</span>
                </div>
            </div>
        </article>
    );
};

export default Post;
