// src/pages/PostPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Comment as CommentType, Profile } from '../types';
import Spinner from '../components/Spinner';

// Comment Component (No changes needed here)
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
  
  const [post, setPost] = useState<PostType | null>(null);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!postId) return;
      setLoading(true);
      try {
        const { data: postData, error: postError } = await supabase.from('posts').select('*, profiles(*)').eq('id', postId).single();
        if (postError) throw postError;
        setPost(postData as any);

        const { data: commentsData, error: commentsError } = await supabase.from('comments').select('*, profiles(*)').eq('post_id', postId).order('created_at', { ascending: true });
        if (commentsError) throw commentsError;
        setComments((commentsData as any) || []);

        if (user) {
            const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
            if (profileError) throw profileError;
            setCurrentUserProfile(profileData);
        }

      } catch (error) { 
        console.error("Error fetching data for PostPage:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchAllData();
  }, [postId, user]);

  // ==================================================================
  // THE ALTERNATIVE FIX IS HERE
  // ==================================================================
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !newComment.trim() || !currentUserProfile) return;
    setIsSubmitting(true);

    try {
        // Step 1: Insert the new comment
        const { data: commentData, error: commentError } = await supabase
            .from('comments')
            .insert({ post_id: post.id, user_id: user.id, content: newComment.trim() })
            .select()
            .single();
        
        if (commentError) throw commentError; // If this fails, stop here

        // Step 2: If comment insertion succeeds, call the function to increment the post's comment count
        const { error: rpcError } = await supabase.rpc('increment_post_comment_count', {
            post_id_to_update: post.id
        });

        if (rpcError) throw rpcError; // Log if the count update fails, but the comment is already posted

        // Step 3: Update the UI instantly
        const newCommentForUI: CommentType = { ...commentData, profiles: currentUserProfile };
        setComments(prev => [...prev, newCommentForUI]); 
        setPost(prevPost => prevPost ? { ...prevPost, comment_count: (prevPost.comment_count || 0) + 1 } : null);
        setNewComment(''); 
        
    } catch (error) {
        console.error("Error during comment submission process:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10"><Spinner /></div>;
  if (!post) return <div className="text-center py-10 text-red-400">Post not found.</div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="pointer-events-none">
        <PostComponent post={post} />
      </div>

      {currentUserProfile && (
        <div className="p-4 border-t border-b border-gray-800">
          <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
            <img src={currentUserProfile.avatar_url || `https://ui-avatars.com/api/?name=${currentUserProfile.username}`} alt="Your avatar" className="w-10 h-10 rounded-full bg-gray-700 object-cover" />
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