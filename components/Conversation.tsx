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
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
);
const GifIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 8.25v7.5m6-7.5h-3.75m3.75 0a3.75 3.75 0 00-3.75-3.75H6.75A3.75 3.75 0 003 8.25v7.5A3.75 3.75 0 006.75 19.5h9A3.75 3.75 0 0019.5 15.75v-7.5A3.75 3.75 0 0015.75 4.5z" /></svg>
);
const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
);
const SendIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
);

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  content: string | null;
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
        setNewMessage(tempMessageContent);
        setImageFile(tempImageFile);
    } finally {
        setIsUploading(false);
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

      {/* Header with gradient backdrop */}
      <div className="relative p-4 md:p-5 border-b border-tertiary-light dark:border-tertiary/50 flex items-center space-x-3 flex-shrink-0 bg-gradient-to-b from-secondary-light/50 to-transparent dark:from-secondary/50 dark:to-transparent backdrop-blur-sm">
        {onBack && (
          <button 
            onClick={onBack} 
            className="p-2 text-text-secondary-light dark:text-gray-300 rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary transition-all hover:scale-110 md:hidden"
          >
            <BackIcon className="w-6 h-6" />
          </button>
        )}
        <div className="relative">
          <img 
            src={recipient.avatar_url || `https://ui-avatars.com/api/?name=${recipient.full_name}`} 
            alt={recipient.username} 
            className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ring-brand-green/20 shadow-lg" 
          />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-secondary"></div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg md:text-xl text-text-main-light dark:text-text-main truncate">
            {recipient.full_name}
          </h3>
          <p className="text-sm text-text-tertiary-light dark:text-text-tertiary flex items-center">
            <span className="hidden md:inline">@{recipient.username}</span>
            <span className="md:hidden">Active now</span>
          </p>
        </div>
      </div>

      {/* Messages area with pattern background */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gradient-to-b from-transparent via-secondary-light/20 to-transparent dark:via-secondary/20">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, index) => {
            const isOwn = msg.sender_id === user?.id;
            const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
            
            return (
              <div key={msg.id} className={`flex items-end space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row'} animate-fade-in`}>
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8">
                  {!isOwn && showAvatar && (
                    <img 
                      src={recipient.avatar_url || `https://ui-avatars.com/api/?name=${recipient.full_name}`} 
                      alt={recipient.username} 
                      className="w-8 h-8 rounded-full object-cover" 
                    />
                  )}
                </div>
                
                {/* Message bubble */}
                <div className={`flex flex-col max-w-[75%] md:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className={`group relative rounded-2xl shadow-sm transition-all hover:shadow-md ${
                    isOwn 
                      ? 'bg-gradient-to-br from-brand-green to-brand-green-darker text-black rounded-br-sm' 
                      : 'bg-white dark:bg-tertiary text-text-main-light dark:text-text-main rounded-bl-sm border border-tertiary-light/50 dark:border-tertiary/50'
                  }`}>
                    {msg.message_type === 'text' && (
                      <p className="px-4 py-2.5 text-[15px] leading-relaxed break-words">{msg.content}</p>
                    )}
                    {msg.message_type === 'image' && msg.attachment_url && (
                      <button onClick={() => setLightboxUrl(msg.attachment_url!)} className="block p-1 hover:opacity-95 transition-opacity">
                        <img 
                          src={msg.attachment_url} 
                          alt="attachment" 
                          className="rounded-xl max-w-xs md:max-w-sm max-h-80 object-cover" 
                        />
                      </button>
                    )}
                    {msg.message_type === 'gif' && msg.attachment_url && (
                      <div className="p-1">
                        <img 
                          src={msg.attachment_url} 
                          alt="gif" 
                          className="rounded-xl max-w-xs md:max-w-sm" 
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 md:p-5 border-t border-tertiary-light dark:border-tertiary/50 bg-secondary-light/50 dark:bg-secondary/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          {imagePreview && (
            <div className="mb-3 animate-fade-in">
              <div className="relative inline-block w-28 h-28 rounded-xl overflow-hidden shadow-lg">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={resetInput} 
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-all hover:scale-110"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2 md:space-x-3">
            {/* Attachment menu */}
            <div className="group relative">
              <button 
                type="button" 
                className="p-2.5 md:p-3 text-text-tertiary-light dark:text-text-tertiary rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary transition-all hover:scale-110 hover:rotate-45"
              >
                <PlusIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <div className="absolute bottom-full mb-2 left-0 min-w-[140px] bg-white dark:bg-secondary border border-tertiary-light dark:border-tertiary rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 group-hover:translate-y-[-4px]">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="flex items-center w-full text-left space-x-3 px-4 py-3 hover:bg-tertiary-light dark:hover:bg-tertiary rounded-t-xl transition-colors"
                >
                  <ImageIcon className="w-5 h-5 text-brand-green"/>
                  <span className="font-medium">Image</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setGifPickerOpen(true)} 
                  className="flex items-center w-full text-left space-x-3 px-4 py-3 hover:bg-tertiary-light dark:hover:bg-tertiary rounded-b-xl transition-colors"
                >
                  <GifIcon className="w-5 h-5 text-brand-green"/>
                  <span className="font-medium">GIF</span>
                </button>
              </div>
            </div>
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" hidden />
            
            {/* Text input */}
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Type a message..." 
                className="w-full py-3 px-4 md:px-5 bg-white dark:bg-tertiary border border-tertiary-light dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary transition-all shadow-sm" 
                disabled={!!imagePreview}
              />
            </div>
            
            {/* Send button */}
            <button 
              type="submit" 
              disabled={isUploading || (!newMessage.trim() && !imageFile)} 
              className="p-3 md:p-3.5 bg-gradient-to-br from-brand-green to-brand-green-darker text-black font-bold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              {isUploading ? (
                <Spinner />
              ) : (
                <SendIcon className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Conversation;