
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Post as PostType } from '../types';
import PostCard from './PostCard';
import Spinner from './Spinner';

interface FeedProps {
  userId?: string;
  newPost?: any;
}

const Feed: React.FC<FeedProps> = ({ userId, newPost }) => {
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        let query = supabase.rpc('get_posts_with_likes');

        if (userId) {
            query = query.eq('user_id', userId);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        
        if (error) {
            setError(error.message);
            console.error("Error fetching posts:", error);
        } else {
            setPosts(data as PostType[]);
        }
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    useEffect(() => {
        if (newPost) {
           const formattedNewPost = {
              ...newPost,
              like_count: 0,
              user_has_liked: false
           };
           setPosts(prevPosts => [formattedNewPost, ...prevPosts]);
        }
    }, [newPost]);

    if (loading) {
        return <div className="flex justify-center p-8"><Spinner /></div>;
    }

    if (error) {
        return <div className="text-red-500 p-4">Error loading feed: {error}</div>;
    }
    
    if (posts.length === 0) {
        return <div className="text-gray-400 text-center p-8">No posts yet. Be the first to share!</div>;
    }

    return (
        <div>
            {posts.map(post => (
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
};

export default Feed;
