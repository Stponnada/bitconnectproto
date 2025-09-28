// src/components/Post.tsx (Updated)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { Post as PostType } from '../types';
import { ThumbsUpIcon, ThumbsDownIcon, CommentIcon } from './icons';

const Post = ({ post }: { post: PostType }) => {
  const { user } = useAuth();
  const { updatePostInContext } = usePosts();

  // THE FIX: We ONLY keep local state for things unique to THIS component instance,
  // like which button the user has pressed (`userVote`) and the loading state (`isVoting`).
  // The actual counts now come directly from the `post` prop.
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    // This effect is now only responsible for figuring out if the current
    // user has liked or disliked this specific post.
    const fetchUserVote = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('likes')
        .select('like_type')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();
      setUserVote(data?.like_type as 'like' | 'dislike' || null);
    };
    fetchUserVote();
  }, [post.id, user]);

  const handleVote = async (newVoteType: 'like' | 'dislike') => {
    if (!user || isVoting) return;
    setIsVoting(true);

    const oldVote = userVote;
    let newLikeCount = post.like_count;
    let newDislikeCount = post.dislike_count;

    // 1. Calculate the new state based on the current action
    if (newVoteType === oldVote) { // Un-voting
      setUserVote(null);
      if (newVoteType === 'like') newLikeCount--;
      if (newVoteType === 'dislike') newDislikeCount--;
    } else { // Voting or changing vote
      if (oldVote === 'like') newLikeCount--;
      if (oldVote === 'dislike') newDislikeCount--;
      
      if (newVoteType === 'like') newLikeCount++;
      if (newVoteType === 'dislike') newDislikeCount++;
      
      setUserVote(newVoteType);
    }

    // 2. Immediately update the GLOBAL context. This is the optimistic update.
    // Every component in the app will now see the new counts instantly.
    updatePostInContext({
      id: post.id,
      like_count: newLikeCount,
      dislike_count: newDislikeCount,
    });

    // 3. Update the database in the background.
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
    } catch (error) {
      console.error("Failed to vote:", error);
      // Revert UI on failure by telling context to go back to original values
      updatePostInContext({
          id: post.id,
          like_count: post.like_count,
          dislike_count: post.dislike_count,
      });
      setUserVote(oldVote); // also revert the button color
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
          {/* THE FIX: Always read from the prop, which is the single source of truth from the context */}
          <span>{post.like_count}</span>
        </button>
        <button disabled={isVoting} onClick={() => handleVote('dislike')} className="flex items-center space-x-2 ml-4 hover:text-red-500 disabled:opacity-50">
          <ThumbsDownIcon className={`w-5 h-5 ${userVote === 'dislike' ? 'text-red-500' : ''}`} />
          <span>{post.dislike_count}</span>
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