import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';
import Spinner from '../components/Spinner';
import Conversation from '../components/Conversation';
import { getKeyPair } from '../services/encryption';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const initializeChat = async () => {
      setLoading(true);
      try {
        await getKeyPair(); 
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
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
  
  const filteredProfiles = profiles.filter(profile =>
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
            <Spinner />
        </div>
    );
  }

  return (
    // This container manages the overall size and appearance.
    <div className="relative h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] w-full overflow-hidden bg-dark-secondary md:rounded-xl md:border md:border-dark-tertiary md:shadow-2xl">
      
      {/* This inner container handles the sliding animation for mobile. */}
      <div className={`relative w-full h-full flex transition-transform duration-300 ease-in-out md:transform-none ${selectedProfile ? '-translate-x-full' : 'translate-x-0'}`}>
        
        {/* Pane 1: Contacts List */}
        <div className="w-full h-full flex-shrink-0 md:w-96 md:border-r md:border-dark-tertiary flex flex-col">
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
                className="p-4 flex items-center space-x-4 cursor-pointer hover:bg-dark-tertiary transition-colors"
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

        {/* Pane 2: Conversation View */}
        <div className="w-full h-full flex-shrink-0 md:flex-1 flex flex-col">
          {selectedProfile && (
            <Conversation 
              recipient={selectedProfile} 
              onBack={() => setSelectedProfile(null)} // This function allows the mobile view to slide back
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatPage;