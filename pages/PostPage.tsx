// src/pages/PostPage.tsx (Final Version)

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Comment as CommentType, Profile } from '../types';
import Spinner from '../components/Spinner';

// ... (Your Comment component is correct) ...

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user, profile } = useAuth();
  
  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      if (!postId) return;
      setLoading(true);
      try {
        // THE FIX IS HERE: We no longer use parseInt(). We use the postId string directly.
        const { data: postData } = await supabase.from('posts').select('*, profiles(*)').eq('id', postId).single();
        setPost(postData as any);
        
        if (postData) {
            const { data: commentsData } = await supabase.from('comments').select('*, profiles(*)').eq('post_id', postId).order('created_at', { ascending: true });
            setComments((commentsData as any) || []);
        }
      } catch (error) { console.error("Error fetching data:", error); }
      finally { setLoading(false); }
    };
    fetchPostAndComments();
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !newComment.trim()) return;
    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: user.id, content: newComment.trim() })
      .select('*, profiles(*)')
      .single();

    if (error) {
      console.error("Error posting comment:", error);
    } else if (data) {
      setComments(prev => [...prev, data as any]);
      setNewComment('');
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="text-center py-10"><Spinner /></div>;
  if (!post) return <div className="text-center py-10 text-red-400">Post not found.</div>;

  return (
    // ... (The rest of your JSX is correct) ...
  );
};

export default PostPage;