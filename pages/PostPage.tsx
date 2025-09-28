// src/pages/PostPage.tsx (Updated for Simplicity)

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import PostComponent from '../components/Post';
import { Post as PostType, Comment as CommentType, Profile } from '../types';
import Spinner from '../components/Spinner';

// Comment Component is unchanged...
const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => {
    // ... same as before
};

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { posts, loading: postsLoading, updatePostInContext } = usePosts();

  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);

  const post = posts.find(p => p.id === postId);

  useEffect(() => {
    const fetchPageSpecificData = async () => {
        if (!postId) return;
        setCommentsLoading(true);

        const { data: commentsData, error: commentsError } = await supabase.from('comments').select('*, profiles(*)').eq('post_id', postId).order('created_at', { ascending: true });
        if (commentsError) console.error("Error fetching comments:", commentsError);
        else setComments((commentsData as any) || []);

        if (user) {
          const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
          if (profileError) console.error("Error fetching user profile:", profileError);
          else setCurrentUserProfile(profileData);
        }
        setCommentsLoading(false);
    }
    fetchPageSpecificData();
  }, [postId, user]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !newComment.trim() || !currentUserProfile) return;
    setIsSubmitting(true);

    try {
        const { data: commentData, error: commentError } = await supabase.from('comments').insert({ post_id: post.id, user_id: user.id, content: newComment.trim() }).select().single();
        if (commentError) throw commentError;

        const newCommentForUI: CommentType = { ...commentData, profiles: currentUserProfile };
        setComments(prev => [...prev, newCommentForUI]);
        
        const newCommentCount = post.comment_count + 1;
        updatePostInContext({
          id: post.id,
          comment_count: newCommentCount,
        });
        
        // THE FIX: No longer need to call an RPC. The database trigger handles it automatically.
        // await supabase.rpc('increment_post_comment_count', { post_id_to_update: post.id });
        
        setNewComment('');
    } catch (error) {
        console.error("Error during comment submission process:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (postsLoading) return <div className="text-center py-10"><Spinner /></div>;
  if (!post) return <div className="text-center py-10 text-red-400">Post not found.</div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* ... rest of the component is the same */}
    </div>
  );
};

export default PostPage;