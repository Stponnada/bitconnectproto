// src/pages/PostPage.tsx (Final Version with Comment Form and Messages)

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Comment as CommentType } from '../types';
import Spinner from '../components/Spinner';

// Comment Component
const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => { /* ... no changes here ... */ };

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user, profile } = useAuth();
  
  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // ... (Your existing fetchPostAndComments logic remains the same) ...
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    // ... (Your existing handleCommentSubmit logic remains the same) ...
  };

  if (loading) return <div className="text-center py-10"><Spinner /></div>;
  if (!post) return <div className="text-center py-10 text-red-400">Post not found.</div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Disable pointer events on the main post so you can't click it again */}
      <div className="pointer-events-none">
        <PostComponent post={post} />
      </div>

      {/* ================================================================== */}
      {/* THE COMMENT FORM IS HERE */}
      {/* ================================================================== */}
      {profile && (
        <div className="p-4 border-t border-b border-gray-800">
          <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
            <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}`} alt="Your avatar" className="w-10 h-10 rounded-full bg-gray-700" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post your reply"
                className="w-full bg-dark-tertiary rounded-lg p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bits-red"
                rows={2}
              />
              <div className="flex justify-end mt-2">
                <button type="submit" disabled={isSubmitting || !newComment.trim()} className="bg-bits-red text-white font-bold py-2 px-4 rounded-full disabled:opacity-50 hover:bg-red-700">
                  {isSubmitting ? <Spinner /> : 'Reply'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* ================================================================== */}
      {/* THE COMMENT LIST AND "NO COMMENTS" MESSAGE ARE HERE */}
      {/* ================================================================== */}
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