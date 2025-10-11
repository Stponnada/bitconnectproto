// src/contexts/ChatContext.tsx

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { ConversationSummary, Profile } from '../types';

interface ChatContextType {
  conversations: ConversationSummary[];
  totalUnreadCount: number;
  loading: boolean;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  updateConversationId: (placeholderId: string, newId: string) => void;
  fetchConversations: () => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // Step 1: Fetch existing conversations
      const { data: existingConversations, error: convosError } = await supabase.rpc('get_conversations_for_user_v2');
      if (convosError) throw convosError;
      
      const conversationsData = (existingConversations as ConversationSummary[]) || [];

      // Step 2: Fetch followers and following to act as a "contacts list"
      const { data: profiles, error: profilesError } = await supabase.rpc('get_directory_profiles');
      if (profilesError) throw profilesError;

      const contacts = (profiles as Profile[]).filter(p => p.is_following || p.is_followed_by);

      // Step 3: Create placeholder conversations for contacts who don't have an existing chat
      const existingParticipantIds = new Set(conversationsData.flatMap(c => c.type === 'dm' ? c.participants.map(p => p.user_id) : []));
      
      const placeholderConversations: ConversationSummary[] = contacts.reduce((acc: ConversationSummary[], contact) => {
        // If a chat with this contact doesn't already exist, create a placeholder
        if (!existingParticipantIds.has(contact.user_id)) {
          acc.push({
            conversation_id: `placeholder_${contact.user_id}`, // Unique temporary ID
            type: 'dm',
            name: contact.full_name,
            participants: [contact],
            last_message_content: "Start a conversation!",
            last_message_at: null,
            last_message_sender_id: null,
            unread_count: 0,
          });
        }
        return acc;
      }, []);
      
      // Step 4: Combine the lists and set the state
      const unifiedList = [...conversationsData, ...placeholderConversations];
      setConversations(unifiedList);

    } catch (error) {
      console.error('Error fetching unified chat list:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  // Real-time listener for new messages (no changes needed here from last fix)
  useEffect(() => {
    if (!user) return;
    const handleNewMessage = (payload: any) => {
        setConversations(prevConvos => {
            const newMessage = payload.new;
            const convoIndex = prevConvos.findIndex(c => c.conversation_id === newMessage.conversation_id);
            if (convoIndex === -1) {
                fetchConversations();
                return prevConvos;
            }
            const targetConvo = prevConvos[convoIndex];
            const updatedConvo = {
                ...targetConvo,
                last_message_content: newMessage.content || '[Attachment]',
                last_message_at: newMessage.created_at,
                last_message_sender_id: newMessage.sender_id,
                unread_count: newMessage.sender_id !== user.id 
                    ? (targetConvo.unread_count || 0) + 1 
                    : targetConvo.unread_count,
            };
            const newConvos = [
                updatedConvo,
                ...prevConvos.slice(0, convoIndex),
                ...prevConvos.slice(convoIndex + 1)
            ];
            return newConvos;
        });
    };
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handleNewMessage)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);
  
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!user || conversationId.startsWith('placeholder_')) return;
    
    const convo = conversations.find(c => c.conversation_id === conversationId);
    if (!convo || convo.unread_count === 0) return;
    
    setConversations(prev => prev.map(c => 
      c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c
    ));
    
    const { error } = await supabase.rpc('mark_messages_as_read_for_convo', { p_conversation_id: conversationId });

    if (error) {
      console.error('Failed to mark messages as read:', error);
      fetchConversations();
    }
  }, [user, fetchConversations, conversations]);

  const totalUnreadCount = conversations.reduce((sum, conv) => sum + (conv.last_message_at ? conv.unread_count : 0), 0);

  const updateConversationId = (placeholderId: string, newId: string) => {
    setConversations(prev => 
      prev.map(c => c.conversation_id === placeholderId ? { ...c, conversation_id: newId } : c)
    );
  };

  const value = { conversations, totalUnreadCount, loading, markConversationAsRead, fetchConversations, updateConversationId };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};