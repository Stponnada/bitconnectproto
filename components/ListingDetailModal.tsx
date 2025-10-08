// src/components/ListingDetailModal.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MarketplaceListing } from '../types';
import { XCircleIcon, ChatIcon, StarIcon } from './icons';
import Spinner from './Spinner';
import { supabase } from '../services/supabase'; // <-- Import Supabase for delete

const BackIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
);
const ForwardIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
);

interface ListingDetailModalProps {
    listing: MarketplaceListing;
    onClose: () => void;
    onEdit: (listing: MarketplaceListing) => void;
    onDelete: (listingId: string) => void;
}

const ListingDetailModal: React.FC<ListingDetailModalProps> = ({ listing, onClose, onEdit, onDelete }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    const images = listing.all_images || (listing.primary_image_url ? [listing.primary_image_url] : []);
    const isOwner = user?.id === listing.seller_id;

    const handleContactSeller = () => {
        if (isOwner) return;
        navigate('/chat', { state: { recipient: listing.seller_profile } });
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to permanently delete this listing? This action cannot be undone.")) return;
        setIsDeleting(true);
        try {
            const { error } = await supabase.rpc('delete_listing', { p_listing_id: listing.id });
            if (error) throw error;
            onDelete(listing.id);
        } catch (err: any) {
            console.error("Failed to delete listing:", err);
            alert(`Error: ${err.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const nextImage = () => setCurrentImageIndex(prev => (prev + 1) % images.length);
    const prevImage = () => setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row" onClick={(e) => e.stopPropagation()}>
                <div className="w-full md:w-1/2 relative bg-tertiary-light dark:bg-primary rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex items-center justify-center">
                    {images.length > 0 ? (
                        <>
                            <img src={images[currentImageIndex]} alt={`${listing.title} image ${currentImageIndex + 1}`} className="max-h-[50vh] md:max-h-[90vh] w-auto h-auto object-contain" />
                            {images.length > 1 && (
                                <>
                                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"><BackIcon /></button>
                                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"><ForwardIcon /></button>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{currentImageIndex + 1} / {images.length}</div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="text-text-tertiary-light dark:text-text-tertiary flex items-center justify-center h-full">No Image</div>
                    )}
                </div>

                <div className="w-full md:w-1/2 flex flex-col p-6 overflow-y-auto">
                    <header className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-semibold text-brand-green">{listing.category}</p>
                            <h2 className="text-3xl font-bold text-text-main-light dark:text-text-main mt-1">{listing.title}</h2>
                            <p className="text-2xl font-bold text-brand-green mt-2">₹{listing.price.toLocaleString()}</p>
                        </div>
                        <button onClick={onClose} className="text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover-text-white"><XCircleIcon className="w-8 h-8" /></button>
                    </header>
                    
                    <div className="my-6 border-t border-tertiary-light dark:border-tertiary"></div>
                    <p className="text-text-secondary-light dark:text-text-secondary whitespace-pre-wrap">{listing.description || "No description provided."}</p>

                    <div className="mt-auto pt-6">
                        <div className="bg-tertiary-light/50 dark:bg-tertiary/50 p-4 rounded-lg">
                            <p className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary mb-2">SELLER INFORMATION</p>
                            <Link to={`/marketplace/seller/${listing.seller_profile.username}`} className="flex items-center space-x-3 group">
                                <img src={listing.seller_profile.avatar_url || ''} alt={listing.seller_profile.username} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <p className="font-bold text-text-main-light dark:text-text-main group-hover:underline">{listing.seller_profile.full_name}</p>
                                    <div className="flex items-center text-xs text-text-tertiary-light dark:text-text-tertiary">
                                        {(listing.seller_profile.total_seller_ratings ?? 0) > 0 ? (
                                            <>
                                                <StarIcon className="w-4 h-4 text-yellow-400" />
                                                <span className="font-semibold text-text-secondary-light dark:text-text-secondary ml-1">{listing.seller_profile.avg_seller_rating?.toFixed(1)}</span>
                                                <span className="ml-1">({listing.seller_profile.total_seller_ratings} ratings)</span>
                                            </>
                                        ) : <span className="italic">No ratings yet</span>}
                                    </div>
                                </div>
                            </Link>
                        </div>
                        {isOwner ? (
                            <div className="w-full mt-4 flex items-center space-x-2">
                                <button onClick={() => onEdit(listing)} className="flex-1 font-bold py-3 px-6 rounded-lg border border-gray-400 dark:border-gray-500 text-text-main-light dark:text-text-main hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors">Edit</button>
                                <button onClick={handleDelete} disabled={isDeleting} className="flex-1 font-bold py-3 px-6 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50">{isDeleting ? <Spinner isRed={true} /> : 'Delete'}</button>
                            </div>
                        ) : (
                            <button onClick={handleContactSeller} className="w-full mt-4 flex items-center justify-center space-x-2 bg-brand-green text-black font-bold py-3 px-6 rounded-lg hover:bg-brand-green-darker transition-colors"><ChatIcon className="w-6 h-6" /><span>Contact Seller</span></button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingDetailModal;