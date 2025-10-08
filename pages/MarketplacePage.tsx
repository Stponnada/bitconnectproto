// src/pages/MarketplacePage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { MarketplaceListing } from '../types';
import Spinner from '../components/Spinner';
import ListingCard from '../components/ListingCard';
import CreateListingModal from '../components/CreateListingModal';
import ListingDetailModal from '../components/ListingDetailModal';

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`relative px-6 py-4 text-sm font-semibold transition-all duration-200 border-b-2 ${
        isActive
          ? 'border-brand-green text-brand-green'
          : 'border-transparent text-text-secondary-light dark:text-text-secondary hover:border-tertiary-light dark:hover:border-tertiary hover:text-text-main-light'
      }`}
    >
      {label}
      {isActive && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-green rounded-t-full" />
      )}
    </button>
);

const MarketplacePage: React.FC = () => {
    const { profile, user } = useAuth();
    const [listings, setListings] = useState<MarketplaceListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'browse' | 'myListings'>('browse');

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
    const [listingToEdit, setListingToEdit] = useState<MarketplaceListing | null>(null);

    useEffect(() => {
        if (!profile?.campus) return;
        
        const fetchListings = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: rpcError } = await supabase.rpc('get_marketplace_listings', { p_campus: profile.campus });
                if (rpcError) throw rpcError;
                setListings(data as MarketplaceListing[] || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, [profile?.campus]);

    const { myListings, otherListings } = useMemo(() => {
        if (!user) return { myListings: [], otherListings: listings };
        const my = listings.filter(l => l.seller_id === user.id);
        const other = listings.filter(l => l.seller_id !== user.id);
        return { myListings: my, otherListings: other };
    }, [listings, user]);

    const handleListingCreated = (newListing: MarketplaceListing) => {
        setListings(prev => [newListing, ...prev]);
        setCreateModalOpen(false);
    };

    const handleListingUpdated = (updatedListing: MarketplaceListing) => {
        setListings(prev => prev.map(l => l.id === updatedListing.id ? updatedListing : l));
        setListingToEdit(null);
        if (selectedListing?.id === updatedListing.id) {
            setSelectedListing(updatedListing);
        }
    };

    const handleOpenEditModal = (listing: MarketplaceListing) => {
        setSelectedListing(null);
        setListingToEdit(listing);
    };
    
    const handleListingDeleted = (listingId: string) => {
        setListings(prev => prev.filter(l => l.id !== listingId));
        setSelectedListing(null);
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh] p-8">
            <Spinner />
        </div>
    );
    if (error) return (
        <div className="flex justify-center items-center min-h-[60vh] p-8">
            <div className="text-center">
                <div className="text-red-400 mb-4">Error loading listings</div>
                <p className="text-text-secondary-light dark:text-text-secondary">{error}</p>
            </div>
        </div>
    );

    const showFormModal = isCreateModalOpen || !!listingToEdit;
    const listingsToShow = activeTab === 'browse' ? otherListings : myListings;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {showFormModal && profile?.campus && (
                    <CreateListingModal 
                        campus={profile.campus}
                        onClose={() => { setCreateModalOpen(false); setListingToEdit(null); }}
                        onListingCreated={handleListingCreated}
                        onListingUpdated={handleListingUpdated}
                        existingListing={listingToEdit}
                    />
                )}
                {selectedListing && (
                    <ListingDetailModal 
                        listing={selectedListing}
                        onClose={() => setSelectedListing(null)}
                        onEdit={handleOpenEditModal}
                        onDelete={handleListingDeleted}
                    />
                )}

                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div className="flex-1">
                            <h1 className="text-3xl sm:text-4xl font-bold text-text-main-light dark:text-text-main mb-2">
                                Marketplace
                            </h1>
                            <p className="text-lg text-text-secondary-light dark:text-text-secondary">
                                Buy & sell goods within the {profile?.campus} campus.
                            </p>
                        </div>
                        <button 
                            onClick={() => setCreateModalOpen(true)}
                            className="bg-brand-green text-black font-bold py-3 px-8 rounded-full hover:bg-brand-green-darker transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 whitespace-nowrap"
                        >
                            + Sell Item
                        </button>
                    </div>
                </div>
                
                {/* Tab Navigation */}
                <div className="flex flex-col sm:flex-row border-b border-tertiary-light dark:border-tertiary mb-8 bg-surface-light dark:bg-surface-dark rounded-lg overflow-hidden shadow-sm">
                    <div className="flex space-x-0 sm:space-x-0 border-b sm:border-b-0 sm:border-r border-tertiary-light dark:border-tertiary">
                        <TabButton label="Browse All" isActive={activeTab === 'browse'} onClick={() => setActiveTab('browse')} />
                        <TabButton label="My Listings" isActive={activeTab === 'myListings'} onClick={() => setActiveTab('myListings')} />
                    </div>
                </div>

                {/* Listings Grid */}
                <div className="space-y-6">
                    {listingsToShow.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {listingsToShow.map(listing => (
                                <ListingCard 
                                    key={listing.id} 
                                    listing={listing} 
                                    onClick={() => setSelectedListing(listing)} 
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-tertiary-light dark:border-tertiary">
                            <div className="w-16 h-16 bg-tertiary-light dark:bg-tertiary rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-text-main-light dark:text-text-main mb-2">
                                {activeTab === 'browse' ? 'No Items Available' : 'No Listings Yet'}
                            </h3>
                            <p className="text-text-tertiary-light dark:text-text-tertiary max-w-md">
                                {activeTab === 'browse'
                                    ? "There are no other items for sale right now. Check back later!"
                                    : "You haven't listed any items for sale. Start by creating your first listing."
                                }
                            </p>
                            {activeTab === 'myListings' && (
                                <button 
                                    onClick={() => setCreateModalOpen(true)}
                                    className="mt-6 bg-brand-green text-black font-bold py-2 px-6 rounded-full hover:bg-brand-green-darker transition-all duration-200"
                                >
                                    Create Your First Listing
                                </button>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MarketplacePage;