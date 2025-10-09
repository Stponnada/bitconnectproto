import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';
import Spinner from './Spinner';
import { ImageIcon, XCircleIcon } from './icons';
import GifPickerModal from './GifPickerModal';
import LightBox from './lightbox';

// --- Helper Components & Icons (No Changes Here) ---
const BackIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>);
const GifIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 8.25v7.5m6-7.5h-3.75m3.75 0a3.75 3.75 0 00-3.75-3.75H6.75A3.75 3.75 0 003 8.25v7.5A3.75 3.75 0 006.75 19.5h9A3.75 3.75 0 0019.5 15.75v-7.5A3.75 3.75 0 0015.75 4.5z" /></svg>);
const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const SendIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>);
const ReplyIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.128a.75.75 0 010 1.5H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" /></svg>);
const EmojiIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9.25a.75.75 0 000 1.5h6a.75.75 0 000-1.5H7zM5.5 5.5a2 2 0 114 0 2 2 0 01-4 0zM10.5 5.5a2 2 0 114 0 2 2 0 01-4 0z" /></svg>);

// --- Types ---
interface Reaction { id: number; message_id: number; user_id: string; emoji: string; }
interface Message { id: number; sender_id: string; receiver_id: string; content: string | null; created_at: string; message_type: 'text' | 'image' | 'gif'; attachment_url: string | null; reply_to_message_id: number | null; reactions: Reaction[]; }
interface ConversationProps { recipient: Profile; onBack?: () => void; }
const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// --- Main Component ---
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
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [openReactionMenuId, setOpenReactionMenuId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const reactionMenuRef = useRef<HTMLDivElement>(null);

    // --- Effects (No Changes Here) ---
    useEffect(() => {
        if (!user) return;
        const fetchConversation = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data: messagesData, error: messagesError } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipient.user_id}),and(sender_id.eq.${recipient.user_id},receiver_id.eq.${user.id})`).order('created_at', { ascending: true });
                if (messagesError) throw messagesError;
                const messageIds = messagesData.map(m => m.id);
                if (messageIds.length === 0) { setMessages([]); setLoading(false); return; }
                const { data: reactionsData, error: reactionsError } = await supabase.from('message_reactions').select('*').in('message_id', messageIds);
                if (reactionsError) throw reactionsError;
                const messagesWithReactions = messagesData.map(message => ({ ...message, reactions: reactionsData.filter(r => r.message_id === message.id) }));
                setMessages(messagesWithReactions || []);
            } catch (err: any) { setError(err.message); } finally { setLoading(false); }
        };
        fetchConversation();
    }, [recipient.user_id, user]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    useEffect(() => {
        if (!user) return;
        const messageChannel = supabase.channel(`chat-room:${[user.id, recipient.user_id].sort().join(':')}`).on<Message>('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => { if (payload.new.sender_id === recipient.user_id && payload.new.receiver_id === user.id) { setMessages((prev) => [...prev, { ...payload.new, reactions: [] }]); } }).subscribe();
        const reactionChannel = supabase.channel(`reactions:${[user.id, recipient.user_id].sort().join(':')}`).on<Reaction>('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, (payload) => { setMessages(currentMessages => { const messageId = payload.eventType === 'DELETE' ? payload.old.message_id : payload.new.message_id; if (!currentMessages.find(m => m.id === messageId)) return currentMessages; return currentMessages.map(msg => { if (msg.id === messageId) { let newReactions = [...msg.reactions]; if (payload.eventType === 'INSERT') { newReactions.push(payload.new); } else if (payload.eventType === 'UPDATE') { newReactions = newReactions.map(r => r.id === payload.new.id ? payload.new : r); } else if (payload.eventType === 'DELETE') { newReactions = newReactions.filter(r => r.id !== payload.old.id); } return { ...msg, reactions: newReactions }; } return msg; }); }); }).subscribe();
        const handleClickOutside = (event: MouseEvent) => { if (reactionMenuRef.current && !reactionMenuRef.current.contains(event.target as Node)) { setOpenReactionMenuId(null); } };
        document.addEventListener('mousedown', handleClickOutside);
        return () => { supabase.removeChannel(messageChannel); supabase.removeChannel(reactionChannel); document.removeEventListener('mousedown', handleClickOutside); };
    }, [recipient.user_id, user]);

    // --- Handlers & Helpers ---
    const resetInput = () => { setNewMessage(''); setImageFile(null); if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(null); setReplyingTo(null); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { resetInput(); const file = e.target.files[0]; setImageFile(file); setImagePreview(URL.createObjectURL(file)); } };
    const handleGifSelect = (gifUrl: string) => { setGifPickerOpen(false); handleSendMessage(null, { type: 'gif', url: gifUrl }); };
    
    const handleSendMessage = async (e?: React.FormEvent, media?: { type: 'gif'; url: string }) => {
        e?.preventDefault();
        if (!user || (!newMessage.trim() && !imageFile && !media)) return;
        setIsUploading(true);
        const tempMessageContent = newMessage;
        const tempImageFile = imageFile;
        const tempReplyingTo = replyingTo;
        resetInput();
        try {
            let messageData: Partial<Message> = { sender_id: user.id, receiver_id: recipient.user_id, reply_to_message_id: tempReplyingTo ? tempReplyingTo.id : null, };
            if (media?.type === 'gif') { messageData = { ...messageData, message_type: 'gif', attachment_url: media.url, content: '[GIF]' }; } 
            else if (tempImageFile) { const fileExt = tempImageFile.name.split('.').pop(); const filePath = `${user.id}/${Date.now()}.${fileExt}`; const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, tempImageFile); if (uploadError) throw uploadError; const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(filePath); messageData = { ...messageData, message_type: 'image', attachment_url: publicUrl, content: '[Image]' }; } 
            else { messageData = { ...messageData, message_type: 'text', content: tempMessageContent.trim() }; }
            const { data: sentMessage, error } = await supabase.from('messages').insert(messageData).select().single();
            if (error) throw error;
            setMessages(prev => [...prev, { ...(sentMessage as Message), reactions: [] }]);
        } catch (err: any) { setError(`Failed to send message: ${err.message}`); setNewMessage(tempMessageContent); setImageFile(tempImageFile); setReplyingTo(tempReplyingTo); } 
        finally { setIsUploading(false); }
    };
    
    // --- *** THE FIX IS HERE: OPTIMISTIC UPDATES *** ---
    const handleReaction = async (message: Message, emoji: string) => {
        if (!user) return;
        setOpenReactionMenuId(null);

        const existingReaction = message.reactions.find(r => r.user_id === user.id);
        const originalReactions = [...message.reactions];
        let newReactions: Reaction[];
        let dbOperation: Promise<any>;

        // 1. Determine the optimistic state and the DB operation
        if (existingReaction) {
            if (existingReaction.emoji === emoji) { // Remove reaction
                newReactions = message.reactions.filter(r => r.user_id !== user.id);
                dbOperation = supabase.from('message_reactions').delete().match({ id: existingReaction.id });
            } else { // Change reaction
                newReactions = message.reactions.map(r => r.user_id === user.id ? { ...r, emoji } : r);
                dbOperation = supabase.from('message_reactions').update({ emoji }).match({ id: existingReaction.id });
            }
        } else { // Add new reaction
            const tempReaction: Reaction = { id: Date.now(), message_id: message.id, user_id: user.id, emoji }; // temp ID for UI
            newReactions = [...message.reactions, tempReaction];
            dbOperation = supabase.from('message_reactions').insert({ message_id: message.id, user_id: user.id, emoji });
        }

        // 2. Optimistically update the UI immediately
        setMessages(currentMessages =>
            currentMessages.map(m =>
                m.id === message.id ? { ...m, reactions: newReactions } : m
            )
        );

        // 3. Perform the DB operation and rollback on error
        try {
            const { error } = await dbOperation;
            if (error) throw error;
        } catch (error) {
            console.error("Failed to update reaction:", error);
            // Rollback UI to original state on failure
            setMessages(currentMessages =>
                currentMessages.map(m =>
                    m.id === message.id ? { ...m, reactions: originalReactions } : m
                )
            );
        }
    };

    const formatTime = (timestamp: string) => { const date = new Date(timestamp); const now = new Date(); const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60); if (diffInHours < 24) { return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); } return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
    const groupReactions = (reactions: Reaction[]) => { return reactions.reduce((acc, reaction) => { acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1; return acc; }, {} as Record<string, number>); };

    if (loading) return <div className="flex-1 flex items-center justify-center"><Spinner /></div>;
    if (error) return <div className="flex-1 flex items-center justify-center text-red-400 p-4 text-center">{error}</div>;

    // --- Render (No Changes Below This Line) ---
    return (
        <>
            {isGifPickerOpen && <GifPickerModal onClose={() => setGifPickerOpen(false)} onGifSelect={handleGifSelect} />}
            {lightboxUrl && <LightBox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

            {/* Header */}
            <div className="relative p-4 md:p-5 border-b border-tertiary-light dark:border-tertiary/50 flex items-center space-x-3 flex-shrink-0 bg-gradient-to-b from-secondary-light/50 to-transparent dark:from-secondary/50 dark:to-transparent backdrop-blur-sm">
                {onBack && ( <button onClick={onBack} className="p-2 text-text-secondary-light dark:text-gray-300 rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary transition-all hover:scale-110 md:hidden"><BackIcon className="w-6 h-6" /></button> )}
                <div className="relative">
                    <img src={recipient.avatar_url || `https://ui-avatars.com/api/?name=${recipient.full_name}`} alt={recipient.username} className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ring-brand-green/20 shadow-lg" />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-secondary"></div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg md:text-xl text-text-main-light dark:text-text-main truncate">{recipient.full_name}</h3>
                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary flex items-center"><span className="hidden md:inline">@{recipient.username}</span><span className="md:hidden">Active now</span></p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gradient-to-b from-transparent via-secondary-light/20 to-transparent dark:via-secondary/20">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.map((msg, index) => {
                        const isOwn = msg.sender_id === user?.id;
                        const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
                        const originalMessage = msg.reply_to_message_id ? messages.find(m => m.id === msg.reply_to_message_id) : null;
                        const originalSenderName = originalMessage ? (originalMessage.sender_id === user?.id ? 'You' : recipient.full_name) : '';
                        const groupedReactions = groupReactions(msg.reactions);
                        
                        return (
                            <div key={msg.id} id={`message-${msg.id}`} className={`group relative flex items-end space-x-2 ${isOwn ? 'flex-row-reverse space-x-reverse' : 'flex-row'} animate-fade-in`}>
                                <div className="flex-shrink-0 w-8 h-8">{!isOwn && showAvatar && ( <img src={recipient.avatar_url || `https://ui-avatars.com/api/?name=${recipient.full_name}`} alt={recipient.username} className="w-8 h-8 rounded-full object-cover" /> )}</div>
                                <div className={`flex flex-col max-w-[75%] md:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                                    <div className={`relative rounded-2xl shadow-sm transition-all hover:shadow-md ${isOwn ? 'bg-gradient-to-br from-brand-green to-brand-green-darker text-black rounded-br-sm' : 'bg-white dark:bg-tertiary text-text-main-light dark:text-text-main rounded-bl-sm border border-tertiary-light/50 dark:border-tertiary/50'}`}>
                                       {openReactionMenuId === msg.id && (
                                            <div ref={reactionMenuRef} className={`absolute bottom-full mb-2 flex items-center space-x-1 bg-white dark:bg-secondary shadow-xl rounded-full p-2 border border-tertiary-light/50 dark:border-tertiary/50 transition-all duration-200 ${isOwn ? 'right-0' : 'left-0'}`}>
                                                {DEFAULT_REACTIONS.map(emoji => ( <button key={emoji} onClick={() => handleReaction(msg, emoji)} className="p-1 text-2xl hover:scale-125 transition-transform">{emoji}</button> ))}
                                            </div>
                                       )}
                                        {originalMessage && (
                                            <a href={`#message-${originalMessage.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`message-${originalMessage.id}`)?.scrollIntoView({behavior:'smooth', block: 'center'}); }} className={`block m-1 p-2 rounded-lg border-l-2 hover:bg-black/20 dark:hover:bg-black/30 ${isOwn ? 'bg-white/40 text-black/90 border-green-800/50' : 'bg-black/10 dark:bg-black/20 border-brand-green'}`}>
                                                <p className={`font-bold text-sm ${isOwn ? 'text-green-800' : 'text-brand-green'}`}>{originalSenderName}</p>
                                                <p className="text-sm opacity-80 truncate">{originalMessage.content || '[Attachment]'}</p>
                                            </a>
                                        )}
                                        {msg.message_type === 'text' && <p className="px-4 py-2.5 text-[15px] leading-relaxed break-words">{msg.content}</p>}
                                        {msg.message_type === 'image' && msg.attachment_url && ( <button onClick={() => setLightboxUrl(msg.attachment_url!)} className="block p-1 hover:opacity-95 transition-opacity"><img src={msg.attachment_url} alt="attachment" className="rounded-xl max-w-xs md:max-w-sm max-h-80 object-cover" /></button> )}
                                        {msg.message_type === 'gif' && msg.attachment_url && ( <div className="p-1"><img src={msg.attachment_url} alt="gif" className="rounded-xl max-w-xs md:max-w-sm" /></div> )}
                                        {Object.keys(groupedReactions).length > 0 && (
                                            <div className={`absolute -bottom-4 flex gap-1 ${isOwn ? 'right-1' : 'left-1'}`}>
                                                {Object.entries(groupedReactions).map(([emoji, count]) => ( <div key={emoji} className="bg-white dark:bg-secondary text-sm rounded-full shadow-md px-2 py-1 border border-tertiary-light/50 dark:border-tertiary/50">{emoji} {count > 1 && <span className="font-semibold text-xs">{count}</span>}</div> ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">{formatTime(msg.created_at)}</span>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                    <button onClick={(e) => { e.stopPropagation(); setOpenReactionMenuId(msg.id === openReactionMenuId ? null : msg.id); }} className="p-1.5 rounded-full text-text-tertiary-light dark:text-text-tertiary hover:bg-tertiary-light dark:hover:bg-tertiary"><EmojiIcon className="w-5 h-5" /></button>
                                    <button onClick={() => setReplyingTo(msg)} className="p-1.5 rounded-full text-text-tertiary-light dark:text-text-tertiary hover:bg-tertiary-light dark:hover:bg-tertiary"><ReplyIcon className="w-5 h-5" /></button>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-5 border-t border-tertiary-light dark:border-tertiary/50 bg-secondary-light/50 dark:bg-secondary/50 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                    {replyingTo && (
                        <div className="mb-3 p-3 bg-tertiary-light dark:bg-tertiary rounded-lg relative animate-fade-in">
                           <button onClick={() => setReplyingTo(null)} className="absolute top-1 right-1 p-1 text-text-tertiary-light dark:text-text-tertiary"><XCircleIcon className="w-4 h-4" /></button>
                           <p className="text-sm font-bold text-brand-green">Replying to {replyingTo.sender_id === user?.id ? "Yourself" : recipient.full_name}</p>
                           <p className="text-sm text-text-secondary-light dark:text-text-secondary truncate">{replyingTo.content || '[Attachment]'}</p>
                        </div>
                    )}
                    {imagePreview && (
                        <div className="mb-3 animate-fade-in">
                            <div className="relative inline-block w-28 h-28 rounded-xl overflow-hidden shadow-lg">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                <button onClick={resetInput} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-all hover:scale-110"><XCircleIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2 md:space-x-3">
                        <div className="group relative">
                            <button type="button" className="p-2.5 md:p-3 text-text-tertiary-light dark:text-text-tertiary rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary transition-all hover:scale-110 hover:rotate-45"><PlusIcon className="w-5 h-5 md:w-6 md:h-6" /></button>
                            <div className="absolute bottom-full mb-2 left-0 min-w-[140px] bg-white dark:bg-secondary border border-tertiary-light dark:border-tertiary rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 group-hover:translate-y-[-4px]">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center w-full text-left space-x-3 px-4 py-3 hover:bg-tertiary-light dark:hover:bg-tertiary rounded-t-xl transition-colors"><ImageIcon className="w-5 h-5 text-brand-green"/> <span className="font-medium">Image</span></button>
                                <button type="button" onClick={() => setGifPickerOpen(true)} className="flex items-center w-full text-left space-x-3 px-4 py-3 hover:bg-tertiary-light dark:hover:bg-tertiary rounded-b-xl transition-colors"><GifIcon className="w-5 h-5 text-brand-green"/> <span className="font-medium">GIF</span></button>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" hidden />
                        <div className="flex-1 relative"><input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full py-3 px-4 md:px-5 bg-white dark:bg-tertiary border border-tertiary-light dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary transition-all shadow-sm" disabled={!!imagePreview}/></div>
                        <button type="submit" disabled={isUploading || (!newMessage.trim() && !imageFile)} className="p-3 md:p-3.5 bg-gradient-to-br from-brand-green to-brand-green-darker text-black font-bold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95">{isUploading ? <Spinner /> : <SendIcon className="w-5 h-5 md:w-6 md:h-6" />}</button>
                    </form>
                </div>
            </div>
            <style>{`.animate-fade-in { animation: fade-in 0.3s ease-out; } @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </>
    );
};

export default Conversation;