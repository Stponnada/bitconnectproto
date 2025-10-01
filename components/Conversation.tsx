// src/components/Conversation.tsx (FIXED)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Profile } from '../types';
import Spinner from './Spinner';
import { encryptMessage, decryptMessage, getRecipientPublicKey, getKeyPair } from '../services/encryption';
import { X25519PublicKey } from 'sodium-plus';

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  encrypted_content: string; // Can be a string or a JSON string '{"for_recipient": "...", "for_sender": "..."}'
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
  
  // Refs to store keys to avoid re-fetching them repeatedly
  const recipientPublicKeyRef = useRef<X25519PublicKey | null>(null);
  const myPublicKeyRef = useRef<X25519PublicKey | null>(null);

  const decryptContent = useCallback(async (
    originalMessage: Message,
    contentToDecrypt: string,
    senderPublicKey: X25519PublicKey
  ): Promise<Message> => {
    try {
      const decrypted_content = await decryptMessage(contentToDecrypt, senderPublicKey);
      return { ...originalMessage, decrypted_content };
    } catch (e) {
      console.error("Decryption failed for message:", originalMessage.id, e);
      return { ...originalMessage, decrypted_content: "[Decryption Failed]" };
    }
  }, []);
  
  const processMessage = useCallback(async (msg: Message): Promise<Message> => {
    if (!user || !myPublicKeyRef.current || !recipientPublicKeyRef.current) {
        return { ...msg, decrypted_content: "[Key Error]" };
    }

    try {
      const payload = JSON.parse(msg.encrypted_content);
      // New format: Decrypt the appropriate version
      if (msg.sender_id === user.id) {
        return decryptContent(msg, payload.for_sender, myPublicKeyRef.current);
      } else {
        return decryptContent(msg, payload.for_recipient, recipientPublicKeyRef.current);
      }
    } catch (e) {
      // Legacy format: Handle old messages
      if (msg.sender_id === user.id) {
        return { ...msg, decrypted_content: "[Unable to decrypt own message]" };
      } else {
        return decryptContent(msg, msg.encrypted_content, recipientPublicKeyRef.current);
      }
    }
  }, [user, decryptContent]);

  useEffect(() => {
    if (!user) return;

    const fetchConversation = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch and store both keys needed for the conversation
        recipientPublicKeyRef.current = await getRecipientPublicKey(recipient.user_id);
        myPublicKeyRef.current = (await getKeyPair()).publicKey;

        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipient.user_id}),and(sender_id.eq.${recipient.user_id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        const decryptedMsgs = await Promise.all(data.map(processMessage));
        setMessages(decryptedMsgs);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [recipient.user_id, user, processMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !recipientPublicKeyRef.current || !myPublicKeyRef.current) return;

    const tempMessageContent = newMessage;
    setNewMessage('');

    try {
      // Encrypt for both parties
      const encryptedForRecipient = await encryptMessage(tempMessageContent, recipientPublicKeyRef.current);
      const encryptedForSender = await encryptMessage(tempMessageContent, myPublicKeyRef.current);

      const payload = {
        for_recipient: encryptedForRecipient,
        for_sender: encryptedForSender
      };

      const { data: sentMessage, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: recipient.user_id,
          encrypted_content: JSON.stringify(payload), // Store the JSON object as a string
        })
        .select()
        .single();

      if (error) throw error;
      
      // Optimistic UI update: show the message immediately
      setMessages(prev => [...prev, { ...sentMessage, decrypted_content: tempMessageContent }]);
    } catch (err: any) {
      setError(`Failed to send message: ${err.message}`);
      setNewMessage(tempMessageContent);
    }
  };
  
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`chat-room:${[user.id, recipient.user_id].sort().join(':')}`)
      .on<Message>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const newMessage = payload.new;
        if (newMessage.sender_id === recipient.user_id && newMessage.receiver_id === user.id) {
          const processed = await processMessage(newMessage);
          setMessages((prev) => [...prev, processed]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [recipient.user_id, user, processMessage]);

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