// src/pages/PostPage.tsx (Complete with Exact Timestamp)

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import PostComponent from '../components/Post';
import { Post as PostType, Comment as CommentType, Profile } from '../types';
import Spinner from '../components/Spinner';
// --- MODIFIED: Import both formatting functions ---
import { formatTimestamp, formatExactTimestamp } from '../utils/timeUtils';

// Helper for consistent avatars
const getAvatarUrl = (profile: Profile | null) => {
  if (!profile) return '';
  return profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name || profile.username}&background=E53E3E&color=fff`;
};

// Comment Component (Uses relative timestamp)
const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => {
  const author = comment.profiles;
  return (
    <div className="flex items-start space-x-3 p-4 border-b border-dark-tertiary">
      <Link to={`/profile/${author?.username}`}>
        <img src={getAvatarUrl(author)} alt={author?.username || 'avatar'} className="w-10 h-10 rounded-full bg-gray-700 object-cover" />
      </Link>
      <div>
        <div className="flex items-center space-x-2">
            <Link to={`/profile/${author?.username}`} className="font-bold text-white hover:underline">{author?.full_name || author?.username}</Link>
            <p className="text-sm text-gray-500">@{author?.username}</p>
            <span className="text-gray-500">&middot;</span>
            <p className="text-sm text-gray-500" title={new Date(comment.created_at).toLocaleString()}>
                {formatTimestamp(comment.created_at)}
            </p>
        </div>
        <p className="text-gray-300 mt-1 whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
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
        const { data: commentsData } = await supabase.from('comments').select('*, profiles(*)').eq('post_id', postId).order('created_at', { ascending: true });
        setComments((commentsData as any) || []);
        if (user) {
          const { data: profileData } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
          setCurrentUserProfile(profileData);
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
        const { data: commentData, error } = await supabase.from('comments').insert({ post_id: post.id, user_id: user.id, content: newComment.trim() }).select().single();
        if (error) throw error;
        const newCommentForUI: CommentType = { ...commentData, profiles: currentUserProfile };
        setComments(prev => [...prev, newCommentForUI]);
        const newCommentCount = post.comment_count + 1;
        updatePostInContext({ id: post.id, comment_count: newCommentCount });
        setNewComment('');
    } catch (error) {
        console.error("Error submitting comment:", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (postsLoading) {
    return <div className="text-center py-10"><Spinner /></div>;
  }

  if (!post) {
    return <div className="text-center py-10 text-red-400">Post not found.</div>;
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PostComponent post={post} />

      {/* --- NEW: Exact Timestamp Display --- */}
      <div className="px-4 py-3 text-sm text-gray-500 border-b border-dark-tertiary">
        <span>{formatExactTimestamp(post.created_at)}</span>
      </div>
      {/* --- END OF NEW BLOCK --- */}


      {currentUserProfile && (
        <div className="p-4 border-t border-b border-dark-tertiary">
          <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
            <img src={getAvatarUrl(currentUserProfile)} alt="Your avatar" className="w-10 h-10 rounded-full bg-gray-700 object-cover" />
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