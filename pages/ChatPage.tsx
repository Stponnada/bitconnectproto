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
import { requestNotificationPermission } from '../utils/notifications';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { conversations, loading, markConversationAsRead } = useChat();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

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
  
  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
  };

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
    <div className="relative h-[calc(100vh-144px)] md:h-[calc(100vh-120px)] w-full overflow-hidden bg-gradient-to-br from-secondary-light to-primary-light dark:from-secondary dark:to-primary md:rounded-xl md:border md:border-tertiary-light/30 dark:md:border-tertiary/30 md:shadow-2xl">
      
      <div className={`relative w-full h-full flex transition-transform duration-300 ease-in-out md:transform-none ${selectedProfile ? '-translate-x-full' : 'translate-x-0'}`}>
        
        {/* Sidebar */}
        <div className="w-full h-full flex-shrink-0 md:w-96 md:border-r md:border-tertiary-light/40 dark:md:border-tertiary/40 flex flex-col backdrop-blur-sm bg-primary-light/50 dark:bg-primary/50">
          
          {/* Header */}
          <div className="p-5 border-b border-tertiary-light/40 dark:border-tertiary/40 bg-gradient-to-r from-brand-green/5 to-transparent">
            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-3 flex items-center gap-2">
              <ChatIcon className="w-6 h-6 text-brand-green" />
              Messages
            </h2>
            <div className="relative">
              <input
                type="text" 
                placeholder="Search conversations..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/60 dark:bg-gray-800/60 border border-tertiary-light/50 dark:border-gray-600/50 rounded-xl text-sm text-text-main-light dark:text-text-main placeholder:text-text-tertiary-light dark:placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all shadow-sm"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary-light dark:text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Notification Banner */}
          {notificationPermission === 'default' && (
            <div className="px-4 py-3 bg-gradient-to-r from-yellow-50 to-yellow-100/50 dark:from-yellow-900/30 dark:to-yellow-900/20 border-b border-yellow-200/50 dark:border-yellow-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">Stay updated with notifications</span>
                </div>
                <button 
                  onClick={handleEnableNotifications} 
                  className="text-xs text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 font-semibold underline transition-colors"
                >
                  Enable
                </button>
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-tertiary-light dark:scrollbar-thumb-tertiary scrollbar-track-transparent">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                <div className="w-16 h-16 rounded-full bg-tertiary-light/30 dark:bg-tertiary/30 flex items-center justify-center mb-4">
                  <ChatIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" />
                </div>
                <p className="text-text-secondary-light dark:text-text-secondary text-sm">
                  {searchTerm ? 'No conversations found' : 'No messages yet'}
                </p>
              </div>
            ) : (
              <ul className="py-2">
                {filteredConversations.map(conv => (
                  <li 
                    key={conv.participant.user_id} 
                    onClick={() => handleSelectConversation(conv.participant)}
                    className={`mx-2 mb-1 p-3.5 rounded-xl flex items-center space-x-3.5 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedProfile?.user_id === conv.participant.user_id 
                        ? 'bg-gradient-to-r from-brand-green/20 to-brand-green/10 dark:from-brand-green/30 dark:to-brand-green/20 shadow-sm border border-brand-green/20 dark:border-brand-green/30' 
                        : 'hover:bg-white/60 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    {/* Avatar with online indicator */}
                    <div className="relative flex-shrink-0">
                      <img 
                        src={conv.participant.avatar_url || `https://ui-avatars.com/api/?name=${conv.participant.full_name || conv.participant.username}&background=10b981&color=fff`} 
                        alt={conv.participant.username} 
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-white/50 dark:ring-gray-700/50 shadow-sm"
                      />
                      {conv.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-brand-green rounded-full flex items-center justify-center shadow-lg ring-2 ring-primary-light dark:ring-primary">
                          <span className="text-[10px] font-bold text-black">{conv.unread_count}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2 mb-1">
                        <p className="font-semibold text-text-main-light dark:text-text-main truncate text-[15px]">
                          {conv.participant.full_name}
                        </p>
                        {conv.last_message_at && (
                          <p className="text-[11px] text-text-tertiary-light dark:text-text-tertiary flex-shrink-0 font-medium">
                            {formatTimestamp(conv.last_message_at)}
                          </p>
                        )}
                      </div>
                      
                      <p className={`text-[13px] truncate leading-relaxed ${
                        conv.unread_count > 0 
                          ? 'text-text-main-light dark:text-text-main font-medium' 
                          : 'text-text-secondary-light dark:text-text-secondary'
                      }`}>
                        {conv.last_message_content ? (
                          <>
                            {conv.last_message_sender_id === user?.id && (
                              <span className="text-text-tertiary-light dark:text-text-tertiary">You: </span>
                            )}
                            {conv.last_message_content}
                          </>
                        ) : (
                          <span className="italic text-text-tertiary-light dark:text-text-tertiary">No messages yet</span>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="w-full h-full flex-shrink-0 md:flex-1 flex flex-col bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
          {selectedProfile ? (
            <Conversation 
              recipient={selectedProfile} 
              onBack={() => setSelectedProfile(null)}
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center px-8">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-green/10 dark:bg-brand-green/20 rounded-full blur-3xl"></div>
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-brand-green/20 to-brand-green/10 dark:from-brand-green/30 dark:to-brand-green/20 flex items-center justify-center mb-6 shadow-lg">
                  <ChatIcon className="w-12 h-12 text-brand-green"/>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-2">
                Select a conversation
              </h3>
              <div className="space-y-1.5 text-text-secondary-light dark:text-text-secondary max-w-md">
                <p className="text-[15px]">Choose from your contacts to start chatting.</p>
                <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">
                  Your contacts include people you follow and people who follow you.
                </p>
                <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">
                  To chat with others, find them in the User Directory.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatPage;