// src/components/Conversation.tsx

import React, { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`(sender_id.eq.${user.id},receiver_id.eq.${recipient.user_id}),(sender_id.eq.${recipient.user_id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        // Decrypt messages
        const recipientPublicKey = await getRecipientPublicKey(recipient.user_id);
        const decryptedMessages = await Promise.all(
            data.map(async (msg) => {
                const isMyMessage = msg.sender_id === user.id;
                try {
                    const decrypted_content = await decryptMessage(msg.encrypted_content, isMyMessage ? recipientPublicKey : recipientPublicKey);
                    return { ...msg, decrypted_content };
                } catch (e) {
                    console.error("Decryption failed for message:", msg.id, e);
                    return { ...msg, decrypted_content: "[Decryption Failed]" };
                }
            })
        );

        setMessages(decryptedMessages);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [recipient.user_id, user]);
  
  // Realtime subscription for new messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`chat:${user.id}:${recipient.user_id}`)
      .on<Message>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const newMessage = payload.new;
        if ((newMessage.sender_id === recipient.user_id && newMessage.receiver_id === user.id) || 
            (newMessage.sender_id === user.id && newMessage.receiver_id === recipient.user_id)) {
            
            const recipientPublicKey = await getRecipientPublicKey(recipient.user_id);
            const decrypted_content = await decryptMessage(newMessage.encrypted_content, recipientPublicKey);
            
            setMessages((prev) => [...prev, { ...newMessage, decrypted_content }]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recipient.user_id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
        const recipientPublicKey = await getRecipientPublicKey(recipient.user_id);
        const encryptedContent = await encryptMessage(newMessage, recipientPublicKey);
        
        const { error } = await supabase.from('messages').insert({
            sender_id: user.id,
            receiver_id: recipient.user_id,
            encrypted_content: encryptedContent,
        });

        if (error) throw error;
        setNewMessage('');
    } catch (err: any) {
        setError(`Failed to send message: ${err.message}`);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner /></div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-400">{error}</div>;

  return (
    <>
      <div className="p-4 border-b border-dark-tertiary">
        <h3 className="font-bold text-lg">{recipient.full_name}</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`p-3 rounded-lg max-w-md ${msg.sender_id === user?.id ? 'bg-brand-green text-black' : 'bg-dark-tertiary text-white'}`}>
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
          <button type="submit" className="bg-brand-green text-black font-bold py-2 px-4 rounded-lg">
            Send
          </button>
        </form>
      </div>
    </>
  );
};

export default Conversation;