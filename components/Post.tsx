// src/components/Post.tsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import { Post as PostType } from '../types';
import { ThumbsUpIcon, ThumbsDownIcon, CommentIcon } from './icons';
import { formatTimestamp } from '../utils/timeUtils';
import LightBox from './lightbox';
import { renderContentWithEmbeds } from '../utils/renderEmbeds'; // <-- Import new renderer

const Post = ({ post }: { post: PostType }) => {
  const { user } = useAuth();
  const { updatePostInContext } = usePosts();

  const [userVote, setUserVote] = useState(post.user_vote);
  const [isVoting, setIsVoting] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleVote = async (newVoteType: 'like' | 'dislike') => {
    if (!user || isVoting) return;
    setIsVoting(true);

    const oldVote = userVote;
    let newLikeCount = post.like_count;
    let newDislikeCount = post.dislike_count;
    let newVoteState = userVote;

    if (newVoteType === oldVote) {
      newVoteState = null;
      if (newVoteType === 'like') newLikeCount--;
      if (newVoteType === 'dislike') newDislikeCount--;
    } else {
      if (oldVote === 'like') newLikeCount--;
      if (oldVote === 'dislike') newDislikeCount--;
      if (newVoteType === 'like') newLikeCount++;
      if (newVoteType === 'dislike') newDislikeCount++;
      newVoteState = newVoteType;
    }
    
    setUserVote(newVoteState);

    updatePostInContext({
      id: post.id,
      like_count: newLikeCount,
      dislike_count: newDislikeCount,
      user_vote: newVoteState,
    });

    try {
      if (newVoteState === null) {
        await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id });
      } else {
        await supabase.from('likes').upsert({
          user_id: user.id,
          post_id: post.id,
          like_type: newVoteState
        }, { onConflict: 'user_id, post_id' });
      }
    } catch (error) {
      console.error("Failed to vote:", error);
      setUserVote(oldVote);
      updatePostInContext({
          id: post.id,
          like_count: post.like_count,
          dislike_count: post.dislike_count,
          user_vote: oldVote
      });
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
    <>
      <article className="bg-secondary-light dark:bg-secondary p-4 rounded-lg border border-tertiary-light dark:border-tertiary">
        <div className="flex items-start space-x-3">
          <Link to={`/profile/${username}`} className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-text-main-light dark:text-text-main">
              {avatarUrl ? <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" /> : <span>{avatarInitial}</span>}
            </div>
          </Link>
          
          <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-baseline md:space-x-2">
                  <Link to={`/profile/${username}`} className="hover:underline">
                      <p className="font-semibold text-text-main-light dark:text-text-main leading-tight">{displayName}</p>
                  </Link>
                  <div className="flex items-center space-x-2 text-sm text-text-tertiary-light dark:text-text-tertiary">
                      <span>@{username}</span>
                      <span className="text-gray-500">&middot;</span>
                      <Link to={`/post/${post.id}`} className="hover:underline" title={new Date(post.created_at).toLocaleString()}>
                          {formatTimestamp(post.created_at)}
                      </Link>
                  </div>
              </div>
              
               <div className="mt-1 text-text-secondary-light dark:text-text-secondary">
                  {renderContentWithEmbeds(post.content)}
               </div>
          </div>
        </div>
        
        {post.image_url && 
          <div className="block ml-13 mt-3">
            <button onClick={() => setIsLightboxOpen(true)} className="w-full h-full focus:outline-none">
              <img 
                src={post.image_url} 
                alt="Post content" 
                className="rounded-lg w-full max-h-[500px] object-cover cursor-pointer" 
              />
            </button>
          </div>
        }

        <div className="flex items-center text-text-tertiary-light dark:text-text-tertiary mt-4 text-sm ml-13">
          <button disabled={isVoting} onClick={() => handleVote('like')} className="flex items-center space-x-2 hover:text-green-500 disabled:opacity-50">
            <ThumbsUpIcon className={`w-5 h-5 ${userVote === 'like' ? 'text-green-500' : ''}`} />
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

      {isLightboxOpen && post.image_url && (
          <LightBox imageUrl={post.image_url} onClose={() => setIsLightboxOpen(false)} />
      )}
    </>
  );
};

export default Post;