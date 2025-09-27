import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Post as PostType } from '../types';
import { ThumbsUpIcon, ThumbsDownIcon, ChatIcon } from './icons';
import { useState, useEffect } from 'react';

const Post = ({ post }: { post: PostType }) => {
  const { user } = useAuth();

  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);

  useEffect(() => {
    const fetchVotes = async () => {
      // CHANGE: The table is 'likes', not 'votes'.
      const { data: votesData, error: votesError } = await supabase
        .from('likes')
        // CHANGE: The column is 'like_type', not 'vote_type'.
        .select('like_type') 
        .eq('post_id', post.id);

      if (votesError) {
        console.error('Error fetching votes:', votesError);
        return;
      }

      let likes = 0;
      let dislikes = 0;
      votesData.forEach(v => {
        // CHANGE: The column is 'like_type'.
        if (v.like_type === 'like') likes++;
        if (v.like_type === 'dislike') dislikes++;
      });
      setLikeCount(likes);
      setDislikeCount(dislikes);

      if (user) {
        // CHANGE: The table is 'likes'.
        const { data: userVoteData, error: userVoteError } = await supabase
          .from('likes')
          // CHANGE: The column is 'like_type'.
          .select('like_type')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single();
        
        if (userVoteData) {
          // CHANGE: The column is 'like_type'.
          setUserVote(userVoteData.like_type as 'like' | 'dislike');
        }
      }
    };

    fetchVotes();
  }, [post.id, user]);

  const handleVote = async (newVoteType: 'like' | 'dislike') => {
    if (!user) return;

    if (newVoteType === userVote) {
      setUserVote(null);
      if (newVoteType === 'like') setLikeCount(prev => prev - 1);
      if (newVoteType === 'dislike') setDislikeCount(prev => prev - 1);

      // CHANGE: The table is 'likes'.
      await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id });
    
    } else {
      if (userVote === 'like') setLikeCount(prev => prev - 1);
      if (userVote === 'dislike') setDislikeCount(prev => prev - 1);
      
      if (newVoteType === 'like') setLikeCount(prev => prev + 1);
      if (newVoteType === 'dislike') setDislikeCount(prev => prev + 1);
      
      setUserVote(newVoteType);

      // CHANGE: The table is 'likes', and the column is 'like_type'.
      await supabase.from('likes').upsert({
        user_id: user.id,
        post_id: post.id,
        like_type: newVoteType
      }, { onConflict: 'user_id, post_id' }); // Important for handling existing votes
    }
  };

  const authorProfile = post.profiles;
  const displayName = authorProfile?.full_name || authorProfile?.username || 'User';
  const username = authorProfile?.username || 'user';
  const avatarUrl = authorProfile?.avatar_url;
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <article className="bg-bits-light-dark p-4 rounded-lg mb-4 border-b border-gray-800">
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
        <button onClick={() => handleVote('like')} className="flex items-center space-x-2 hover:text-green-500">
          <ThumbsUpIcon className={`w-5 h-5 ${userVote === 'like' ? 'text-green-500' : ''}`} />
          <span>{likeCount}</span>
        </button>
        <button onClick={() => handleVote('dislike')} className="flex items-center space-x-2 ml-4 hover:text-red-500">
          <ThumbsDownIcon className={`w-5 h-5 ${userVote === 'dislike' ? 'text-red-500' : ''}`} />
          <span>{dislikeCount}</span>
        </button>
        <Link to={`/post/${post.id}`} className="flex items-center space-x-2 ml-4 hover:text-blue-500">
            <ChatIcon className="w-5 h-5" />
            <span>{post.comment_count || 0}</span>
        </Link>
      </div>
    </article>
  );
};

export default Post;