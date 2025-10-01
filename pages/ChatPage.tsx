// src/pages/ChatPage.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import Spinner from '../components/Spinner';
import Conversation from '../components/Conversation'; // We will create this next
import { getKeyPair } from '../services/encryption';

const ChatPage: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
      setLoading(true);
      try {
        // Ensure user has a keypair before starting chat
        await getKeyPair(); 
        
        // Fetch all profiles to display in a list
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        setProfiles(data || []);
      } catch (error: any) {
        console.error("Error initializing chat:", error.message);
      } finally {
        setLoading(false);
      }
    };
    initializeChat();
  }, []);

  if (loading) {
    return <div className="text-center p-8"><Spinner /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-80px)]"> {/* Full height minus header */}
      {/* User List Panel */}
      <div className="w-1/3 border-r border-dark-tertiary overflow-y-auto">
        <h2 className="text-xl font-bold p-4 border-b border-dark-tertiary">Contacts</h2>
        <ul>
          {profiles.map(profile => (
            <li
              key={profile.user_id}
              onClick={() => setSelectedProfile(profile)}
              className={`p-4 cursor-pointer hover:bg-dark-tertiary ${selectedProfile?.user_id === profile.user_id ? 'bg-dark-tertiary' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}`}
                  alt={profile.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-white">{profile.full_name}</p>
                  <p className="text-sm text-gray-400">@{profile.username}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Conversation Panel */}
      <div className="w-2/3 flex flex-col">
        {selectedProfile ? (
          <Conversation recipient={selectedProfile} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Select a contact to start a conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;