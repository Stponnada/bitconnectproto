// src/pages/DirectoryPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';
import Spinner from '../components/Spinner';
import UserCard from '../components/UserCard';

type DirectoryTab = 'all' | 'following' | 'followers';

const DirectoryPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
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
      setProfiles(currentProfiles => 
        currentProfiles.map(p => 
          p.user_id === profileToToggle.user_id ? profileToToggle : p
        )
      );
    } finally {
      setTogglingFollowId(null);
    }
  };

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
          : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-text-main-light dark:text-text-main">User Directory</h1>
      
      <div className="flex space-x-2 border-b border-tertiary-light dark:border-tertiary mt-6 mb-6">
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
              onMessage={handleMessageUser}
              activeTab={activeTab}
            />
          ))
        ) : (
          <div className="text-center text-text-tertiary-light dark:text-text-tertiary py-16 bg-secondary-light dark:bg-secondary rounded-lg">
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