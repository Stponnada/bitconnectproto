// src/pages/PostPage.tsx (Corrected with a robust loading state)

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Comment as CommentType } from '../types';
import Spinner from '../components/Spinner';

// Comment Component (No changes needed)
const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => { /* ... */ };

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
      if (!postId) {
        setLoading(false);
        return;
      }
      setLoading(true);

      try {
        // Step 1: Fetch the main post
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*, profiles(*)')
          .eq('id', postId)
          .single();

        // If the post isn't found, stop here. 'finally' will still run.
        if (postError || !postData) {
          console.error("Error fetching post:", postError);
          setPost(null);
          return;
        }
        setPost(postData as any);

        // Step 2: If the post was found, fetch its comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*, profiles(*)')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (commentsError) {
          console.error("Error fetching comments:", commentsError);
        } else {
          setComments((commentsData as any) || []);
        }

      } catch (error) {
        console.error("A critical error occurred:", error);
        setPost(null);
      } finally {
        // THIS IS THE FIX: This block is GUARANTEED to run,
        // no matter what happens in the 'try' block.
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [postId]);
  
  const handleCommentSubmit = async (e: React.FormEvent) => {
    // ... (Your existing handleCommentSubmit logic remains the same) ...
  };

  // This is our loading state render
  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Spinner /></div>;
  }

  // This handles the case where the post was not found
  if (!post) {
    return <div className="text-center py-10 text-xl text-red-400">Post not found.</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="pointer-events-none"><PostComponent post={post} /></div>
      
      {/* Your comment form JSX */}
      {profile && (
        <div className="p-4 border-t border-b border-gray-800">
          <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
            <img src={profile.avatar_url || ''} alt="Your avatar" className="w-10 h-10 rounded-full bg-gray-700" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
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
      
      {/* Your comment list JSX */}
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