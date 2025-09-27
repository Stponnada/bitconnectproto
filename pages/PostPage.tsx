// src/pages/PostPage.tsx (Corrected Syntax, Final Version)

import React, { useState, useEffect } from 'react'; // <-- THE FIX IS HERE
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Comment as CommentType } from '../types';
import Spinner from '../components/Spinner';

// A new component for displaying a single comment
const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => {
  const author = comment.profiles;
  return (
    <div className="flex items-start space-x-3 p-4 border-b border-gray-800">
      <img src={author?.avatar_url || `https://ui-avatars.com/api/?name=${author?.username}`} alt={author?.username || 'user avatar'} className="w-10 h-10 rounded-full bg-gray-700" />
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
    const fetchPostAndComments = async () => {
      if (!postId) return;
      setLoading(true);

      try {
        const { data: postData } = await supabase.from('posts').select('*, profiles(*)').eq('id', postId).single();
        setPost(postData as any);

        const { data: commentsData } = await supabase.from('comments').select('*, profiles(*)').eq('post_id', postId).order('created_at', { ascending: true });
        setComments((commentsData as any) || []);
      } catch (error) {
        console.error("Error fetching post and comments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPostAndComments();
  }, [postId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !newComment.trim()) return;
    setIsSubmitting(true);

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: post.id,
        user_id: user.id,
        content: newComment.trim(),
      })
      .select('*, profiles(*)')
      .single();

    if (error) {
      console.error("Error posting comment:", error);
    } else if (data) {
      setComments(prevComments => [...prevComments, data as any]);
      setNewComment('');
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="text-center py-10"><Spinner /></div>;
  if (!post) return <div className="text-center py-10 text-red-400">Post not found.</div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Disable the link behavior for the post on its own page */}
      <div className="pointer-events-none">
        <PostComponent post={post} />
      </div>

      {profile && (
        <div className="p-4 border-t border-b border-gray-800">
          <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
            <img src={profile.avatar_url || ''} alt="Your avatar" className="w-10 h-10 rounded-full bg-gray-700" />
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
      
      <div>
        {comments.map(comment => <Comment key={comment.id} comment={comment} />)}
      </div>
    </div>
  );
};

export default PostPage;