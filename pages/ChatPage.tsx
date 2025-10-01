// src/pages/ChatPage.tsx (Updated)

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';
import Spinner from '../components/Spinner';
import Conversation from '../components/Conversation';
import { ChatIcon } from '../components/icons'; // Using an existing icon for the empty state

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // State for the search input

  useEffect(() => {
    const initializeChat = async () => {
      setLoading(true);
      try {
        await getKeyPair(); 
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        // Filter out the current user from the list
        setProfiles(data?.filter(p => p.user_id !== user?.id) || []);
      } catch (error: any) {
        console.error("Error initializing chat:", error.message);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
        initializeChat();
    }
  }, [user]);
  
  // Filter profiles based on search term
  const filteredProfiles = profiles.filter(profile =>
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center p-8"><Spinner /></div>;
  }

  return (
    // NEW: Main container for the entire chat interface
    <div className="bg-dark-secondary rounded-xl border border-dark-tertiary shadow-2xl h-[calc(100vh-120px)] flex overflow-hidden">
      
      {/* MODIFIED: Wider contacts panel with search */}
      <div className="w-96 border-r border-dark-tertiary flex flex-col">
        <div className="p-4 border-b border-dark-tertiary">
          <h2 className="text-xl font-bold">Contacts</h2>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full mt-3 p-2 bg-dark-primary border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {filteredProfiles.map(profile => (
            <li
              key={profile.user_id}
              onClick={() => setSelectedProfile(profile)}
              className={`p-4 flex items-center space-x-4 cursor-pointer transition-colors duration-200 border-l-4 ${
                selectedProfile?.user_id === profile.user_id 
                  ? 'border-brand-green bg-dark-tertiary' 
                  : 'border-transparent hover:bg-dark-tertiary'
              }`}
            >
              <img
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name || profile.username}`}
                alt={profile.username}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-white">{profile.full_name}</p>
                <p className="text-sm text-gray-400">@{profile.username}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Conversation Panel */}
      <div className="flex-1 flex flex-col">
        {selectedProfile ? (
          <Conversation recipient={selectedProfile} />
        ) : (
          // NEW: More engaging empty state
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 p-8">
            <ChatIcon className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300">Your Messages</h3>
            <p className="mt-2 max-w-sm">Select a contact from the left panel to view your conversation or start a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;