// src/contexts/ChatContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { ConversationSummary } from '../types';

interface ChatContextType {
  conversations: ConversationSummary[];
  totalUnreadCount: number;
  loading: boolean;
  markConversationAsRead: (participantId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // This RPC function needs to be created in Supabase.
    // It should query and return a summary for each of the user's conversations.
    const { data, error } = await supabase.rpc('get_user_conversations_with_unread');
    
    if (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } else {
      const convos = data as ConversationSummary[];
      setConversations(convos || []);
      const unread = (convos || []).reduce((sum: number, conv) => sum + conv.unread_count, 0);
      setTotalUnreadCount(unread);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  useEffect(() => {
    if (!user) return;

    // Listen for new messages to the current user and refetch everything.
    // This keeps the unread counts and conversation order up-to-date.
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      },
      () => {
        fetchConversations();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);
  
  const markConversationAsRead = useCallback(async (participantId: string) => {
    if (!user) return;
    
    const convo = conversations.find(c => c.participant.user_id === participantId);
    if (!convo || convo.unread_count === 0) return;

    // Optimistically update the UI for a faster user experience.
    setTotalUnreadCount(prev => prev - convo.unread_count);
    setConversations(prev => prev.map(c => 
      c.participant.user_id === participantId ? { ...c, unread_count: 0 } : c
    ));

    // This RPC function needs to be created in Supabase.
    // It should set `is_read = true` for the relevant messages.
    const { error } = await supabase.rpc('mark_messages_as_read', { p_sender_id: participantId });
    
    if (error) {
      console.error('Failed to mark messages as read:', error);
      // Revert the change if the DB update fails.
      fetchConversations();
    }
  }, [user, fetchConversations, conversations]);

  const value = { conversations, totalUnreadCount, loading, markConversationAsRead };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};