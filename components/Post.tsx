// src/components/Post.tsx (Final Version with Likes & Dislikes)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Post as PostType } from '../types';
import { ThumbsUpIcon, ThumbsDownIcon } from './icons'; // Assuming you have these icons

const Post = ({ post }: { post: PostType }) => {
  const { user } = useAuth();

  // State to manage the likes and the user's current vote
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);

  // This useEffect fetches the initial like data for the post
  useEffect(() => {
    const fetchLikes = async () => {
      // Fetch all likes for this specific post
      const { data, error } = await supabase
        .from('likes')
        .select('user_id, like_type')
        .eq('post_id', post.id);

      if (error) {
        console.error("Error fetching likes:", error);
        return;
      }
      
      // Calculate the initial counts
      let likes = 0;
      let dislikes = 0;
      for (const like of data) {
        if (like.like_type === 'like') likes++;
        else if (like.like_type === 'dislike') dislikes++;
      }
      setLikeCount(likes);
      setDislikeCount(dislikes);
      
      // Check if the current logged-in user has voted on this post
      if (user) {
        const currentUserLike = data.find(like => like.user_id === user.id);
        if (currentUserLike) {
          setUserVote(currentUserLike.like_type as 'like' | 'dislike');
        }
      }
    };

    fetchLikes();
  }, [post.id, user]);

  // This is the main function for handling a vote
  const handleVote = async (newVoteType: 'like' | 'dislike') => {
    if (!user) return; // User must be logged in to vote

    // Step 1: Delete any existing vote the user has on this post
    if (userVote) {
      await supabase.from('likes').delete().match({ post_id: post.id, user_id: user.id });
    }

    // Step 2: If the user is not just un-voting, insert the new vote
    if (userVote !== newVoteType) {
      await supabase.from('likes').insert({
        post_id: post.id,
        user_id: user.id,
        like_type: newVoteType,
      });
    }

    // Step 3: Optimistically update the UI to feel instant
    if (userVote === newVoteType) { // Un-voting
      setUserVote(null);
      if (newVoteType === 'like') setLikeCount(prev => prev - 1);
      else setDislikeCount(prev => prev - 1);
    } else { // Voting or changing vote
      setUserVote(newVoteType);
      // Adjust counts based on the previous vote
      if (userVote === 'like') setLikeCount(prev => prev - 1);
      if (userVote === 'dislike') setDislikeCount(prev => prev - 1);
      
      if (newVoteType === 'like') setLikeCount(prev => prev + 1);
      else setDislikeCount(prev => prev + 1);
    }
  };

  const authorProfile = post.profiles;
  const displayName = authorProfile?.full_name || authorProfile?.username || 'BITS Connect User';
  const username = authorProfile?.username || 'user';
  const avatarUrl = authorProfile?.avatar_url;
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <article className="bg-bits-light-dark p-4 rounded-lg mb-4 border-b border-gray-800">
      <div className="flex items-center mb-3">
        <Link to={`/profile/${username}`} className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
            {avatarUrl ? <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" /> : <span>{avatarInitial}</span>}
          </div>
          <div>
            <p className="font-bold text-white hover:underline">{displayName}</p>
            <p className="text-sm text-gray-400">@{username}</p>
          </div>
        </Link>
      </div>
      
      <p className="text-gray-300 mb-3 whitespace-pre-wrap">{post.content}</p>
      {post.image_url && <div className="mt-2"><img src={post.image_url} alt="Post content" className="rounded-lg w-full object-cover max-h-[500px]" /></div>}

      {/* ================================================================== */}
      {/* THE NEW LIKE/DISLIKE BUTTONS ARE HERE */}
      {/* ================================================================== */}
      <div className="flex items-center text-gray-400 mt-4 text-sm">
        <button onClick={() => handleVote('like')} className="flex items-center space-x-2 hover:text-green-500">
          <ThumbsUpIcon className={`w-5 h-5 ${userVote === 'like' ? 'text-green-500' : ''}`} />
          <span>{likeCount}</span>
        </button>
        <button onClick={() => handleVote('dislike')} className="flex items-center space-x-2 ml-4 hover:text-red-500">
          <ThumbsDownIcon className={`w-5 h-5 ${userVote === 'dislike' ? 'text-red-500' : ''}`} />
          <span>{dislikeCount}</span>
        </button>
      </div>
    </article>
  );
};

export default Post;