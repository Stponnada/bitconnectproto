// src/components/FollowListModal.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';
import Spinner from './Spinner';
import UserCard from './UserCard';
import { XCircleIcon } from './icons';

interface FollowListModalProps {
  profile: Profile;
  listType: 'followers' | 'following';
  onClose: () => void;
}

const FollowListModal: React.FC<FollowListModalProps> = ({ profile, listType, onClose }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [userList, setUserList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingFollowId, setTogglingFollowId] = useState<string | null>(null);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.rpc('get_follow_list', {
        profile_user_id: profile.user_id,
        list_type: listType,
      });

      if (error) {
        console.error(`Error fetching ${listType}:`, error);
        setError(`Failed to load ${listType}.`);
      } else {
        setUserList(data as Profile[]);
      }
      setLoading(false);
    };
    fetchList();
  }, [profile.user_id, listType]);

  const handleFollowToggle = async (profileToToggle: Profile) => {
    if (!currentUser) return;
    setTogglingFollowId(profileToToggle.user_id);
    const isCurrentlyFollowing = profileToToggle.is_following;

    setUserList(currentList =>
      currentList.map(p =>
        p.user_id === profileToToggle.user_id
          ? { ...p, is_following: !isCurrentlyFollowing }
          : p
      )
    );

    try {
      if (isCurrentlyFollowing) {
        await supabase.from('followers').delete().match({ follower_id: currentUser.id, following_id: profileToToggle.user_id });
      } else {
        await supabase.from('followers').insert({ follower_id: currentUser.id, following_id: profileToToggle.user_id });
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err);
      // Revert on error
      setUserList(currentList => currentList.map(p => (p.user_id === profileToToggle.user_id ? profileToToggle : p)));
    } finally {
      setTogglingFollowId(null);
    }
  };
  
  const handleMessageUser = (profileToMessage: Profile) => {
    navigate('/chat', { state: { recipient: profileToMessage } });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-dark-secondary rounded-xl shadow-lg w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-dark-tertiary">
          <h2 className="text-xl font-bold capitalize">{listType}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <XCircleIcon className="w-8 h-8" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          {loading && <div className="flex justify-center p-8"><Spinner /></div>}
          {error && <p className="text-center text-red-400 p-8">{error}</p>}
          {!loading && userList.length === 0 && (
            <p className="text-center text-gray-500 p-8">No users to display.</p>
          )}
          {!loading && userList.length > 0 && (
            <div className="space-y-4">
              {userList.map(p => (
                <UserCard
                  key={p.user_id}
                  profile={p}
                  isCurrentUser={currentUser?.id === p.user_id}
                  isToggling={togglingFollowId === p.user_id}
                  onFollowToggle={handleFollowToggle}
                  onMessage={handleMessageUser}
                  listType={listType}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FollowListModal;