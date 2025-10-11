// src/components/CreateGroupModal.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';
import Spinner from './Spinner';
import { XCircleIcon, UserGroupIcon } from './icons';

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: (conversationId: string) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onGroupCreated }) => {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate consistent color based on user ID
  const getAvatarColor = (userId: string) => {
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
      'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
      'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
      'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Get initials from name
  const getInitials = (name: string | null | undefined, username: string) => {
    if (name && name.trim()) {
      return name.trim()[0].toUpperCase();
    }
    return username[0].toUpperCase();
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_directory_profiles');
      if (error) {
        console.error("Error fetching users for group chat:", error);
      } else {
        setAvailableUsers(data.filter((p: Profile) => p.user_id !== user?.id) || []);
      }
      setLoading(false);
    };
    fetchUsers();
  }, [user]);

  const handleToggleUser = (profile: Profile) => {
    if (selectedUsers.some(u => u.user_id === profile.user_id)) {
      setSelectedUsers(selectedUsers.filter(u => u.user_id !== profile.user_id));
    } else {
      setSelectedUsers([...selectedUsers, profile]);
    }
  };

  const handleSubmit = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      setError("Group name and at least one member are required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const participant_ids = selectedUsers.map(u => u.user_id);
      const { data, error: rpcError } = await supabase.rpc('create_group_chat', { group_name: groupName, participant_ids });
      if (rpcError) throw rpcError;
      onGroupCreated(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = availableUsers.filter(p =>
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-secondary-light to-tertiary-light dark:from-secondary dark:to-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-tertiary-light/50 dark:border-tertiary/50 animate-slideUp overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with gradient accent */}
        <header className="relative flex items-center justify-between p-6 border-b border-tertiary-light/30 dark:border-tertiary/30 bg-gradient-to-r from-brand-green/5 to-transparent">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-brand-green/10 rounded-xl">
              <UserGroupIcon className="w-6 h-6 text-brand-green" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-green to-emerald-400 bg-clip-text text-transparent">
              Create a Group
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary-light dark:text-text-tertiary hover:text-red-400 hover:rotate-90 transition-all duration-300"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Group name input with icon */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary dark:text-text-tertiary flex items-center gap-2">
              <span className="w-1 h-4 bg-brand-green rounded-full"></span>
              Group Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="w-full p-4 bg-white/50 dark:bg-tertiary/50 rounded-xl border border-tertiary-light/50 dark:border-gray-600/50 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all duration-200 backdrop-blur-sm"
                placeholder="Enter a catchy group name..."
              />
            </div>
          </div>

          {/* Selected members chips */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-text-secondary dark:text-text-tertiary flex items-center gap-2">
                <span className="w-1 h-4 bg-brand-green rounded-full"></span>
                Selected Members ({selectedUsers.length})
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-brand-green/5 dark:bg-brand-green/10 rounded-xl border border-brand-green/20">
                {selectedUsers.map(user => (
                  <div
                    key={user.user_id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-tertiary rounded-full border border-brand-green/30 shadow-sm"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(user.user_id)}`}>
                        {getInitials(user.full_name, user.username)}
                      </div>
                    )}
                    <span className="text-sm font-medium">{user.full_name || user.username}</span>
                    <button
                      onClick={() => handleToggleUser(user)}
                      className="text-text-tertiary hover:text-red-400 transition"
                    >
                      <XCircleIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search input with icon */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-text-secondary dark:text-text-tertiary flex items-center gap-2">
              <span className="w-1 h-4 bg-brand-green rounded-full"></span>
              Add Members
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-4 pl-10 bg-white/50 dark:bg-tertiary/50 rounded-xl border border-tertiary-light/50 dark:border-gray-600/50 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all duration-200 backdrop-blur-sm"
                placeholder="Search for people..."
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary-light dark:text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* User list with enhanced styling */}
          <div className="rounded-xl border border-tertiary-light/50 dark:border-tertiary/50 overflow-hidden bg-white/30 dark:bg-tertiary/30 backdrop-blur-sm">
            <div className="max-h-72 overflow-y-auto divide-y divide-tertiary-light/30 dark:divide-tertiary/30">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Spinner />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-tertiary-light/50 dark:bg-tertiary/50 flex items-center justify-center mb-3">
                    <UserGroupIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" />
                  </div>
                  <p className="text-text-tertiary-light dark:text-text-tertiary font-medium">No users found</p>
                  <p className="text-sm text-text-tertiary-light/70 dark:text-text-tertiary/70 mt-1">Try a different search term</p>
                </div>
              ) : (
                filteredUsers.map(profile => {
                  const isSelected = selectedUsers.some(u => u.user_id === profile.user_id);
                  return (
                    <button
                      key={profile.user_id}
                      onClick={() => handleToggleUser(profile)}
                      className={`flex items-center space-x-3 p-4 w-full text-left transition-all duration-200 hover:bg-white/50 dark:hover:bg-tertiary/50 ${
                        isSelected
                          ? 'bg-brand-green/10 dark:bg-brand-green/20 border-l-4 border-brand-green'
                          : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="h-5 w-5 accent-brand-green cursor-pointer rounded"
                        />
                      </div>
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.username}
                          className={`w-12 h-12 rounded-full object-cover border-2 transition-all ${
                            isSelected
                              ? 'border-brand-green shadow-lg shadow-brand-green/20'
                              : 'border-tertiary-light dark:border-tertiary'
                          }`}
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold border-2 transition-all ${getAvatarColor(profile.user_id)} ${
                          isSelected
                            ? 'border-brand-green shadow-lg shadow-brand-green/20'
                            : 'border-tertiary-light dark:border-tertiary'
                        }`}>
                          {getInitials(profile.full_name, profile.username)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{profile.full_name}</p>
                        <p className="text-sm text-text-tertiary-light dark:text-text-tertiary truncate">@{profile.username}</p>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse"></div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </main>

        {/* Error Message with better styling */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-500/10 border border-red-400/30 rounded-xl backdrop-blur-sm">
            <p className="text-sm text-red-400 text-center font-medium">{error}</p>
          </div>
        )}

        {/* Footer with enhanced buttons */}
        <footer className="flex justify-end space-x-3 p-6 border-t border-tertiary-light/30 dark:border-tertiary/30 bg-gradient-to-r from-transparent to-brand-green/5">
          <button
            onClick={onClose}
            className="py-3 px-6 rounded-xl font-medium hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50 transition-all duration-200 border border-transparent hover:border-tertiary-light dark:hover:border-tertiary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !groupName.trim() || selectedUsers.length === 0}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-brand-green to-emerald-400 text-black font-bold shadow-lg shadow-brand-green/30 hover:shadow-xl hover:shadow-brand-green/40 hover:scale-105 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <>
                <Spinner />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <UserGroupIcon className="w-5 h-5" />
                <span>Create Group</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CreateGroupModal;