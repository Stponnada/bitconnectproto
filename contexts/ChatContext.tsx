// src/contexts/ChatContext.tsx

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { ConversationSummary } from '../types';
// --- REMOVED: Notification import ---
// import { showNotification } from '../utils/notifications';

interface ChatContextType {
  conversations: ConversationSummary[];
  totalUnreadCount: number;
  loading: boolean;
  markConversationAsRead: (participantId: string) => Promise<void>;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

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

    // --- MODIFIED: Simplified handler, notification logic removed ---
    const handleNewMessage = async (payload: any) => {
        fetchConversations(); 
    };

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      }, handleNewMessage)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);
  
  const markConversationAsRead = useCallback(async (participantId: string) => {
    if (!user) return;
    const convo = conversations.find(c => c.participant.user_id === participantId);
    if (!convo || convo.unread_count === 0) return;
    setTotalUnreadCount(prev => prev - convo.unread_count);
    setConversations(prev => prev.map(c => 
      c.participant.user_id === participantId ? { ...c, unread_count: 0 } : c
    ));
    const { error } = await supabase.rpc('mark_messages_as_read', { p_sender_id: participantId });
    if (error) {
      console.error('Failed to mark messages as read:', error);
      fetchConversations();
    }
  }, [user, fetchConversations, conversations]);

  const value = { conversations, totalUnreadCount, loading, markConversationAsRead };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};