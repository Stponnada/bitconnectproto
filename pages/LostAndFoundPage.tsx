// src/pages/LostAndFoundPage.tsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <-- Make sure Link is imported
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { LostAndFoundItem as ItemType, Profile } from '../types';
import Spinner from '../components/Spinner';
import { XCircleIcon, ImageIcon, ChatIcon } from '../components/icons';
import { formatTimestamp } from '../utils/timeUtils';

// TabButton component (no changes)
const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        isActive
          ? 'bg-brand-green text-black'
          : 'text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary'
      }`}
    >
      {label}
    </button>
);

// LostAndFoundPage component (no changes)
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

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main">Lost & Found</h1>
                    <p className="mt-2 text-lg text-text-secondary-light dark:text-text-secondary">Track down lost items or report something you've found.</p>
                </div>
                <button 
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-brand-green text-black font-bold py-2 px-6 rounded-full hover:bg-brand-green-darker transition-colors"
                >
                    + Post {activeTab === 'found' ? 'Found Item' : 'Lost Item'}
                </button>
            </div>

            <div className="flex space-x-2 border-b border-tertiary-light dark:border-tertiary mb-6">
                <TabButton label="Found Items" isActive={activeTab === 'found'} onClick={() => setActiveTab('found')} />
                <TabButton label="Lost Items" isActive={activeTab === 'lost'} onClick={() => setActiveTab('lost')} />
            </div>

            {loading && <div className="text-center p-8"><Spinner /></div>}
            {error && <div className="text-center p-8 text-red-400">Error: {error}</div>}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => <ItemCard key={item.id} item={item} onItemReclaimed={handleItemReclaimed} />)
                    ) : (
                        <p className="col-span-full text-center text-text-tertiary-light dark:text-text-tertiary py-16">
                            No {activeTab === 'found' ? 'found' : 'lost'} items have been posted yet.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

// --- THIS IS THE UPDATED COMPONENT ---
const ItemCard: React.FC<{ item: ItemType; onItemReclaimed: (itemId: string) => void; }> = ({ item, onItemReclaimed }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const poster = item.profiles;

    const handleContact = () => {
        if (!poster) return;
        navigate('/chat', { state: { recipient: poster } });
    };

    const isOwner = user?.id === item.user_id;
    const locationLabel = item.item_type === 'found' ? 'Found near:' : 'Last seen near:';

    return (
        <div className="bg-secondary-light dark:bg-secondary rounded-lg overflow-hidden shadow-lg border border-tertiary-light dark:border-tertiary flex flex-col">
            <img className="w-full h-56 object-cover" src={item.image_url || `https://placehold.co/600x400/1e293b/3cfba2?text=${item.item_type === 'lost' ? 'Lost+Item' : 'Found+Item'}`} alt={item.title} />
            <div className="p-5 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-text-main-light dark:text-text-main truncate">{item.title}</h3>
                <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mt-1">{locationLabel} {item.location_found}</p>
                <p className="text-base text-text-secondary-light dark:text-text-secondary mt-3 mb-4 flex-grow min-h-[4rem]">{item.description}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-tertiary-light dark:border-tertiary">
                    {/* FIX 1: Added min-w-0 to allow text to shrink and truncate properly */}
                    <div className="min-w-0 mr-4">
                        <p className="text-xs font-semibold uppercase text-text-tertiary-light dark:text-text-tertiary">Posted by</p>
                        {/* FIX 2: Wrapped the username in a Link component */}
                        <Link to={`/profile/${poster?.username}`} className="text-sm font-semibold text-brand-green hover:underline truncate block">
                           @{poster?.username || 'Unknown'}
                        </Link>
                    </div>
                    {isOwner ? (
                        <button 
                            onClick={() => onItemReclaimed(item.id)} 
                            className="flex-shrink-0 font-semibold py-2 px-6 rounded-full text-sm transition-colors bg-transparent border border-gray-400 dark:border-gray-500 text-text-main-light dark:text-text-main hover:border-red-500 hover:text-red-500"
                        >
                           Mark as {item.item_type === 'found' ? 'Reclaimed' : 'Found'}
                        </button>
                    ) : (
                        <button onClick={handleContact} className="flex-shrink-0 flex items-center space-x-2 bg-tertiary-light dark:bg-tertiary font-semibold text-sm py-2 px-3 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">
                            <ChatIcon className="w-4 h-4" />
                            <span>Contact</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// CreateItemModal component (no changes)
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
    
    const locationLabel = itemType === 'found' ? 'Location Found*' : 'Last Seen At*';
    const imageLabel = itemType === 'found' ? 'Image*' : 'Image (Optional)';


    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <header className="flex items-center justify-between pb-4 border-b border-tertiary-light dark:border-tertiary">
                        <h2 className="text-xl font-bold">Post a {itemType === 'found' ? 'Found' : 'Lost'} Item</h2>
                        <button type="button" onClick={onClose}><XCircleIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" /></button>
                    </header>
                    
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Title / Item Name*</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">{locationLabel}</label>
                            <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Description</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{imageLabel}</label>
                            <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" hidden />
                            <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center space-x-2 text-sm p-2 rounded bg-tertiary-light dark:bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-600">
                                <ImageIcon />
                                <span>Upload Image</span>
                            </button>
                            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />}
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                    
                    <footer className="flex justify-end space-x-4 pt-6 mt-4 border-t border-tertiary-light dark:border-tertiary">
                        <button type="button" onClick={onClose} className="py-2 px-6 rounded-full hover:bg-tertiary-light/60 dark:hover:bg-tertiary">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-6 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50">
                            {isSubmitting ? <Spinner /> : 'Post Item'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default LostAndFoundPage;