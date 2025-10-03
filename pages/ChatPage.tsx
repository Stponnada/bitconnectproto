import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';
import Spinner from '../components/Spinner';
import Conversation from '../components/Conversation';
import { useChat } from '../contexts/ChatContext'; // <-- Import the new context hook
import { formatTimestamp } from '../utils/timeUtils'; // To format the last message time

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  // State from our new context, conversations are now sorted by recency
  const { conversations, loading, markConversationAsRead } = useChat();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectConversation = useCallback((profile: Profile) => {
    setSelectedProfile(profile);
    // When a conversation is selected, mark its messages as read
    markConversationAsRead(profile.user_id);
  }, [markConversationAsRead]);
  
  // Filter conversations based on the search term
  const filteredConversations = conversations.filter(conv =>
    conv.participant.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participant.username.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h2 className="text-xl font-bold">Messages</h2>
            <input
              type="text" 
              placeholder="Search contacts..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full mt-3 p-2 bg-dark-primary border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <ul className="flex-1 overflow-y-auto">
            {filteredConversations.map(conv => (
              <li 
                key={conv.participant.user_id} 
                onClick={() => handleSelectConversation(conv.participant)}
                className="p-4 flex items-center space-x-4 cursor-pointer hover:bg-dark-tertiary transition-colors"
              >
                <img 
                  src={conv.participant.avatar_url || `https://ui-avatars.com/api/?name=${conv.participant.full_name || conv.participant.username}`} 
                  alt={conv.participant.username} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <p className="font-bold text-white truncate">{conv.participant.full_name}</p>
                    <p className="text-xs text-gray-500 flex-shrink-0">{formatTimestamp(conv.last_message_at)}</p>
                  </div>
                  <div className="flex justify-between items-start mt-1">
                     <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-white font-semibold' : 'text-gray-400'}`}>
                        {conv.last_message_sender_id === user?.id ? 'You: ' : ''}
                        {conv.last_message_content}
                     </p>
                    {conv.unread_count > 0 && (
                       <span className="flex-shrink-0 ml-2 bg-brand-green text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{conv.unread_count}</span>
                    )}
                  </div>
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