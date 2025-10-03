// src/pages/DirectoryPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // <-- Import useNavigate
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';
import Spinner from '../components/Spinner';
import { ChatIcon } from '../components/icons'; // <-- Import ChatIcon

type DirectoryTab = 'all' | 'following' | 'followers';

const UserCard: React.FC<{
  profile: Profile;
  isCurrentUser: boolean;
  isToggling: boolean;
  onFollowToggle: (profile: Profile) => void;
  onMessage: (profile: Profile) => void; // <-- Add onMessage prop
  activeTab: DirectoryTab;
}> = ({ profile, isCurrentUser, isToggling, onFollowToggle, onMessage, activeTab }) => {
  
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
    if (activeTab === 'followers' && profile.is_followed_by) return 'Follow Back';
    return 'Follow';
  }

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
        <div className="flex items-center space-x-2 flex-shrink-0">
            {/* -- NEW: Message Button -- */}
            <button
              onClick={handleMessageClick}
              className="p-2 text-gray-300 rounded-full hover:bg-dark-primary transition-colors"
              title={`Message ${profile.full_name}`}
            >
              <ChatIcon className="w-6 h-6" />
            </button>
            <button
              onClick={handleFollowClick}
              disabled={isToggling}
              className={`font-semibold py-1.5 px-4 rounded-full text-sm transition-colors disabled:opacity-50 min-w-[100px] ${
                profile.is_following
                  ? 'bg-transparent border border-gray-500 text-white hover:border-red-500 hover:text-red-500'
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {getButtonText()}
            </button>
        </div>
      )}
    </Link>
  );
};

const DirectoryPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate(); // <-- Add useNavigate hook
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingFollowId, setTogglingFollowId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DirectoryTab>('all');

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .rpc('get_directory_profiles');

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
      // Revert on error
      setProfiles(currentProfiles => 
        currentProfiles.map(p => 
          p.user_id === profileToToggle.user_id ? profileToToggle : p
        )
      );
    } finally {
      setTogglingFollowId(null);
    }
  };

  // <-- NEW: Handler to navigate to chat page with selected profile
  const handleMessageUser = (profile: Profile) => {
    navigate('/chat', { state: { recipient: profile } });
  };
  
  const filteredProfiles = useMemo(() => {
    if (activeTab === 'following') {
      return profiles.filter(p => p.is_following);
    }
    if (activeTab === 'followers') {
      return profiles.filter(p => p.is_followed_by);
    }
    return profiles;
  }, [activeTab, profiles]);

  if (loading) { return <div className="text-center p-8"><Spinner /></div>; }
  if (error) { return <div className="text-center p-8 text-red-400">Error: {error}</div>; }

  const TabButton: React.FC<{ tab: DirectoryTab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        activeTab === tab
          ? 'bg-brand-green text-black'
          : 'text-gray-300 hover:bg-dark-tertiary'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white">User Directory</h1>
      
      <div className="flex space-x-2 border-b border-dark-tertiary mt-6 mb-6">
        <TabButton tab="all" label="All Users" />
        <TabButton tab="following" label="Following" />
        <TabButton tab="followers" label="Followers" />
      </div>
      
      <div className="space-y-4">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map(profile => (
            <UserCard 
              key={profile.user_id} 
              profile={profile} 
              isCurrentUser={currentUser?.id === profile.user_id}
              isToggling={togglingFollowId === profile.user_id}
              onFollowToggle={handleFollowToggle}
              onMessage={handleMessageUser} // <-- Pass handler
              activeTab={activeTab}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 py-16 bg-dark-secondary rounded-lg">
             <p className="font-semibold">No users to display.</p>
             <p className="text-sm mt-1">
                {activeTab === 'following' && "You aren't following anyone yet."}
                {activeTab === 'followers' && "You don't have any followers yet."}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryPage;