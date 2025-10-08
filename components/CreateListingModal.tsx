// src/components/CreateListingModal.tsx

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { MarketplaceListing } from '../types';
import Spinner from './Spinner';
import { XCircleIcon, ImageIcon } from './icons';

const CATEGORIES = ['Books & Notes', 'Electronics', 'Furniture', 'Apparel', 'Cycles & Vehicles', 'Other'];

interface CreateListingModalProps {
    campus: string;
    onClose: () => void;
    onListingCreated: (newListing: MarketplaceListing) => void;
    onListingUpdated: (updatedListing: MarketplaceListing) => void; // For edits
    existingListing?: MarketplaceListing | null; // Pass this for editing
}

const CreateListingModal: React.FC<CreateListingModalProps> = ({ campus, onClose, onListingCreated, onListingUpdated, existingListing }) => {
    const { user } = useAuth();
    const isEditMode = !!existingListing;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imagesToRemove, setImagesToRemove] = useState<string[]>([]); // URLs of existing images to delete

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditMode && existingListing) {
            setTitle(existingListing.title);
            setDescription(existingListing.description);
            setPrice(String(existingListing.price));
            setCategory(existingListing.category);
            setImagePreviews(existingListing.all_images || []);
        }
    }, [isEditMode, existingListing]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const totalImages = imagePreviews.length - imagesToRemove.length + files.length;
            if (totalImages > 5) {
                alert("You can upload a maximum of 5 images.");
                return;
            }
            const newImageFiles = [...imageFiles, ...files];
            setImageFiles(newImageFiles);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };
    
    const removeImage = (index: number, previewUrl: string) => {
        const fileIndex = imagePreviews.slice(0, index).filter(p => p.startsWith('blob:')).length;
        const existingUrlIndex = index - imagePreviews.slice(0, index).filter(p => p.startsWith('blob:')).length;
        
        if (previewUrl.startsWith('blob:')) { // It's a new file
            setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
        } else { // It's an existing image URL
            setImagesToRemove(prev => [...prev, previewUrl]);
        }
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentImageCount = imagePreviews.length - imagesToRemove.length;
        if (!user || !title || !price || !category || currentImageCount === 0) {
            setError('Please fill all required fields and have at least one image.');
            return;
        }
        setIsSubmitting(true);
        setError(null);

        try {
            if (isEditMode && existingListing) {
                // --- EDIT LOGIC ---
                // 1. Update listing text details
                const { data: updatedListingData, error: updateError } = await supabase
                    .from('marketplace_listings')
                    .update({ title, description, price: parseFloat(price), category })
                    .eq('id', existingListing.id)
                    .select()
                    .single();
                if (updateError) throw updateError;
                
                // 2. Remove old images
                if (imagesToRemove.length > 0) {
                    const imagePaths = imagesToRemove.map(url => url.substring(url.lastIndexOf('/' + user.id)));
                    await supabase.storage.from('marketplace-images').remove(imagePaths);
                    await supabase.from('marketplace_images').delete().in('image_url', imagesToRemove);
                }

                // 3. Upload new images
                const newImageUrls = await uploadImages(imageFiles, existingListing.id);
                
                // 4. Fetch the complete updated listing to pass back
                const { data: finalListing, error: rpcError } = await supabase
                    .rpc('get_marketplace_listings', { p_campus: campus })
                    .eq('id', existingListing.id)
                    .single();
                if (rpcError) throw rpcError;

                onListingUpdated(finalListing as MarketplaceListing);

            } else {
                // --- CREATE LOGIC ---
                const { data: listingData, error: insertError } = await supabase
                    .from('marketplace_listings').insert({ seller_id: user.id, title, description, price: parseFloat(price), category, campus }).select().single();
                if (insertError) throw insertError;
                const listingId = listingData.id;
                
                await uploadImages(imageFiles, listingId);
                
                const { data: newListing, error: rpcError } = await supabase.rpc('get_marketplace_listings', { p_campus: campus }).eq('id', listingId).single();
                if (rpcError) throw rpcError;
                onListingCreated(newListing as MarketplaceListing);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const uploadImages = async (files: File[], listingId: string) => {
        if (files.length === 0) return [];
        const uploadPromises = files.map(async (file, index) => {
            const fileExt = file.name.split('.').pop();
            const filePath = `${user!.id}/${listingId}/${Date.now()}_${index}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('marketplace-images').upload(filePath, file);
            if (uploadError) throw uploadError;
            return supabase.storage.from('marketplace-images').getPublicUrl(filePath).data.publicUrl;
        });
        const imageUrls = await Promise.all(uploadPromises);
        const imageRecords = imageUrls.map(url => ({ listing_id: listingId, image_url: url }));
        const { error: imageInsertError } = await supabase.from('marketplace_images').insert(imageRecords);
        if (imageInsertError) throw imageInsertError;
        return imageUrls;
    };
    
    const maxImages = 5;
    const canAddMoreImages = (imagePreviews.length - imagesToRemove.length) < maxImages;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <header className="flex items-center justify-between pb-4 border-b border-tertiary-light dark:border-tertiary">
                        <h2 className="text-xl font-bold">{isEditMode ? 'Edit Listing' : 'Create a New Listing'}</h2>
                        <button type="button" onClick={onClose}><XCircleIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" /></button>
                    </header>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="md:col-span-2"><label className="block text-sm font-medium">Title*</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" /></div>
                        <div><label className="block text-sm font-medium">Price (₹)*</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} required min="0" step="0.01" className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" /></div>
                        <div><label className="block text-sm font-medium">Category*</label><select value={category} onChange={e => setCategory(e.target.value)} required className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600"><option value="" disabled>Select a category</option>{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                        <div className="md:col-span-2"><label className="block text-sm font-medium">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" /></div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Images (up to 5)*</label>
                            <div className="flex flex-wrap gap-2">
                                {imagePreviews.map((preview, index) => !imagesToRemove.includes(preview) && (
                                    <div key={preview} className="relative group w-24 h-24">
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover rounded" />
                                        <button type="button" onClick={() => removeImage(index, preview)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100"><XCircleIcon className="w-5 h-5" /></button>
                                    </div>
                                ))}
                                {canAddMoreImages && (
                                    <button type="button" onClick={() => imageInputRef.current?.click()} className="w-24 h-24 flex flex-col items-center justify-center text-sm p-2 rounded bg-tertiary-light dark:bg-tertiary hover:bg-gray-300 dark:hover:bg-gray-600 border-2 border-dashed border-tertiary-light dark:border-gray-600"><ImageIcon className="w-8 h-8"/><span>Add Image</span></button>
                                )}
                            </div>
                             <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" multiple hidden />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                    
                    <footer className="flex justify-end space-x-4 pt-6 mt-4 border-t border-tertiary-light dark:border-tertiary">
                        <button type="button" onClick={onClose} className="py-2 px-6 rounded-full hover:bg-tertiary-light/60 dark:hover:bg-tertiary">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="py-2 px-6 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50">{isSubmitting ? <Spinner /> : isEditMode ? 'Save Changes' : 'Post Listing'}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default CreateListingModal;