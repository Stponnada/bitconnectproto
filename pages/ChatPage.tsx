// src/pages/ChatPage.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Profile, ConversationSummary } from '../types';
import Spinner from '../components/Spinner';
import Conversation from '../components/Conversation';
import CreateGroupModal from '../components/CreateGroupModal';
import { useChat } from '../hooks/useChat';
import { formatTimestamp } from '../utils/timeUtils';
import { ChatIcon, UserGroupIcon } from '../components/icons';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { conversations, loading, markConversationAsRead, fetchConversations, updateConversationId } = useChat();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isGroupModalOpen, setGroupModalOpen] = useState(false);

  useEffect(() => {
    const recipient = location.state?.recipient as Profile | undefined;
    if (recipient) {
      const existingChat = conversations.find(c => 
        c.type === 'dm' && c.participants.some(p => p.user_id === recipient.user_id)
      );

      if (existingChat) {
        setSelectedConversationId(existingChat.conversation_id);
        if (!existingChat.conversation_id.startsWith('placeholder_')) {
            markConversationAsRead(existingChat.conversation_id);
        }
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, conversations, markConversationAsRead]);

  const handleSelectConversation = useCallback((conversation: ConversationSummary) => {
    setSelectedConversationId(conversation.conversation_id);
    if (!conversation.conversation_id.startsWith('placeholder_')) {
      markConversationAsRead(conversation.conversation_id);
    }
  }, [markConversationAsRead]);
  
  const handleConversationCreated = (placeholderId: string, newConversationId: string) => {
    updateConversationId(placeholderId, newConversationId);
    setSelectedConversationId(newConversationId);
  };

  const handleGroupCreated = (conversationId: string) => {
    setGroupModalOpen(false);
    fetchConversations();
    setSelectedConversationId(conversationId);
  };

  const getOtherParticipant = (convo: ConversationSummary) => {
    return convo.participants.find(p => p.user_id !== user?.id) || convo.participants[0] || null;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedConversation = conversations.find(c => c.conversation_id === selectedConversationId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-144px)] md:h-[calc(100vh-120px)] w-full overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900/50 md:rounded-2xl md:border md:border-gray-200/80 dark:md:border-gray-700/80 md:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)] dark:md:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)]">
      {isGroupModalOpen && <CreateGroupModal onClose={() => setGroupModalOpen(false)} onGroupCreated={handleGroupCreated} />}
      
      <div className={`relative w-full h-full flex transition-transform duration-300 ease-in-out md:transform-none ${selectedConversationId ? '-translate-x-full' : 'translate-x-0'}`}>
        {/* Sidebar */}
        <div className="w-full h-full flex-shrink-0 md:w-[380px] md:border-r md:border-gray-200/80 dark:md:border-gray-700/80 flex flex-col backdrop-blur-xl bg-white/40 dark:bg-gray-900/40">
          {/* Header */}
          <div className="p-5 pb-4 border-b border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-green to-emerald-600 bg-clip-text text-transparent flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-brand-green/20 to-emerald-500/20 dark:from-brand-green/30 dark:to-emerald-500/30">
                  <ChatIcon className="w-5 h-5 text-brand-green" />
                </div>
                Messages
              </h2>
              <button 
                onClick={() => setGroupModalOpen(true)} 
                className="group relative p-2.5 rounded-xl bg-gradient-to-br from-brand-green/10 to-emerald-500/10 hover:from-brand-green/20 hover:to-emerald-500/20 dark:from-brand-green/20 dark:to-emerald-500/20 dark:hover:from-brand-green/30 dark:hover:to-emerald-500/30 transition-all duration-300 hover:scale-105 active:scale-95" 
                title="Create a group"
              >
                <UserGroupIcon className="w-5 h-5 text-brand-green" />
                <span className="absolute -bottom-8 right-0 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  New Group
                </span>
              </button>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all duration-200"
              />
            </div>
          </div>

          {/* Conversations List */}
          <ul className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-4">
                  <ChatIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">No conversations found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start a new chat to get connected</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const otherParticipant = conv.type === 'dm' ? getOtherParticipant(conv) : null;
                const displayName = conv.type === 'group' ? conv.name : otherParticipant?.full_name || 'User';
                const avatar = conv.type === 'dm' ? otherParticipant?.avatar_url : null;
                const avatarSrc = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                const isSelected = selectedConversationId === conv.conversation_id;

                return (
                  <li 
                    key={conv.conversation_id} 
                    onClick={() => handleSelectConversation(conv)}
                    className={`group relative px-4 py-3.5 flex items-center space-x-3.5 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-brand-green/15 via-brand-green/10 to-transparent dark:from-brand-green/25 dark:via-brand-green/15 dark:to-transparent border-l-[3px] border-l-brand-green' 
                        : 'hover:bg-gray-100/60 dark:hover:bg-gray-800/60 border-l-[3px] border-l-transparent'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {conv.type === 'group' ? (
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-green/20 to-emerald-500/20 dark:from-brand-green/30 dark:to-emerald-500/30 flex items-center justify-center ring-2 ring-white/50 dark:ring-gray-800/50 transition-transform duration-200 group-hover:scale-105">
                          <UserGroupIcon className="w-7 h-7 text-brand-green"/>
                        </div>
                      ) : (
                        <img 
                          src={avatarSrc} 
                          alt={displayName} 
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/50 dark:ring-gray-800/50 transition-transform duration-200 group-hover:scale-105"
                        />
                      )}
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-br from-brand-green to-emerald-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-gray-900 animate-pulse">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      )}
                      
                      {/* Online status indicator (you can add logic for this) */}
                      {conv.type === 'dm' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-900"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className={`font-semibold truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                          {displayName}
                        </p>
                        {conv.last_message_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2 font-medium">
                            {formatTimestamp(conv.last_message_at)}
                          </p>
                        )}
                      </div>
                      <p className={`text-sm truncate transition-colors ${
                        conv.unread_count > 0 
                          ? 'font-semibold text-gray-900 dark:text-white' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {conv.last_message_sender_id === user?.id && (
                          <span className="text-gray-500 dark:text-gray-500">You: </span>
                        )}
                        {conv.last_message_content || 'No messages yet'}
                      </p>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Main Chat Area */}
        <div className="w-full h-full flex-shrink-0 md:flex-1 flex flex-col bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
          {selectedConversation ? (
            <Conversation 
              key={selectedConversation.conversation_id}
              conversation={selectedConversation}
              onBack={() => setSelectedConversationId(null)}
              onConversationCreated={handleConversationCreated}
            />
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center p-8">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-brand-green/20 via-emerald-500/20 to-teal-500/20 dark:from-brand-green/30 dark:via-emerald-500/30 dark:to-teal-500/30 flex items-center justify-center animate-pulse">
                  <ChatIcon className="w-16 h-16 text-brand-green" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-teal-400/30 dark:from-emerald-500/40 dark:to-teal-500/40 blur-xl"></div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Your Messages
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                Select a conversation from the sidebar to start chatting with your connections
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;