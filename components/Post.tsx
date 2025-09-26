import { Post as PostType } from '../types';
import { Link } from 'react-router-dom';

const Post = ({ post }: { post: PostType }) => {
  // --- THIS LOGIC SPECIFICALLY SOLVES THE NULL USERNAME PROBLEM ---

  // 1. Safely access the author's profile data.
  const authorProfile = post.profiles;

  // 2. If there's no profile, show a generic message. This is a safety net.
  if (!authorProfile) {
    return (
      <article className="bg-bits-light-dark p-4 rounded-lg mb-4 border-b border-gray-800">
        <p className="text-gray-400">Post by an unknown user</p>
        <p className="text-gray-300 mt-2">{post.content}</p>
      </article>
    );
  }

  // 3. **THE KEY FIX:** Use the `full_name` as the main display name.
  //    If `full_name` is somehow missing, it will fall back to the username.
  const displayName = authorProfile.full_name || authorProfile.username || 'BITS Connect User';

  // 4. Provide a safe fallback for the username for the "@" handle.
  const username = authorProfile.username || 'user';

  // 5. Safely get the avatar URL.
  const avatarUrl = authorProfile.avatar_url;

  // 6. Create a fallback initial from the correct display name.
  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <article className="bg-bits-light-dark p-4 rounded-lg mb-4 border-b border-gray-800">
      <div className="flex items-center mb-3">
        <Link to={`/profile/${username}`} className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span>{avatarInitial}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-white hover:underline">{displayName}</p>
            <p className="text-sm text-gray-400">@{username}</p>
          </div>
        </Link>
      </div>
      
      <p className="text-gray-300 mb-3 whitespace-pre-wrap">{post.content}</p>

      {post.image_url && (
        <div className="mt-2">
          <img src={post.image_url} alt="Post content" className="rounded-lg w-full object-cover max-h-[500px]" />
        </div>
      )}

      <div className="flex items-center text-gray-400 mt-4 text-sm">
        <span>{post.like_count || 0} likes</span>
        <span className="ml-4">{post.comment_count || 0} comments</span>
      </div>
    </article>
  );
};

export default Post;
