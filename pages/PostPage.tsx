// src/pages/PostPage.tsx (Corrected with Guard Clauses)

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Comment as CommentType, Profile } from '../types';
import Spinner from '../components/Spinner';

// ... (Your Comment component remains the same) ...
const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => { /* ... */ };

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  
  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      // ... (Your useEffect data fetching logic is correct and remains the same) ...
    };
    fetchAllData();
  }, [postId, user]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    // ... (Your handleCommentSubmit logic is correct and remains the same) ...
  };

  // ==================================================================
  // THE FIX IS HERE: These two "guard clauses" prevent the crash.
  // ==================================================================
  
  // Guard Clause 1: If we are still fetching data, show a spinner.
  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Spinner /></div>;
  }

  // Guard Clause 2: If loading is finished AND the post still wasn't found, show an error.
  if (!post) {
    return <div className="text-center py-10 text-xl text-red-400">Post not found.</div>;
  }

  // If we get past these two checks, we are GUARANTEED that 'post' is a valid object.
  // Now, it is safe to render the main component.
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="pointer-events-none"><PostComponent post={post} /></div>

      {currentUserProfile && (
        <div className="p-4 border-t border-b border-gray-800">
          <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
            <img src={currentUserProfile.avatar_url || `https://ui-avatars.com/api/?name=${currentUserProfile.username}`} alt="Your avatar" className="w-10 h-10 rounded-full bg-gray-700" />
            <div className="flex-1">
              <textarea
                value={newComment} onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post your reply"
                className="w-full bg-dark-tertiary rounded-lg p-2 text-white"
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