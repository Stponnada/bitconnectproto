// src/pages/ChatPage.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';
import Spinner from '../components/Spinner';
import Conversation from '../components/Conversation';
import { useChat } from '../hooks/useChat';
import { formatTimestamp } from '../utils/timeUtils';
import { ChatIcon } from '../components/icons';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { conversations, loading, markConversationAsRead } = useChat();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const recipient = location.state?.recipient as Profile | undefined;
    if (recipient) {
      const existsInList = conversations.some(c => c.participant.user_id === recipient.user_id);
      setSelectedProfile(recipient);
      if(existsInList) {
          markConversationAsRead(recipient.user_id);
      }
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
    <div className="relative h-[calc(100vh-144px)] md:h-[calc(100vh-120px)] w-full overflow-hidden bg-gradient-to-br from-secondary-light via-secondary-light to-primary-light/30 dark:from-secondary dark:via-secondary dark:to-primary/20 md:rounded-xl md:border md:border-tertiary-light/50 dark:md:border-tertiary/50 md:shadow-2xl backdrop-blur-sm">
      <div className={`relative w-full h-full flex transition-transform duration-300 ease-in-out md:transform-none ${selectedProfile ? '-translate-x-full' : 'translate-x-0'}`}>
        {/* Sidebar */}
        <div className="w-full h-full flex-shrink-0 md:w-96 md:border-r md:border-tertiary-light/50 dark:md:border-tertiary/50 flex flex-col backdrop-blur-sm bg-white/30 dark:bg-black/10">
          {/* Header with gradient */}
          <div className="p-4 border-b border-tertiary-light/50 dark:border-tertiary/50 bg-gradient-to-r from-brand-green/5 to-transparent">
            <h2 className="text-xl font-bold text-text-main-light dark:text-text-main mb-3 flex items-center gap-2">
              <ChatIcon className="w-6 h-6 text-brand-green" />
              Messages
            </h2>
            <div className="relative">
              <input
                type="text" 
                placeholder="Search contacts..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2.5 pl-9 bg-primary-light/80 dark:bg-primary/80 border border-tertiary-light dark:border-gray-600 rounded-lg text-sm text-text-main-light dark:text-text-main placeholder:text-text-tertiary-light dark:placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all duration-200 backdrop-blur-sm"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary-light dark:text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Conversations List */}
          <ul className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-brand-green/30 hover:scrollbar-thumb-brand-green/50 dark:scrollbar-thumb-brand-green/40 dark:hover:scrollbar-thumb-brand-green/60 scrollbar-track-transparent">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-text-tertiary-light dark:text-text-tertiary">
                <ChatIcon className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">No conversations found</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <li 
                  key={conv.participant.user_id} 
                  onClick={() => handleSelectConversation(conv.participant)}
                  className={`group p-4 flex items-center space-x-4 cursor-pointer hover:bg-tertiary-light/60 dark:hover:bg-tertiary/60 transition-all duration-200 border-b border-tertiary-light/30 dark:border-tertiary/30 ${selectedProfile?.user_id === conv.participant.user_id ? 'bg-gradient-to-r from-brand-green/10 to-transparent border-l-4 border-l-brand-green' : ''}`}
                >
                  <div className="relative">
                    <img 
                      src={conv.participant.avatar_url || `https://ui-avatars.com/api/?name=${conv.participant.full_name || conv.participant.username}`} 
                      alt={conv.participant.username} 
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-tertiary-light dark:ring-tertiary group-hover:ring-brand-green/30 transition-all duration-200"
                    />
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-brand-green text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <p className="font-bold text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors duration-200">
                        {conv.participant.full_name}
                      </p>
                      {conv.last_message_at && (
                        <p className="text-xs text-text-tertiary-light dark:text-text-tertiary flex-shrink-0 ml-2">
                          {formatTimestamp(conv.last_message_at)}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-start mt-1">
                      <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-text-main-light dark:text-text-main font-semibold' : 'text-text-secondary-light dark:text-text-secondary'}`}>
                        {conv.last_message_content ? (
                          <>
                            {conv.last_message_sender_id === user?.id && (
                              <span className="text-brand-green">You: </span>
                            )}
                            {conv.last_message_content}
                          </>
                        ) : (
                          <span className="italic text-text-tertiary-light dark:text-text-tertiary">No messages yet</span>
                        )}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Main Chat Area */}
        <div className="w-full h-full flex-shrink-0 md:flex-1 flex flex-col">
          {selectedProfile ? (
            <Conversation 
              recipient={selectedProfile} 
              onBack={() => setSelectedProfile(null)}
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-text-tertiary-light dark:text-text-tertiary p-8">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-green/10 blur-3xl rounded-full"></div>
                <ChatIcon className="relative w-20 h-20 mb-6 text-brand-green/70"/>
              </div>
              <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-2 bg-gradient-to-r from-brand-green to-brand-green/60 bg-clip-text text-transparent">
                Select a conversation
              </h3>
              <p className="text-text-secondary-light dark:text-text-secondary mb-2 max-w-md">
                Choose from your contacts to start chatting.
              </p>
              <div className="mt-6 space-y-2 text-sm max-w-md">
                <div className="flex items-center justify-center gap-2 text-text-tertiary-light dark:text-text-tertiary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Your contacts include people you follow and people who follow you</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-text-tertiary-light dark:text-text-tertiary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>To chat with others, find them in the User Directory</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatPage;