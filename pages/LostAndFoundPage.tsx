// src/pages/LostAndFoundPage.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { LostAndFoundItem as ItemType, Profile } from '../types';
import Spinner from '../components/Spinner';
import { XCircleIcon, ImageIcon, ChatIcon } from '../components/icons';
import { formatTimestamp } from '../utils/timeUtils';

const TabButton: React.FC<{ label: string; count?: number; isActive: boolean; onClick: () => void }> = ({ label, count, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${
        isActive
          ? 'bg-gradient-to-r from-brand-green to-brand-green/90 text-black shadow-lg shadow-brand-green/30'
          : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light/50 dark:hover:bg-tertiary/50'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          isActive 
            ? 'bg-black/20 text-black' 
            : 'bg-tertiary-light dark:bg-tertiary text-text-secondary-light dark:text-text-secondary'
        }`}>
          {count}
        </span>
      )}
    </button>
);

const LostAndFoundPage: React.FC = () => {
    const { profile } = useAuth();
    const [items, setItems] = useState<ItemType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'found' | 'lost'>('found');

    const fetchItems = async (campus: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('lost_and_found_items')
                .select('*, profiles(*)')
                .eq('campus', campus)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data as any[] || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.campus) {
            fetchItems(profile.campus);
        }
    }, [profile?.campus]);

    const handlePostCreated = (newItem: ItemType) => {
        setItems(prevItems => [newItem, ...prevItems]);
        setCreateModalOpen(false);
    };

    const handleItemReclaimed = async (itemId: string) => {
        if (!window.confirm("Are you sure you want to mark this item as reclaimed/found? This will remove the post.")) return;

        try {
            const { error } = await supabase
                .from('lost_and_found_items')
                .update({ status: 'reclaimed' })
                .eq('id', itemId);

            if (error) throw error;
            setItems(items.filter(item => item.id !== itemId));
        } catch (err: any) {
            console.error("Failed to update item status:", err);
        }
    };
    
    const filteredItems = useMemo(() => items.filter(item => item.item_type === activeTab), [items, activeTab]);
    const foundCount = items.filter(item => item.item_type === 'found').length;
    const lostCount = items.filter(item => item.item_type === 'lost').length;

    return (
        <div className="max-w-7xl mx-auto">
            {isCreateModalOpen && profile && (
                <CreateItemModal 
                    campus={profile.campus!}
                    itemType={activeTab}
                    onClose={() => setCreateModalOpen(false)} 
                    onPostCreated={handlePostCreated} 
                />
            )}

            {/* Header Section */}
            <div className="mb-8 bg-gradient-to-br from-secondary-light to-primary-light dark:from-secondary dark:to-primary rounded-2xl p-8 shadow-lg border border-tertiary-light/30 dark:border-tertiary/30">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-green to-brand-green/80 flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main">Lost & Found</h1>
                        </div>
                        <p className="text-lg text-text-secondary-light dark:text-text-secondary ml-15">
                            Track down lost items or report something you've found on campus.
                        </p>
                    </div>
                    <button 
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-brand-green to-brand-green/90 text-black font-bold py-3 px-8 rounded-xl hover:shadow-lg hover:shadow-brand-green/30 transition-all duration-200 shadow-md whitespace-nowrap"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        Post {activeTab === 'found' ? 'Found' : 'Lost'} Item
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-3 mb-8">
                <TabButton 
                    label="Found Items" 
                    count={foundCount}
                    isActive={activeTab === 'found'} 
                    onClick={() => setActiveTab('found')} 
                />
                <TabButton 
                    label="Lost Items" 
                    count={lostCount}
                    isActive={activeTab === 'lost'} 
                    onClick={() => setActiveTab('lost')} 
                />
            </div>

            {/* Content */}
            {loading && (
                <div className="flex justify-center items-center py-20">
                    <Spinner />
                </div>
            )}
            
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-6 text-center">
                    <p className="text-red-600 dark:text-red-400">Error: {error}</p>
                </div>
            )}
            
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => <ItemCard key={item.id} item={item} onItemReclaimed={handleItemReclaimed} />)
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20">
                            <div className="w-20 h-20 rounded-full bg-tertiary-light/50 dark:bg-tertiary/50 flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-text-tertiary-light dark:text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-text-secondary-light dark:text-text-secondary text-lg font-medium">
                                No {activeTab === 'found' ? 'found' : 'lost'} items posted yet
                            </p>
                            <p className="text-text-tertiary-light dark:text-text-tertiary text-sm mt-1">
                                Be the first to post!
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ItemCard: React.FC<{ item: ItemType; onItemReclaimed: (itemId: string) => void; }> = ({ item, onItemReclaimed }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const poster = item.profiles;

    const handleContact = () => {
        if (!poster) return;
        navigate('/chat', { state: { recipient: poster } });
    };

    const isOwner = user?.id === item.user_id;
    const locationLabel = item.item_type === 'found' ? 'Found near' : 'Last seen near';

    return (
        <div className="group bg-gradient-to-br from-secondary-light to-primary-light dark:from-secondary dark:to-primary rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-tertiary-light/30 dark:border-tertiary/30 flex flex-col transition-all duration-300 hover:-translate-y-1">
            {/* Image */}
            <div className="relative overflow-hidden">
                <img 
                    className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105" 
                    src={item.image_url || `https://placehold.co/600x400/1e293b/3cfba2?text=${item.item_type === 'lost' ? 'Lost+Item' : 'Found+Item'}`} 
                    alt={item.title} 
                />
                <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                        item.item_type === 'found'
                            ? 'bg-brand-green text-black'
                            : 'bg-orange-500 text-white'
                    }`}>
                        {item.item_type === 'found' ? '✓ Found' : '⚠ Lost'}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-text-main-light dark:text-text-main truncate mb-2">
                    {item.title}
                </h3>
                
                <div className="flex items-start gap-2 mb-3">
                    <svg className="w-4 h-4 text-brand-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">
                        <span className="font-medium">{locationLabel}:</span> {item.location_found}
                    </p>
                </div>
                
                <p className="text-sm text-text-secondary-light dark:text-text-secondary mb-4 flex-grow line-clamp-3">
                    {item.description || 'No description provided.'}
                </p>
                
                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-tertiary-light/40 dark:border-tertiary/40">
                    <div className="min-w-0 flex items-center gap-2">
                        <img 
                            src={poster?.avatar_url || `https://ui-avatars.com/api/?name=${poster?.username}&background=10b981&color=fff`}
                            alt={poster?.username}
                            className="w-8 h-8 rounded-full ring-2 ring-white/50 dark:ring-gray-700/50"
                        />
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase text-text-tertiary-light dark:text-text-tertiary tracking-wide">
                                Posted by
                            </p>
                            <Link 
                                to={`/profile/${poster?.username}`} 
                                className="text-sm font-semibold text-brand-green hover:underline truncate block"
                            >
                                @{poster?.username || 'Unknown'}
                            </Link>
                        </div>
                    </div>
                    
                    {isOwner ? (
                        <button 
                            onClick={() => onItemReclaimed(item.id)} 
                            className="flex-shrink-0 font-semibold py-2 px-4 rounded-lg text-xs transition-all bg-white/60 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-text-main-light dark:text-text-main hover:border-brand-green hover:bg-brand-green/10 hover:text-brand-green"
                        >
                            Mark {item.item_type === 'found' ? 'Reclaimed' : 'Found'}
                        </button>
                    ) : (
                        <button 
                            onClick={handleContact} 
                            className="flex-shrink-0 flex items-center gap-2 bg-brand-green/20 dark:bg-brand-green/30 font-semibold text-sm py-2 px-4 rounded-lg hover:bg-brand-green/30 dark:hover:bg-brand-green/40 text-brand-green transition-all"
                        >
                            <ChatIcon className="w-4 h-4" />
                            <span>Contact</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const CreateItemModal: React.FC<{ campus: string; itemType: 'lost' | 'found'; onClose: () => void; onPostCreated: (newItem: ItemType) => void; }> = ({ campus, itemType, onClose, onPostCreated }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isFoundItem = itemType === 'found';
        if (!user || !title || !location || (isFoundItem && !imageFile)) {
            setError(`Title, location, and ${isFoundItem ? 'an image are' : 'is'} required.`);
            return;
        }
        setIsSubmitting(true);
        setError('');

        try {
            let publicUrl = null;
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const filePath = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('lost-and-found-images').upload(filePath, imageFile);
                if (uploadError) throw uploadError;
                publicUrl = supabase.storage.from('lost-and-found-images').getPublicUrl(filePath).data.publicUrl;
            }

            const { data: newItem, error: insertError } = await supabase
                .from('lost_and_found_items')
                .insert({
                    user_id: user.id,
                    item_type: itemType,
                    title,
                    description,
                    location_found: location,
                    image_url: publicUrl,
                    campus,
                })
                .select('*, profiles(*)')
                .single();

            if (insertError) throw insertError;
            onPostCreated(newItem as any);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const locationLabel = itemType === 'found' ? 'Location Found' : 'Last Seen At';
    const imageLabel = itemType === 'found' ? 'Image' : 'Image (Optional)';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gradient-to-br from-secondary-light to-primary-light dark:from-secondary dark:to-primary rounded-2xl shadow-2xl w-full max-w-2xl border border-tertiary-light/30 dark:border-tertiary/30" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8">
                    {/* Header */}
                    <header className="flex items-center justify-between pb-6 border-b border-tertiary-light/40 dark:border-tertiary/40">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                itemType === 'found' 
                                    ? 'bg-brand-green/20 text-brand-green' 
                                    : 'bg-orange-500/20 text-orange-500'
                            }`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main">
                                Post a {itemType === 'found' ? 'Found' : 'Lost'} Item
                            </h2>
                        </div>
                        <button type="button" onClick={onClose} className="text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main transition-colors">
                            <XCircleIcon className="w-8 h-8" />
                        </button>
                    </header>
                    
                    {/* Form Fields */}
                    <div className="mt-6 space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-text-main-light dark:text-text-main mb-2">
                                Item Name <span className="text-brand-green">*</span>
                            </label>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                placeholder="e.g., Blue Backpack, iPhone 13, Keys..."
                                className="w-full px-4 py-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-tertiary-light/50 dark:border-gray-600/50 text-text-main-light dark:text-text-main placeholder:text-text-tertiary-light dark:placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-text-main-light dark:text-text-main mb-2">
                                {locationLabel} <span className="text-brand-green">*</span>
                            </label>
                            <input 
                                type="text" 
                                value={location} 
                                onChange={e => setLocation(e.target.value)}
                                placeholder="e.g., Library 2nd floor, Main cafeteria..."
                                className="w-full px-4 py-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-tertiary-light/50 dark:border-gray-600/50 text-text-main-light dark:text-text-main placeholder:text-text-tertiary-light dark:placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-text-main-light dark:text-text-main mb-2">
                                Description
                            </label>
                            <textarea 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                rows={4}
                                placeholder="Provide any additional details that might help..."
                                className="w-full px-4 py-3 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-tertiary-light/50 dark:border-gray-600/50 text-text-main-light dark:text-text-main placeholder:text-text-tertiary-light dark:placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all resize-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-text-main-light dark:text-text-main mb-2">
                                {imageLabel} {itemType === 'found' && <span className="text-brand-green">*</span>}
                            </label>
                            <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" hidden />
                            
                            {imagePreview ? (
                                <div className="relative">
                                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setImageFile(null);
                                            setImagePreview(null);
                                        }}
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    type="button" 
                                    onClick={() => imageInputRef.current?.click()} 
                                    className="w-full flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-tertiary-light/50 dark:border-gray-600/50 bg-white/30 dark:bg-gray-800/30 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:border-brand-green/50 transition-all"
                                >
                                    <ImageIcon className="w-6 h-6 text-text-tertiary-light dark:text-text-tertiary" />
                                    <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary">
                                        Click to upload image
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mt-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl">
                            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                    
                    {/* Footer */}
                    <footer className="flex justify-end gap-3 pt-6 mt-6 border-t border-tertiary-light/40 dark:border-tertiary/40">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="py-3 px-6 rounded-xl font-semibold text-text-main-light dark:text-text-main hover:bg-tertiary-light/60 dark:hover:bg-tertiary/60 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="py-3 px-8 rounded-xl font-bold text-black bg-gradient-to-r from-brand-green to-brand-green/90 hover:shadow-lg hover:shadow-brand-green/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner />
                                    <span>Posting...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Post Item
                                </>
                            )}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default LostAndFoundPage;