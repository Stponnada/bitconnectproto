// src/components/UserCard.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Profile } from '../types';
import Spinner from './Spinner';
import { ChatIcon } from './icons';

type listType = 'all' | 'following' | 'followers';

interface UserCardProps {
  profile: Profile;
  isCurrentUser: boolean;
  isToggling: boolean;
  onFollowToggle: (profile: Profile) => void;
  onMessage: (profile: Profile) => void;
  activeTab: listType;
}

const UserCard: React.FC<UserCardProps> = ({ profile, isCurrentUser, isToggling, onFollowToggle, onMessage, activeTab }) => {
  
  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    onFollowToggle(profile);
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    onMessage(profile);
  };
  
  const getButtonText = () => {
    if (isToggling) return <Spinner/>;
    if (profile.is_following) return 'Following';
    if (activeTab === 'followers' && profile.is_followed_by && !profile.is_following) return 'Follow Back';
    return 'Follow';
  }

  return (
    <Link 
      to={`/profile/${profile.username}`} 
      className="bg-secondary-light dark:bg-secondary p-4 rounded-lg flex items-center space-x-4 hover:bg-tertiary-light/60 dark:hover:bg-tertiary transition-colors border border-tertiary-light dark:border-tertiary"
    >
      <img 
        src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name || profile.username}`} 
        alt={profile.username}
        className="w-16 h-16 rounded-full object-cover border-2 border-tertiary-light dark:border-gray-600"
      />
      <div className="text-left flex-grow overflow-hidden">
        <h3 className="font-bold text-text-main-light dark:text-text-main text-lg truncate">{profile.full_name || profile.username}</h3>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary truncate">@{profile.username}</p>
        {profile.follower_count !== undefined && (
          <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1">{profile.follower_count} Followers</p>
        )}
      </div>
      
      {!isCurrentUser && (
        <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleMessageClick}
              className="p-2 text-text-secondary-light dark:text-text-secondary rounded-full hover:bg-primary-light dark:hover:bg-primary transition-colors"
              title={`Message ${profile.full_name}`}
            >
              <ChatIcon className="w-6 h-6" />
            </button>
            <button
              onClick={handleFollowClick}
              disabled={isToggling}
              className={`font-semibold py-1.5 px-4 rounded-full text-sm transition-colors disabled:opacity-50 min-w-[100px] ${
                profile.is_following
                  ? 'bg-transparent border border-gray-400 dark:border-gray-500 text-text-main-light dark:text-text-main hover:border-red-500 hover:text-red-500'
                  : 'bg-text-main-light text-primary-light dark:bg-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-200'
              }`}
            >
              {getButtonText()}
            </button>
        </div>
      )}
    </Link>
  );
};

export default UserCard;