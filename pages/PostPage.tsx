// src/pages/PostPage.tsx (Final Version with Correct Data Fetching)

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Comment as CommentType, Profile } from '../types';
import Spinner from '../components/Spinner';

// Comment Component
const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => { /* ... no changes here ... */ };

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  // We only get the core `user` object from the context
  const { user } = useAuth(); 
  
  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  // THIS IS THE FIX: This page will manage its own profile state for the comment box
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!postId) { setLoading(false); return; }
      setLoading(true);
      
      try {
        // Step 1: Fetch the main post
        const { data: postData, error: postError } = await supabase.from('posts').select('*, profiles(*)').eq('id', postId).single();
        if (postError || !postData) { setPost(null); return; }
        setPost(postData as any);

        // Step 2: Fetch the comments for that post
        const { data: commentsData } = await supabase.from('comments').select('*, profiles(*)').eq('post_id', postId).order('created_at', { ascending: true });
        setComments((commentsData as any) || []);

        // Step 3 (THE FIX): Fetch the profile of the currently logged-in user
        if (user) {
          const { data: profileData } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
          setCurrentUserProfile(profileData);
        }
      } catch (error) {
        console.error("Error fetching page data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [postId, user]); // Re-run if the user logs in/out

  const handleCommentSubmit = async (e: React.FormEvent) => {
    // ... (Your handleCommentSubmit logic is correct and remains the same) ...
  };

  if (loading) return <div className="text-center py-10"><Spinner /></div>;
  if (!post) return <div className="text-center py-10 text-red-400">Post not found.</div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="pointer-events-none"><PostComponent post={post} /></div>

      {/* THE FIX: This now checks the local state, which is guaranteed to be correct */}
      {currentUserProfile && (
        <div className="p-4 border-t border-b border-gray-800">
          <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
            <img src={currentUserProfile.avatar_url || `https://ui-avatars.com/api/?name=${currentUserProfile.username}`} alt="Your avatar" className="w-10 h-10 rounded-full bg-gray-700" />
            <div className="flex-1">
              <textarea
                value={newComment} onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post your reply"
                className="w-full bg-dark-tertiary rounded-lg p-2 text-white placeholder-gray-500"
                rows={2}
              />
              <div className="flex justify-end mt-2">
                <button type="submit" disabled={isSubmitting || !newComment.trim()} className="bg-bits-red text-white font-bold py-2 px-4 rounded-full disabled:opacity-50">
                  {isSubmitting ? <Spinner /> : 'Reply'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      <div>
        {comments.length > 0 ? (
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
