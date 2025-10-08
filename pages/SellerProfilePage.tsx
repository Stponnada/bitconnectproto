// src/pages/SellerProfilePage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Profile, MarketplaceListing } from '../types';
import Spinner from '../components/Spinner';
import ListingCard from '../components/ListingCard';
import ListingDetailModal from '../components/ListingDetailModal';
import RateSellerModal from '../components/RateSellerModal';
import { StarIcon } from '../components/icons';

const SellerProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();

    const [sellerProfile, setSellerProfile] = useState<Profile | null>(null);
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isRateModalOpen, setRateModalOpen] = useState(false);
    const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);

    const fetchData = useCallback(async () => {
        if (!username) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch profile and listings in parallel
            const profilePromise = supabase.rpc('get_profile_details', { profile_username: username }).single();
            const listingsPromise = supabase.rpc('get_listings_by_seller', { p_seller_username: username });

            const [profileResult, listingsResult] = await Promise.all([profilePromise, listingsPromise]);

            if (profileResult.error || !profileResult.data) throw profileResult.error || new Error("Seller not found");
            setSellerProfile(profileResult.data);

            if (listingsResult.error) throw listingsResult.error;
            // We need to enrich the listings with primary image URL client-side
            const listingsData = listingsResult.data || [];
            const enrichedListings = await Promise.all(
                listingsData.map(async (listing: any) => {
                    const { data: images } = await supabase.from('marketplace_images').select('image_url').eq('listing_id', listing.id).order('created_at').limit(1);
                    return { ...listing, primary_image_url: images?.[0]?.image_url || null, seller_profile: profileResult.data };
                })
            );
            setListings(enrichedListings);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div className="text-center p-8"><Spinner /></div>;
    if (error || !sellerProfile) return <div className="text-center p-8 text-red-400">{error || "Seller not found."}</div>;
    
    const isOwnSellerProfile = currentUser?.id === sellerProfile.user_id;

    return (
        <div className="max-w-7xl mx-auto">
            {isRateModalOpen && (
                <RateSellerModal 
                    sellerProfile={sellerProfile}
                    onClose={() => setRateModalOpen(false)}
                    onRatingSuccess={fetchData}
                />
            )}
            {selectedListing && (
                <ListingDetailModal 
                    listing={selectedListing}
                    onClose={() => setSelectedListing(null)}
                />
            )}

            <div className="bg-secondary-light dark:bg-secondary p-6 rounded-lg shadow-lg border border-tertiary-light dark:border-tertiary mb-8">
                <div className="flex items-center space-x-4">
                    <img src={sellerProfile.avatar_url || ''} alt={sellerProfile.username} className="w-20 h-20 rounded-full object-cover" />
                    <div>
                        <h1 className="text-3xl font-bold text-text-main-light dark:text-text-main">{sellerProfile.full_name}</h1>
                        <p className="text-text-tertiary-light dark:text-text-tertiary">@{sellerProfile.username}</p>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-tertiary-light dark:border-tertiary">
                    <div>
                        <h2 className="text-lg font-semibold">Seller Rating</h2>
                        {(sellerProfile.total_seller_ratings ?? 0) > 0 ? (
                            <div className="flex items-center text-sm mt-1">
                                <StarIcon className="w-5 h-5 text-yellow-400" />
                                <span className="font-bold text-text-main-light dark:text-white ml-1">{sellerProfile.avg_seller_rating?.toFixed(1)}</span>
                                <span className="text-text-tertiary-light dark:text-text-tertiary ml-2">from {sellerProfile.total_seller_ratings} ratings</span>
                            </div>
                        ) : (
                            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mt-1 italic">No ratings yet.</p>
                        )}
                    </div>
                    {!isOwnSellerProfile && (
                        <button 
                            onClick={() => setRateModalOpen(true)} 
                            className="font-semibold py-2 px-4 rounded-full border border-tertiary-light dark:border-tertiary hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors flex items-center space-x-1"
                        >
                            <StarIcon className="w-4 h-4 text-yellow-400"/>
                            <span>Rate Seller</span>
                        </button>
                    )}
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">Items for Sale ({listings.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {listings.length > 0 ? (
                    listings.map(listing => (
                        <ListingCard 
                            key={listing.id}
                            listing={listing}
                            onClick={() => setSelectedListing(listing)}
                        />
                    ))
                ) : (
                    <p className="col-span-full text-center text-text-tertiary-light dark:text-text-tertiary py-16">
                        This seller has no other items for sale.
                    </p>
                )}
            </div>
        </div>
    );
};

export default SellerProfilePage;