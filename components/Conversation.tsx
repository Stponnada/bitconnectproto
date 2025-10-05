// src/components/Conversation.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';
import Spinner from './Spinner';
import { encryptMessage, decryptMessage } from '../services/encryption';

const BackIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
);

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  encrypted_content: any;
  created_at: string;
  decrypted_content?: string;
}

interface ConversationProps {
  recipient: Profile;
  onBack?: () => void;
}

const Conversation: React.FC<ConversationProps> = ({ recipient, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const processMessage = useCallback(async (msg: Message): Promise<Message> => {
    try {
      if (msg.decrypted_content) return msg;
      const decrypted_content = await decryptMessage(JSON.stringify(msg.encrypted_content));
      return { ...msg, decrypted_content };
    } catch (e: any) {
      console.error(`Decryption failed for msg ${msg.id}:`, e.message);
      return { ...msg, decrypted_content: "[Decryption Failed]" };
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchConversation = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipient.user_id}),and(sender_id.eq.${recipient.user_id},receiver_id.eq.${user.id})`).order('created_at', { ascending: true });
        if (error) throw error;
        const decryptedMsgs = await Promise.all(data.map(processMessage));
        setMessages(decryptedMsgs);
      } catch (err: any) {
        setError(err.message);
      } finally { setLoading(false); }
    };
    fetchConversation();
  }, [recipient.user_id, user, processMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    const tempMessageContent = newMessage;
    setNewMessage('');
    try {
      const encryptedPayload = await encryptMessage(tempMessageContent, recipient.user_id);
      const { data: sentMessage, error } = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: recipient.user_id, encrypted_content: encryptedPayload }).select().single();
      if (error) throw error;
      setMessages(prev => [...prev, { ...sentMessage, decrypted_content: tempMessageContent }]);
    } catch (err: any) {
      setError(`Failed to send message: ${err.message}`);
      setNewMessage(tempMessageContent);
    }
  };
  
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`chat-room:${[user.id, recipient.user_id].sort().join(':')}`).on<Message>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        if (payload.new.sender_id === recipient.user_id && payload.new.receiver_id === user.id) {
          const processed = await processMessage(payload.new);
          setMessages((prev) => [...prev, processed]);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [recipient.user_id, user, processMessage]);

  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner /></div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-400 p-4 text-center">{error}</div>;

  return (
    <>
      <div className="p-2 md:p-4 border-b border-tertiary-light dark:border-tertiary flex items-center space-x-2 flex-shrink-0">
        {onBack && <button onClick={onBack} className="p-2 text-text-secondary-light dark:text-gray-300 rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary md:hidden"><BackIcon className="w-6 h-6" /></button>}
        <img src={recipient.avatar_url || `https://ui-avatars.com/api/?name=${recipient.full_name}`} alt={recipient.username} className="w-10 h-10 rounded-full object-cover" />
        <div>
          {/* --- THIS LINE IS CORRECTED --- */}
          <h3 className="font-bold text-lg text-text-main-light dark:text-text-main">{recipient.full_name}</h3>
          <p className="text-sm text-text-tertiary-light dark:text-text-tertiary hidden md:block">@{recipient.username}</p>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`p-3 rounded-lg max-w-md break-words ${msg.sender_id === user?.id ? 'bg-brand-green text-black' : 'bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main'}`}>
              <p>{msg.decrypted_content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-tertiary-light dark:border-tertiary">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 p-2 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-text-main-light dark:text-text-main" />
          <button type="submit" className="bg-brand-green text-black font-bold py-2 px-4 rounded-lg hover:bg-brand-green-darker transition-colors">Send</button>
        </form>
      </div>
    </>
  );
};

export default Conversation;