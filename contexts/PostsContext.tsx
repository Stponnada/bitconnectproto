// src/contexts/PostsContext.tsx (Updated for Speed)

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Post as PostType } from '../types';
import { useAuth } from './AuthContext';

interface PostsContextType {
  posts: PostType[];
  loading: boolean;
  error: string | null;
  addPostToContext: (newPost: PostType) => void;
  updatePostInContext: (updatedPost: Partial<PostType> & { id: string }) => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // THE FIX: We no longer use the slow RPC function.
      // This is a simple, indexed, and extremely fast query.
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*, profiles(*)') // Supabase automatically joins the author's profile
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setPosts((data as PostType[]) || []);
    } catch (err: any) {
      console.error("Error fetching posts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const addPostToContext = (newPost: PostType) => {
    setPosts(currentPosts => [newPost, ...currentPosts]);
  };

  const updatePostInContext = useCallback((updatedPost: Partial<PostType> & { id: string }) => {
    setPosts(currentPosts =>
      currentPosts.map(post =>
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post
      )
    );
  }, []);

  const value = { posts, loading, error, addPostToContext, updatePostInContext };

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