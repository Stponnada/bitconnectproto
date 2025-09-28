// src/components/SearchResults.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { SearchResults as SearchResultsType } from '../types';
import Spinner from './Spinner';

interface SearchResultsProps {
  results: SearchResultsType | null;
  loading: boolean;
  onNavigate: () => void; // Function to close the results panel
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, loading, onNavigate }) => {
  const hasUsers = results && results.users.length > 0;
  const hasPosts = results && results.posts.length > 0;

  if (loading) {
    return (
      <div className="absolute top-full mt-2 w-full bg-dark-secondary rounded-lg shadow-lg p-4">
        <Spinner />
      </div>
    );
  }

  if (!results || (!hasUsers && !hasPosts)) {
    return (
      <div className="absolute top-full mt-2 w-full bg-dark-secondary rounded-lg shadow-lg p-4">
        <p className="text-gray-400 text-center">No results found.</p>
      </div>
    );
  }

  return (
    <div className="absolute top-full mt-2 w-full max-w-md bg-dark-secondary border border-dark-tertiary rounded-lg shadow-lg max-h-96 overflow-y-auto">
      {hasUsers && (
        <div className="p-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase px-3 pt-2 pb-1">Users</h3>
          <ul>
            {results.users.map(user => (
              <li key={user.username}>
                <Link to={`/profile/${user.username}`} onClick={onNavigate} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-dark-tertiary">
                  <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-white text-sm">{user.full_name}</p>
                    <p className="text-xs text-gray-400">@{user.username}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {hasPosts && (
        <div className="p-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase px-3 pt-2 pb-1">Posts & Comments</h3>
          <ul>
            {results.posts.map(post => (
              <li key={post.id}>
                <Link to={`/post/${post.id}`} onClick={onNavigate} className="block p-3 rounded-lg hover:bg-dark-tertiary">
                  <p className="text-sm text-gray-300 truncate">"{post.content}"</p>
                  <p className="text-xs text-gray-500 mt-1">by {post.author_full_name}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchResults;