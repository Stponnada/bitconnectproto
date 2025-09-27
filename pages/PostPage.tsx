// src/pages/PostPage.tsx (Final Version)

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Comment as CommentType, Profile } from '../types';
import Spinner from '../components/Spinner';

// This is our "mini Post" component for displaying a single comment.
const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => {
  const author = comment.profiles;
  const displayName = author?.full_name || author?.username || 'User';
  const username = author?.username || 'user';
  const avatarUrl = author?.avatar_url;
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex items-start space-x-3 p-4 border-b border-gray-800">
      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold flex-shrink-0">
        {avatarUrl ? <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" /> : <span>{avatarInitial}</span>}
      </div>
      <div>
        <div className="flex items-center space-x-2">
          <p className="font-bold text-white">{displayName}</p>
          <p className="text-sm text-gray-500">@{username}</p>
        </div>
        <p className="text-gray-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
};

// This is the main page component.
const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user, profile: currentUserProfile } = useAuth();
  
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
        const postIdNum = parseInt(postId); // Ensure the ID is a number
        const { data: postData } = await supabase.from('posts').select('*, profiles(*)').eq('id', postIdNum).single();
        setPost(postData as any);
        const { data: commentsData } = await supabase.from('comments').select('*, profiles(*)').eq('post_id', postIdNum).order('created_at', { ascending: true });
        setComments((commentsData as any) || []);
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
      .select('*, profiles(*)') // Fetch the new comment with the author's profile
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