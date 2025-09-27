// src/pages/PostPage.tsx (Corrected Syntax and with Debugging)

import React, { useState, useEffect } from 'react'; // <-- THE SYNTAX FIX IS HERE
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Comment as CommentType } from '../types';
import Spinner from '../components/Spinner';

// Comment Component
const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => {
  const author = comment.profiles;
  return (
    <div className="flex items-start space-x-3 p-4 border-b border-gray-800">
      <img src={author?.avatar_url || `https://ui-avatars.com/api/?name=${author?.username}`} alt={author?.username || 'avatar'} className="w-10 h-10 rounded-full bg-gray-700" />
      <div>
        <div className="flex items-center space-x-2">
          <p className="font-bold text-white">{author?.full_name || author?.username}</p>
          <p className="text-sm text-gray-500">@{author?.username}</p>
        </div>
        <p className="text-gray-300 mt-1">{comment.content}</p>
      </div>
    </div>
  );
};

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user, profile } = useAuth();
  
  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // ... useEffect logic is correct ...
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] handleCommentSubmit initiated.');

    console.log('[DEBUG] Checking conditions:', { user, post, newComment });
    if (!user || !post || !newComment.trim()) {
      console.log('[DEBUG] A condition failed. Exiting silently.');
      return;
    }

    setIsSubmitting(true);
    
    const commentData = {
      post_id: post.id,
      user_id: user.id,
      content: newComment.trim(),
    };

    console.log('[DEBUG] Attempting to insert:', commentData);

    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select('*, profiles(*)')
      .single();

    console.log('[DEBUG] Supabase response:', { data, error });

    if (error) {
      console.error("Error posting comment (from catch block):", error);
    } else if (data) {
      console.log('[DEBUG] Success! Adding new comment to UI.');
      setComments(prevComments => [...prevComments, data as any]);
      setNewComment('');
    } else {
      console.warn('[DEBUG] Insert succeeded, but no data was returned from the select().');
    }
    
    setIsSubmitting(false);
  };
  
  // ... (the rest of your PostPage component JSX) ...
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="pointer-events-none"><PostComponent post={post} /></div>

      {profile && (
        <div className="p-4 border-t border-b border-gray-800">
          <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
            <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}`} alt="Your avatar" className="w-10 h-10 rounded-full bg-gray-700" />
            <div className="flex-1">
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Post your reply" className="w-full bg-dark-tertiary rounded-lg p-2 text-white" rows={2} />
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