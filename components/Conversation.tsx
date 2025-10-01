// src/components/Conversation.tsx

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { encryptMessage, decryptMessage, getRecipientPublicKey } from '../services/encryption';
import Spinner from './Spinner';

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  encrypted_content: string;
  created_at: string;
  decrypted_content?: string;
}

interface ConversationProps {
  recipient: Profile;
}

const Conversation: React.FC<ConversationProps> = ({ recipient }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages when recipient changes
  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, [recipient.user_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      setCurrentUserId(user.id);

      // Fetch all messages between current user and recipient
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipient.user_id}),and(sender_id.eq.${recipient.user_id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Decrypt all messages
      const decryptedMessages = await Promise.all(
        (data || []).map(async (msg) => {
          try {
            // Get the sender's public key
            const senderPublicKey = await getRecipientPublicKey(msg.sender_id);
            const decrypted = await decryptMessage(msg.encrypted_content, senderPublicKey);
            return { ...msg, decrypted_content: decrypted };
          } catch (err) {
            console.error('Failed to decrypt message:', err);
            return { ...msg, decrypted_content: '[Decryption failed]' };
          }
        })
      );

      setMessages(decryptedMessages);
    } catch (error: any) {
      console.error('Error loading messages:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          // Only add if it's part of this conversation
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === recipient.user_id) ||
            (newMsg.sender_id === recipient.user_id && newMsg.receiver_id === user.id)
          ) {
            try {
              const senderPublicKey = await getRecipientPublicKey(newMsg.sender_id);
              const decrypted = await decryptMessage(newMsg.encrypted_content, senderPublicKey);
              setMessages((prev) => [...prev, { ...newMsg, decrypted_content: decrypted }]);
            } catch (err) {
              console.error('Failed to decrypt real-time message:', err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get recipient's public key and encrypt the message
      const recipientPublicKey = await getRecipientPublicKey(recipient.user_id);
      const encrypted = await encryptMessage(newMessage, recipientPublicKey);

      // Insert into database
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: recipient.user_id,
        encrypted_content: encrypted,
      });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      console.error('Failed to send message:', error.message);
      alert('Failed to send message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-dark-tertiary p-4 flex items-center space-x-3">
        <img
          src={recipient.avatar_url || `https://ui-avatars.com/api/?name=${recipient.full_name}`}
          alt={recipient.username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-white">{recipient.full_name}</p>
          <p className="text-sm text-gray-400">@{recipient.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwnMessage
                      ? 'bg-primary text-white'
                      : 'bg-dark-tertiary text-white'
                  }`}
                >
                  <p className="break-words">{msg.decrypted_content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-dark-tertiary p-4 flex space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-dark-secondary border border-dark-tertiary rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default Conversation;