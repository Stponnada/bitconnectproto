// src/hooks/usePosts.ts

import { useContext } from 'react';
import { PostsContext } from '../contexts/PostsContext';

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};