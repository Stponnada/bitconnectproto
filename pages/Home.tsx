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
        const { data, error } = await supabase.rpc('get_posts_with_likes');
        
        if (error) {
            setError(error.message);
            console.error("Error fetching posts:", error);
        } else {
            setPosts(data as PostType[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchPosts(); // Initial fetch

        const channel = supabase
          .channel('public-feed')
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
    
    // Provides instant UI feedback for the user who created the post.
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
        <div className="space-y-6">
            <CreatePost onPostCreated={handlePostCreated} />
            <div>
                {posts.length > 0 ? (
                    posts.map(post => <PostCard key={post.id} post={post} />)
                ) : (
                    !loading && (
                      <div className="text-center text-gray-500 mt-20">
                          <h2 className="text-2xl font-semibold">Welcome to BITS Connect</h2>
                          <p>No posts yet. Be the first to share something!</p>
                      </div>
                    )
                )}
            </div>
        </div>
    );
};

export default Home;