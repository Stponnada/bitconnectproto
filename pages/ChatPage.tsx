import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // <-- Import useLocation
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';
import Spinner from '../components/Spinner';
import Conversation from '../components/Conversation';
import { useChat } from '../contexts/ChatContext';
import { formatTimestamp } from '../utils/timeUtils';
import { ChatIcon } from '../components/icons';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation(); // <-- Add useLocation hook
  const { conversations, loading, markConversationAsRead } = useChat();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // <-- NEW: Effect to handle incoming recipient from navigation state
  useEffect(() => {
    const recipient = location.state?.recipient as Profile | undefined;
    if (recipient) {
      // Check if this conversation already exists to prevent duplicate state updates
      const existsInList = conversations.some(c => c.participant.user_id === recipient.user_id);
      setSelectedProfile(recipient);
      if(existsInList) {
          markConversationAsRead(recipient.user_id);
      }
      // Clear the state after using it to prevent re-triggering on component re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, conversations, markConversationAsRead]);

  const handleSelectConversation = useCallback((profile: Profile) => {
    setSelectedProfile(profile);
    markConversationAsRead(profile.user_id);
  }, [markConversationAsRead]);
  
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
    <div className="relative h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] w-full overflow-hidden bg-dark-secondary md:rounded-xl md:border md:border-dark-tertiary md:shadow-2xl">
      
      <div className={`relative w-full h-full flex transition-transform duration-300 ease-in-out md:transform-none ${selectedProfile ? '-translate-x-full' : 'translate-x-0'}`}>
        
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
                className={`p-4 flex items-center space-x-4 cursor-pointer hover:bg-dark-tertiary transition-colors ${selectedProfile?.user_id === conv.participant.user_id ? 'bg-dark-tertiary' : ''}`}
              >
                <img 
                  src={conv.participant.avatar_url || `https://ui-avatars.com/api/?name=${conv.participant.full_name || conv.participant.username}`} 
                  alt={conv.participant.username} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <p className="font-bold text-white truncate">{conv.participant.full_name}</p>
                    {conv.last_message_at && (
                      <p className="text-xs text-gray-500 flex-shrink-0">{formatTimestamp(conv.last_message_at)}</p>
                    )}
                  </div>
                  <div className="flex justify-between items-start mt-1">
                     <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-white font-semibold' : 'text-gray-400'}`}>
                        {conv.last_message_content ? (
                            <>
                                {conv.last_message_sender_id === user?.id && 'You: '}
                                {conv.last_message_content}
                            </>
                        ) : (
                            <span className="italic">No messages yet</span>
                        )}
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

        <div className="w-full h-full flex-shrink-0 md:flex-1 flex flex-col">
          {selectedProfile ? (
            <Conversation 
              recipient={selectedProfile} 
              onBack={() => setSelectedProfile(null)}
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-gray-500">
                <ChatIcon className="w-16 h-16 mb-4"/>
                <h3 className="text-xl font-semibold text-white">Select a conversation</h3>
                <p>Choose from your contacts to start chatting.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatPage;