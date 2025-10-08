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
  const [searchQuery, setSearchQuery] = useState('');

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
    let filtered = profiles;
    
    if (activeTab === 'following') {
      filtered = profiles.filter(p => p.is_following);
    } else if (activeTab === 'followers') {
      filtered = profiles.filter(p => p.is_followed_by);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.display_name?.toLowerCase().includes(query) ||
        p.username?.toLowerCase().includes(query) ||
        p.bio?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [activeTab, profiles, searchQuery]);

  if (loading) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative">
          <Spinner />
          <div className="absolute inset-0 bg-brand-green/20 blur-2xl animate-pulse"></div>
        </div>
        <p className="text-text-secondary-light dark:text-text-secondary animate-pulse">Loading amazing people...</p>
      </div>
    ); 
  }
  
  if (error) { 
    return (
      <div className="max-w-4xl mx-auto mt-12 px-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl"></div>
          <div className="relative">
            <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-400 font-bold text-lg mb-2">Unable to load profiles</p>
            <p className="text-red-300/70 text-sm">{error}</p>
          </div>
        </div>
      </div>
    ); 
  }

  const TabButton: React.FC<{ tab: DirectoryTab; label: string; count?: number; icon: React.ReactNode }> = ({ tab, label, count, icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`group relative px-6 py-4 text-sm font-bold rounded-xl transition-all duration-300 overflow-hidden ${
        activeTab === tab
          ? 'bg-gradient-to-br from-brand-green to-brand-green/80 text-black shadow-xl shadow-brand-green/30 scale-105'
          : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary hover:scale-105 hover:shadow-lg'
      }`}
    >
      {activeTab === tab && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
      )}
      <span className="relative flex items-center gap-2.5">
        <span className={`transition-transform duration-300 ${activeTab === tab ? 'scale-110' : 'group-hover:scale-110'}`}>
          {icon}
        </span>
        <span>{label}</span>
        {count !== undefined && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all duration-300 ${
            activeTab === tab 
              ? 'bg-black/25 text-black shadow-inner' 
              : 'bg-tertiary-light dark:bg-tertiary group-hover:scale-110'
          }`}>
            {count}
          </span>
        )}
      </span>
    </button>
  );

  const getTabCount = (tab: DirectoryTab) => {
    if (tab === 'all') return profiles.length;
    if (tab === 'following') return profiles.filter(p => p.is_following).length;
    if (tab === 'followers') return profiles.filter(p => p.is_followed_by).length;
    return 0;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Decorative Background Elements */}
      <div className="fixed top-20 right-10 w-72 h-72 bg-brand-green/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-brand-green/3 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Header Section with Gradient */}
      <div className="relative mb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/10 via-brand-green/5 to-transparent rounded-3xl blur-xl"></div>
        <div className="relative bg-gradient-to-br from-secondary-light/50 dark:from-secondary/50 to-transparent backdrop-blur-sm rounded-3xl p-8 border border-tertiary-light/50 dark:border-tertiary/50">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-2 h-16 bg-gradient-to-b from-brand-green to-brand-green/50 rounded-full"></div>
                <div>
                  <h1 className="text-5xl font-black text-text-main-light dark:text-text-main bg-gradient-to-r from-text-main-light dark:from-text-main to-text-main-light/60 dark:to-text-main/60 bg-clip-text">
                    Community
                  </h1>
                  <p className="text-text-secondary-light dark:text-text-secondary text-lg mt-1">
                    {profiles.length} amazing {profiles.length === 1 ? 'person' : 'people'} to discover
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="flex gap-3">
              <div className="bg-secondary-light dark:bg-secondary rounded-xl px-5 py-3 border border-tertiary-light dark:border-tertiary">
                <div className="text-2xl font-bold text-brand-green">{getTabCount('following')}</div>
                <div className="text-xs text-text-tertiary-light dark:text-text-tertiary">Following</div>
              </div>
              <div className="bg-secondary-light dark:bg-secondary rounded-xl px-5 py-3 border border-tertiary-light dark:border-tertiary">
                <div className="text-2xl font-bold text-brand-green">{getTabCount('followers')}</div>
                <div className="text-xs text-text-tertiary-light dark:text-text-tertiary">Followers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or bio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-secondary-light dark:bg-secondary border border-tertiary-light dark:border-tertiary rounded-xl text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="inline-flex bg-secondary-light dark:bg-secondary rounded-2xl p-2 gap-2 shadow-lg border border-tertiary-light dark:border-tertiary">
          <TabButton 
            tab="all" 
            label="Everyone" 
            count={getTabCount('all')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <TabButton 
            tab="following" 
            label="Following" 
            count={getTabCount('following')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          />
          <TabButton 
            tab="followers" 
            label="Followers" 
            count={getTabCount('followers')}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
          />
        </div>
      </div>
      
      {/* Results Summary */}
      {searchQuery && (
        <div className="mb-6 flex items-center gap-3 bg-brand-green/10 border border-brand-green/30 rounded-lg px-4 py-2.5">
          <svg className="w-5 h-5 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-text-main-light dark:text-text-main">
            Found {filteredProfiles.length} {filteredProfiles.length === 1 ? 'result' : 'results'} for "{searchQuery}"
          </span>
        </div>
      )}
      
      {/* Profiles Grid */}
      <div className="relative">
        {filteredProfiles.length > 0 ? (
          <div className="grid gap-5">
            {filteredProfiles.map((profile, index) => (
              <div 
                key={profile.user_id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 hover:scale-[1.01] transition-transform"
                style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
              >
                <UserCard 
                  profile={profile} 
                  isCurrentUser={currentUser?.id === profile.user_id}
                  isToggling={togglingFollowId === profile.user_id}
                  onFollowToggle={handleFollowToggle}
                  onMessage={handleMessageUser}
                  activeTab={activeTab}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 px-6">
            <div className="max-w-lg mx-auto relative">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-green/5 via-brand-green/10 to-brand-green/5 rounded-3xl blur-2xl"></div>
              <div className="relative bg-secondary-light dark:bg-secondary rounded-3xl p-12 border-2 border-dashed border-tertiary-light dark:border-tertiary">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-brand-green/20 rounded-full animate-ping"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-tertiary-light dark:from-tertiary to-tertiary-light/50 dark:to-tertiary/50 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {searchQuery ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      )}
                    </svg>
                  </div>
                </div>
                <p className="text-2xl font-bold text-text-main-light dark:text-text-main mb-3">
                  {searchQuery ? 'No matches found' : 'Nothing to see here'}
                </p>
                <p className="text-text-secondary-light dark:text-text-secondary max-w-sm mx-auto leading-relaxed">
                  {searchQuery 
                    ? `We couldn't find anyone matching "${searchQuery}". Try a different search term.`
                    : activeTab === 'following' 
                      ? "Start following people to build your network and see them here"
                      : activeTab === 'followers' 
                        ? "When people follow you, they'll appear here. Share your profile to get started!"
                        : "No users found in the directory"
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryPage;