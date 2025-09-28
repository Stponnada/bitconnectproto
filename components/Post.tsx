// src/components/Post.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Post as PostType } from '../types';
import { ThumbsUpIcon, ThumbsDownIcon, CommentIcon } from './icons'; // Corrected icon name
import { useState, useEffect } from 'react';

// THE FIX IS HERE: We are changing the prop signature to make it optional.
const Post = ({ post, onVoteSuccess }: { post: PostType; onVoteSuccess?: () => void }) => {
  const { user } = useAuth();

  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    setLikeCount(post.like_count || 0);
    setDislikeCount(post.dislike_count || 0);

    const fetchUserVote = async () => {
        if (!user) {
            setUserVote(null);
            return;
        };

        const { data: userVoteData } = await supabase
          .from('likes')
          .select('like_type')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single();
        
        setUserVote(userVoteData?.like_type as 'like' | 'dislike' || null);
    }
    fetchUserVote();
    
  }, [post.id, post.like_count, post.dislike_count, user]);

  const handleVote = async (newVoteType: 'like' | 'dislike') => {
    if (!user || isVoting) return;
    setIsVoting(true);

    const oldVote = userVote;
    
    // This is the OPTIMISTIC UI UPDATE. It happens instantly.
    if (newVoteType === oldVote) { // Un-voting
      setUserVote(null);
      if (newVoteType === 'like') setLikeCount(prev => prev - 1);
      if (newVoteType === 'dislike') setDislikeCount(prev => prev - 1);
    } else { // Voting or changing vote
      if (oldVote === 'like') setLikeCount(prev => prev - 1);
      if (oldVote === 'dislike') setDislikeCount(prev => prev - 1);
      
      if (newVoteType === 'like') setLikeCount(prev => prev + 1);
      if (newVoteType === 'dislike') setDislikeCount(prev => prev + 1);
      
      setUserVote(newVoteType);
    }
    
    // This is the database operation. It happens in the background.
    try {
      if (newVoteType === oldVote) {
        await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id });
      } else {
        await supabase.from('likes').upsert({
          user_id: user.id,
          post_id: post.id,
          like_type: newVoteType
        }, { onConflict: 'user_id, post_id' });
      }
      
      // ==================================================================
      // THE FIX IS HERE: We only call the callback if it was explicitly
      // provided for a special case (like the single PostPage).
      // For the main feed, it will be undefined and nothing will happen.
      // ==================================================================
      if (onVoteSuccess) {
        onVoteSuccess();
      }

    } catch (error) {
        console.error("Failed to vote:", error);
        // If the database fails, you could revert the UI state here, but for now we keep it simple.
    } finally {
        setIsVoting(false);
    }
  };

  const authorProfile = post.profiles;
  const displayName = authorProfile?.full_name || authorProfile?.username || 'User';
  const username = authorProfile?.username || 'user';
  const avatarUrl = authorProfile?.avatar_url;
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <article className="bg-dark-secondary p-4 rounded-lg border border-dark-tertiary">
      <div className="flex items-center mb-3">
        <Link to={`/profile/${username}`} className="flex items-center hover:underline">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold mr-3">
            {avatarUrl ? <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" /> : <span>{avatarInitial}</span>}
          </div>
          <div>
            <p className="font-bold text-white">{displayName}</p>
            <p className="text-sm text-gray-400">@{username}</p>
          </div>
        </Link>
      </div>
      
      <Link to={`/post/${post.id}`} className="block">
        <p className="text-gray-300 mb-3 whitespace-pre-wrap">{post.content}</p>
        {post.image_url && <img src={post.image_url} alt="Post content" className="rounded-lg w-full max-h-[500px] object-cover" />}
      </Link>

      <div className="flex items-center text-gray-400 mt-4 text-sm">
        <button disabled={isVoting} onClick={() => handleVote('like')} className="flex items-center space-x-2 hover:text-green-500 disabled:opacity-50">
          <ThumbsUpIcon className={`w-5 h-5 ${userVote === 'like' ? 'text-green-500' : ''}`} />
          <span>{likeCount}</span>
        </button>
        <button disabled={isVoting} onClick={() => handleVote('dislike')} className="flex items-center space-x-2 ml-4 hover:text-red-500 disabled:opacity-50">
          <ThumbsDownIcon className={`w-5 h-5 ${userVote === 'dislike' ? 'text-red-500' : ''}`} />
          <span>{dislikeCount}</span>
        </button>
        <Link to={`/post/${post.id}`} className="flex items-center space-x-2 ml-4 hover:text-blue-500">
            <CommentIcon className="w-5 h-5" />
            <span>{post.comment_count || 0}</span>
        </Link>
      </div>
    </article>
  );
};

export default Post;