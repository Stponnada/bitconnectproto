// src/contexts/PostsContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Post as PostType } from '../types';
import { useAuth } from './AuthContext';

interface PostsContextType {
  posts: PostType[];
  loading: boolean;
  error: string | null;
  updatePostInContext: (updatedPost: Partial<PostType> & { id: string }) => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.rpc('get_posts_with_details');
      if (fetchError) throw fetchError;
      setPosts(data || []);
    } catch (err: any) {
      console.error("Error fetching posts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch posts only when the user is logged in.
    if (user) {
      fetchPosts();
    }
  }, [user, fetchPosts]);

  const updatePostInContext = useCallback((updatedPost: Partial<PostType> & { id: string }) => {
    setPosts(currentPosts =>
      currentPosts.map(post =>
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post
      )
    );
  }, []);

  const value = { posts, loading, error, updatePostInContext };

  return (
    <PostsContext.Provider value={value}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};