// src/components/Conversation.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';
import Spinner from './Spinner';
import { ImageIcon, XCircleIcon } from './icons';
import GifPickerModal from './GifPickerModal';
import LightBox from './lightbox';

const BackIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
);
const GifIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 8.25v7.5m6-7.5h-3.75m3.75 0a3.75 3.75 0 00-3.75-3.75H6.75A3.75 3.75 0 003 8.25v7.5A3.75 3.75 0 006.75 19.5h9A3.75 3.75 0 0019.5 15.75v-7.5A3.75 3.75 0 0015.75 4.5z" /></svg>
);
const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
);


// --- CHANGED: Updated Message type ---
interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string | null; // Can be null if it's an image/gif
  created_at: string;
  message_type: 'text' | 'image' | 'gif';
  attachment_url: string | null;
}

interface ConversationProps {
  recipient: Profile;
  onBack?: () => void;
}

const Conversation: React.FC<ConversationProps> = ({ recipient, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGifPickerOpen, setGifPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchConversation = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipient.user_id}),and(sender_id.eq.${recipient.user_id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });
        if (error) throw error;
        setMessages(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally { setLoading(false); }
    };
    fetchConversation();
  }, [recipient.user_id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetInput = () => {
    setNewMessage('');
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          resetInput();
          const file = e.target.files[0];
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
      }
  };
  
  const handleGifSelect = (gifUrl: string) => {
      setGifPickerOpen(false);
      handleSendMessage(null, { type: 'gif', url: gifUrl });
  };

  const handleSendMessage = async (e?: React.FormEvent, media?: { type: 'gif'; url: string }) => {
    e?.preventDefault();
    if (!user || (!newMessage.trim() && !imageFile && !media)) return;
    
    setIsUploading(true);
    
    const tempMessageContent = newMessage;
    const tempImageFile = imageFile;
    
    // Optimistically clear the input fields
    resetInput();

    try {
        let messageData: Partial<Message> = {
            sender_id: user.id,
            receiver_id: recipient.user_id,
        };

        if (media?.type === 'gif') {
            messageData = { ...messageData, message_type: 'gif', attachment_url: media.url, content: '[GIF]' };
        } else if (tempImageFile) {
            const fileExt = tempImageFile.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, tempImageFile);
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
            messageData = { ...messageData, message_type: 'image', attachment_url: publicUrl, content: '[Image]' };
        } else {
            messageData = { ...messageData, message_type: 'text', content: tempMessageContent.trim() };
        }

        const { data: sentMessage, error } = await supabase.from('messages').insert(messageData).select().single();
        if (error) throw error;

        setMessages(prev => [...prev, sentMessage as Message]);

    } catch (err: any) {
        setError(`Failed to send message: ${err.message}`);
        // Restore message on failure
        setNewMessage(tempMessageContent);
        setImageFile(tempImageFile);
    } finally {
        setIsUploading(false);
    }
  };
  
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`chat-room:${[user.id, recipient.user_id].sort().join(':')}`)
      .on<Message>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          if (payload.new.sender_id === recipient.user_id && payload.new.receiver_id === user.id) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [recipient.user_id, user]);
  
  if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner /></div>;
  if (error) return <div className="flex-1 flex items-center justify-center text-red-400 p-4 text-center">{error}</div>;

  return (
    <>
      {isGifPickerOpen && <GifPickerModal onClose={() => setGifPickerOpen(false)} onGifSelect={handleGifSelect} />}
      {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

      <div className="p-2 md:p-4 border-b border-tertiary-light dark:border-tertiary flex items-center space-x-2 flex-shrink-0">
        {onBack && <button onClick={onBack} className="p-2 text-text-secondary-light dark:text-gray-300 rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary md:hidden"><BackIcon className="w-6 h-6" /></button>}
        <img src={recipient.avatar_url || `https://ui-avatars.com/api/?name=${recipient.full_name}`} alt={recipient.username} className="w-10 h-10 rounded-full object-cover" />
        <div>
          <h3 className="font-bold text-lg text-text-main-light dark:text-text-main">{recipient.full_name}</h3>
          <p className="text-sm text-text-tertiary-light dark:text-text-tertiary hidden md:block">@{recipient.username}</p>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`p-1 rounded-lg max-w-md break-words ${msg.sender_id === user?.id ? 'bg-brand-green text-black' : 'bg-tertiary-light dark:bg-tertiary text-text-main-light dark:text-text-main'}`}>
              {msg.message_type === 'text' && <p className="p-2">{msg.content}</p>}
              {msg.message_type === 'image' && msg.attachment_url && (
                <button onClick={() => setLightboxUrl(msg.attachment_url!)} className="block">
                  <img src={msg.attachment_url} alt="attachment" className="rounded-md max-w-xs max-h-80 object-cover" />
                </button>
              )}
              {msg.message_type === 'gif' && msg.attachment_url && <img src={msg.attachment_url} alt="gif" className="rounded-md max-w-xs" />}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-tertiary-light dark:border-tertiary">
        {imagePreview && (
            <div className="relative w-24 h-24 mb-2">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                <button onClick={resetInput} className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full"><XCircleIcon className="w-6 h-6" /></button>
            </div>
        )}
        <form onSubmit={handleSendMessage} className="flex space-x-2 items-center">
          <div className="group relative">
              <button type="button" className="p-2 text-text-tertiary-light dark:text-text-tertiary rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary">
                  <PlusIcon />
              </button>
              <div className="absolute bottom-full mb-2 left-0 w-max bg-secondary-light dark:bg-secondary border border-tertiary-light dark:border-tertiary rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center w-full text-left space-x-2 p-2 hover:bg-tertiary-light dark:hover:bg-tertiary"><ImageIcon className="w-5 h-5"/><span>Image</span></button>
                  <button type="button" onClick={() => setGifPickerOpen(true)} className="flex items-center w-full text-left space-x-2 p-2 hover:bg-tertiary-light dark:hover:bg-tertiary"><GifIcon className="w-5 h-5"/><span>GIF</span></button>
              </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" hidden />
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 min-w-0 p-2 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-text-main-light dark:text-text-main" disabled={!!imagePreview} />
          <button type="submit" disabled={isUploading} className="bg-brand-green text-black font-bold py-2 px-4 rounded-lg hover:bg-brand-green-darker transition-colors disabled:opacity-50">
            {isUploading ? <Spinner/> : 'Send'}
          </button>
        </form>
      </div>
    </>
  );
};

export default Conversation;