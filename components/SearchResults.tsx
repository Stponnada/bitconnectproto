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

  // --- FIX: Using a nearly opaque background with a backdrop blur for readability and style ---
  const containerClasses = "absolute top-full mt-2 w-full max-w-md bg-secondary-light/95 dark:bg-secondary/95 backdrop-blur-sm border border-tertiary-light dark:border-tertiary rounded-lg shadow-lg max-h-96 overflow-y-auto";

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className="p-4 flex justify-center">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!results || (!hasUsers && !hasPosts)) {
    return (
      <div className={containerClasses}>
        <p className="text-text-tertiary-light dark:text-text-tertiary text-center p-4">No results found.</p>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {hasUsers && (
        <div className="p-2">
          <h3 className="text-xs font-bold text-text-tertiary-light dark:text-text-tertiary uppercase px-3 pt-2 pb-1">Users</h3>
          <ul>
            {results.users.map(user => (
              <li key={user.username}>
                <Link to={`/profile/${user.username}`} onClick={onNavigate} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-tertiary-light/60 dark:hover:bg-tertiary">
                  <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    {/* FIX: Ensured text colors work for both light and dark modes */}
                    <p className="font-semibold text-text-main-light dark:text-text-main text-sm">{user.full_name}</p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary">@{user.username}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {hasPosts && (
        <div className="p-2">
          <h3 className="text-xs font-bold text-text-tertiary-light dark:text-text-tertiary uppercase px-3 pt-2 pb-1">Posts & Comments</h3>
          <ul>
            {results.posts.map(post => (
              <li key={post.id}>
                <Link to={`/post/${post.id}`} onClick={onNavigate} className="block p-3 rounded-lg hover:bg-tertiary-light/60 dark:hover:bg-tertiary">
                   {/* FIX: Ensured text colors work for both light and dark modes */}
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary truncate">"{post.content}"</p>
                  <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1">by {post.author_full_name}</p>
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