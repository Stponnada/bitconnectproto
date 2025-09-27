// src/components/Post.tsx (Updated to be a clickable link)

import { Link } from 'react-router-dom';
import { Post as PostType } from '../types';
import { ThumbsUpIcon, ThumbsDownIcon, ChatIcon } from './icons'; // Assuming you add ChatIcon

const Post = ({ post }: { post: PostType }) => {
  const authorProfile = post.profiles;
  const displayName = authorProfile?.full_name || authorProfile?.username || 'User';
  const username = authorProfile?.username || 'user';
  // ... (Your like/dislike logic can remain here) ...

  return (
    // 1. THE ENTIRE ARTICLE IS NOW A LINK TO THE POST'S PAGE
    <Link to={`/post/${post.id}`} className="block hover:bg-gray-800/20 rounded-lg">
      <article className="bg-bits-light-dark p-4 rounded-lg border-b border-gray-800">
        <div className="flex items-center mb-3">
          {/* ... Author info JSX ... */}
        </div>
        
        <p className="text-gray-300 mb-3 whitespace-pre-wrap">{post.content}</p>
        {post.image_url && <img src={post.image_url} alt="Post content" className="rounded-lg w-full" />}

        <div className="flex items-center text-gray-400 mt-4 text-sm">
          {/* ... Like/Dislike buttons ... */}
          
          {/* 2. DISPLAY THE COMMENT COUNT */}
          <div className="flex items-center space-x-2 ml-4">
            <ChatIcon className="w-5 h-5" />
            <span>{post.comment_count || 0}</span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default Post;