// src/pages/DirectoryPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';
import Spinner from '../components/Spinner';

const UserCard: React.FC<{
  profile: Profile;
  isCurrentUser: boolean;
  isToggling: boolean;
  onFollowToggle: (profile: Profile) => void;
}> = ({ profile, isCurrentUser, isToggling, onFollowToggle }) => {
  
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFollowToggle(profile);
  };
  
  return (
    <Link 
      to={`/profile/${profile.username}`} 
      className="bg-dark-secondary p-4 rounded-lg flex items-center space-x-4 hover:bg-dark-tertiary transition-colors border border-dark-tertiary"
    >
      <img 
        src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name || profile.username}`} 
        alt={profile.username}
        className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
      />
      <div className="text-left flex-grow">
        <h3 className="font-bold text-white text-lg">{profile.full_name}</h3>
        <p className="text-sm text-gray-400">@{profile.username}</p>
        <p className="text-xs text-gray-500 mt-1">{profile.follower_count} Followers</p>
      </div>
      
      {!isCurrentUser && (
        <button
          onClick={handleButtonClick}
          disabled={isToggling}
          className={`font-semibold py-1.5 px-4 rounded-full text-sm transition-colors disabled:opacity-50 flex-shrink-0 ${
            profile.is_following
              ? 'bg-transparent border border-gray-500 text-white hover:border-red-500 hover:text-red-500'
              : 'bg-white text-black hover:bg-gray-200'
          }`}
        >
          {isToggling ? <Spinner/> : (profile.is_following ? 'Following' : 'Follow')}
        </button>
      )}
    </Link>
  );
};

const DirectoryPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingFollowId, setTogglingFollowId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .rpc('get_all_profiles_with_follow_status');

        if (fetchError) throw fetchError;
        setProfiles(data as Profile[] || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);
  
  const handleFollowToggle = async (profileToToggle: Profile) => {
    if (!currentUser) return;
    setTogglingFollowId(profileToToggle.user_id);

    const isCurrentlyFollowing = profileToToggle.is_following;

    setProfiles(currentProfiles => 
      currentProfiles.map(p => 
        p.user_id === profileToToggle.user_id
          ? {
              ...p,
              is_following: !isCurrentlyFollowing,
              follower_count: isCurrentlyFollowing ? p.follower_count - 1 : p.follower_count + 1
            }
          : p
      )
    );

    try {
      if (isCurrentlyFollowing) {
        await supabase.from('followers').delete().match({
          follower_id: currentUser.id,
          following_id: profileToToggle.user_id,
        });
      } else {
        await supabase.from('followers').insert({
          follower_id: currentUser.id,
          following_id: profileToToggle.user_id,
        });
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err);
      setProfiles(currentProfiles => 
        currentProfiles.map(p => 
          p.user_id === profileToToggle.user_id ? profileToToggle : p
        )
      );
    } finally {
      setTogglingFollowId(null);
    }
  };

  if (loading) {
    return <div className="text-center p-8"><Spinner /></div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-400">Error: {error}</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white border-b border-dark-tertiary pb-4">User Directory</h1>
      <div className="space-y-4">
        {profiles.map(profile => (
          <UserCard 
            key={profile.user_id} 
            profile={profile} 
            isCurrentUser={currentUser?.id === profile.user_id}
            isToggling={togglingFollowId === profile.user_id}
            onFollowToggle={handleFollowToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default DirectoryPage;