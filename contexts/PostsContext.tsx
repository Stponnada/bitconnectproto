// src/contexts/PostsContext.tsx

import React, { createContext, useState, useEffect, useCallback } from 'react'; // REMOVED useContext
import { supabase } from '../services/supabase';
import { Post as PostType } from '../types';
import { useAuth } from '../hooks/useAuth'; // <-- UPDATE THIS IMPORT

interface PostsContextType {
  posts: PostType[];
  loading: boolean;
  error: string | null;
  addPostToContext: (newPost: PostType) => void;
  updatePostInContext: (updatedPost: Partial<PostType> & { id: string }) => void;
}

// EXPORT this so the hook can import it
export const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ... the inside of the PostsProvider component remains exactly the same ...
  // ... from `const { user } = useAuth();` to `</PostsContext.Provider>;`
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.rpc('get_posts_with_details');
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

// --- THE usePosts HOOK HAS BEEN REMOVED FROM THIS FILE ---