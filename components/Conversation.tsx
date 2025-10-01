// src/components/Conversation.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';
import Spinner from './Spinner';
import { encryptMessage, decryptMessage, getRecipientPublicKey } from '../services/encryption';

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  encrypted_content: string;
  created_at: string;
  decrypted_content?: string;
}

const Conversation: React.FC<{ recipient: Profile }> = ({ recipient }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recipientPublicKeyRef = useRef<any>(null);

  const decryptSingleMessage = useCallback(async (msg: Message, senderPublicKey: any): Promise<Message> => {
    try {
      const decrypted_content = await decryptMessage(msg.encrypted_content, senderPublicKey);
      return { ...msg, decrypted_content };
    } catch (e) {
      console.error("Decryption failed for message:", msg.id, e);
      return { ...msg, decrypted_content: "[Decryption Failed]" };
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchConversation = async () => {
      setLoading(true);
      setError(null);
      setMessages([]);
      try {
        // Get recipient's public key for decrypting their messages
        recipientPublicKeyRef.current = await getRecipientPublicKey(recipient.user_id);

        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipient.user_id}),and(sender_id.eq.${recipient.user_id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        const decryptedMsgs = await Promise.all(
          data.map(async (msg) => {
            // Only decrypt messages sent BY THE RECIPIENT
            if (msg.sender_id === recipient.user_id) {
              return decryptSingleMessage(msg, recipientPublicKeyRef.current);
            } else {
              // Our own messages can't be decrypted after sending
              // They were encrypted for the recipient, not for us
              return { ...msg, decrypted_content: "[Unable to decrypt own message]" };
            }
          })
        );
        setMessages(decryptedMsgs);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [recipient.user_id, user, decryptSingleMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !recipientPublicKeyRef.current) return;

    const tempMessageContent = newMessage;
    setNewMessage('');

    try {
      const encryptedContent = await encryptMessage(tempMessageContent, recipientPublicKeyRef.current);
      const { data: sentMessage, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: recipient.user_id,
          encrypted_content: encryptedContent,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add our own message with known plaintext (don't wait for real-time)
      setMessages(prev => [...prev, { ...sentMessage, decrypted_content: tempMessageContent }]);
    } catch (err: any) {
      setError(`Failed to send message: ${err.message}`);
      setNewMessage(tempMessageContent);
    }
  };
  
  useEffect(() => {
    if (!user || !recipientPublicKeyRef.current) return;
    const channel = supabase
      .channel(`chat-room:${[user.id, recipient.user_id].sort().join(':')}`)
      .on<Message>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const newMessage = payload.new;
        // Only process messages SENT BY THE RECIPIENT (incoming messages)
        if (newMessage.sender_id === recipient.user_id && newMessage.receiver_id === user.id) {
          const decryptedMessage = await decryptSingleMessage(newMessage, recipientPublicKeyRef.current);
          setMessages((prev) => [...prev, decryptedMessage]);
        }
        // Ignore our own sent messages - they're added immediately in handleSendMessage
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [recipient.user_id, user, decryptSingleMessage]);

  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner /></div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-400 p-4 text-center">{error}</div>;

  return (
    <>
      <div className="p-4 border-b border-dark-tertiary">
        <h3 className="font-bold text-lg">{recipient.full_name}</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`p-3 rounded-lg max-w-md break-words ${msg.sender_id === user?.id ? 'bg-brand-green text-black' : 'bg-dark-tertiary text-white'}`}>
              <p>{msg.decrypted_content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-dark-tertiary">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 bg-dark-tertiary border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
          <button type="submit" className="bg-brand-green text-black font-bold py-2 px-4 rounded-lg hover:bg-brand-green-darker transition-colors">
            Send
          </button>
        </form>
      </div>
    </>
  );
};

export default Conversation;