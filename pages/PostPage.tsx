// src/pages/PostPage.tsx (Updated)

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext'; // <-- 1. IMPORT GLOBAL POSTS
import PostComponent from '../components/Post';
import { Post as PostType, Comment as CommentType, Profile } from '../types';
import Spinner from '../components/Spinner';

// Comment Component is unchanged...
const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => {
  const author = comment.profiles;
  return (
    <div className="flex items-start space-x-3 p-4 border-b border-gray-800">
      <Link to={`/profile/${author?.username}`}>
        <img src={author?.avatar_url || `https://ui-avatars.com/api/?name=${author?.username}`} alt={author?.username || 'avatar'} className="w-10 h-10 rounded-full bg-gray-700 object-cover" />
      </Link>
      <div>
        <div className="flex items-center space-x-2">
            <Link to={`/profile/${author?.username}`} className="font-bold text-white hover:underline">{author?.full_name || author?.username}</Link>
            <p className="text-sm text-gray-500">@{author?.username}</p>
        </div>
        <p className="text-gray-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
};


const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  
  // 2. GET data from the global context
  const { posts, loading: postsLoading, updatePostInContext } = usePosts();

  // This page fetches its OWN data for comments and the current user's profile
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);

  // 3. FIND the specific post from the global state
  const post = posts.find(p => p.id === postId);

  useEffect(() => {
    // This effect now only fetches data specific to this page: comments and the user profile
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

        // Add the new comment to the local UI state
        const newCommentForUI: CommentType = { ...commentData, profiles: currentUserProfile };
        setComments(prev => [...prev, newCommentForUI]);
        
        // 4. THE FIX: Update the GLOBAL context with the new comment count
        const newCommentCount = post.comment_count + 1;
        updatePostInContext({
          id: post.id,
          comment_count: newCommentCount,
        });

        // Also update the database count in the background
        await supabase.rpc('increment_post_comment_count', { post_id_to_update: post.id });
        
        setNewComment('');
    } catch (error) {
        console.error("Error during comment submission process:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  // Show a spinner while the global posts are loading
  if (postsLoading) return <div className="text-center py-10"><Spinner /></div>;
  // If after loading, the post still isn't found, it doesn't exist.
  if (!post) return <div className="text-center py-10 text-red-400">Post not found.</div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* This component now reads its data from the same source as the homepage */}
      <PostComponent post={post} />

      {currentUserProfile && (
        <div className="p-4 border-t border-b border-gray-800">
          <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
            <img src={currentUserProfile.avatar_url || `https://ui-avatars.com/api/?name=${currentUserProfile.username}`} alt="Your avatar" className="w-10 h-10 rounded-full bg-gray-700 object-cover" />
            <div className="flex-1">
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Post your reply" className="w-full bg-dark-tertiary rounded-lg p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bits-red" rows={2} />
              <div className="flex justify-end mt-2">
                <button type="submit" disabled={isSubmitting || !newComment.trim()} className="bg-bits-red text-white font-bold py-2 px-4 rounded-full disabled:opacity-50 hover:bg-red-700">
                  {isSubmitting ? <Spinner /> : 'Reply'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      <div>
        {commentsLoading ? <div className="text-center py-8"><Spinner/></div> :
         comments.length > 0 ? (
          comments.map(comment => <Comment key={comment.id} comment={comment} />)
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No Comments Yet.</p>
            <p>Be the first one to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostPage;