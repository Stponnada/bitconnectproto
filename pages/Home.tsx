import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Post as PostType } from '../types';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import Spinner from '../components/Spinner';

const Home: React.FC = () => {
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .rpc('get_posts_with_likes')
            .order('created_at', { ascending: false });
        
        if (error) {
            setError(error.message);
            console.error("Error fetching posts:", error);
        } else {
            setPosts(data as PostType[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPosts();

        const channel = supabase
          .channel('posts-feed')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
            fetchPosts();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => {
            fetchPosts();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
            fetchPosts();
          })
          .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPosts]);

    const handlePostCreated = (newPost: PostType) => {
      setPosts(currentPosts => [newPost, ...currentPosts]);
    }

    if (loading && posts.length === 0) {
        return <div className="flex justify-center items-center h-64"><Spinner isRed={true} /></div>;
    }

    if (error) {
        return <div className="text-red-400 p-4 text-center">Error loading feed: {error}</div>;
    }

    return (
        <div>
            <CreatePost onPostCreated={handlePostCreated} />
            <div className="mt-6">
                {posts.length > 0 ? (
                    posts.map(post => <PostCard key={post.id} post={post} />)
                ) : (
                    <div className="text-center text-gray-500 mt-20">
                        <h2 className="text-2xl font-semibold">Welcome to BITS Connect</h2>
                        <p>No posts yet. Be the first to share something!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;