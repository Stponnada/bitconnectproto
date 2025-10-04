// src/pages/MentionsPage.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Post as PostType } from '../types';
import PostComponent from '../components/Post';
import Spinner from '../components/Spinner';

const MentionsPage: React.FC = () => {
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMentions = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: rpcError } = await supabase.rpc('get_mentioned_posts');
                if (rpcError) throw rpcError;
                setPosts(data as PostType[] || []);
            } catch (err: any) {
                console.error("Error fetching mentions:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMentions();
    }, []);

    if (loading) {
        return <div className="text-center p-8"><Spinner /></div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-400">Error: {error}</div>;
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Mentions</h1>
            {posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map(post => <PostComponent key={post.id} post={post} />)}
                </div>
            ) : (
                <div className="bg-dark-secondary rounded-lg p-8 text-center text-gray-500">
                    <h3 className="text-xl font-semibold text-white">Nothing to see here yet</h3>
                    <p className="mt-2">When someone mentions you in a post, you'll see it here.</p>
                </div>
            )}
        </div>
    );
};

export default MentionsPage;