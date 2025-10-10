// src/pages/CampusPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import { CampusPlace, MarketplaceListing, LostAndFoundItem } from '../types';
import ListingCard from '../components/ListingCard';
import Spinner from '../components/Spinner';
import { BuildingStorefrontIcon, ArchiveBoxIcon, ShoppingCartIcon, StarIcon } from '../components/icons';

// Enhanced navigation card with gradient border effect
const FeatureCard: React.FC<{ to: string; icon: React.ReactNode; title: string; description: string; gradient: string }> = ({ to, icon, title, description, gradient }) => (
    <Link to={to} className="group relative block bg-secondary-light dark:bg-secondary rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
        <div className="relative">
            <div className="flex items-start space-x-4">
                <div className={`bg-gradient-to-br ${gradient} p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-text-main-light dark:text-text-main group-hover:text-brand-green transition-colors duration-300">{title}</h3>
                    <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary leading-relaxed">{description}</p>
                </div>
            </div>
            <div className="mt-4 flex items-center text-brand-green font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span>Explore</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    </Link>
);

// Enhanced place card with hover effects
const MiniPlaceCard: React.FC<{ place: CampusPlace }> = ({ place }) => (
    <Link to={`/campus/reviews/${place.id}`} className="group block bg-secondary-light dark:bg-secondary rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-tertiary-light dark:border-tertiary hover:border-brand-green/50">
        <div className="flex items-center space-x-4">
            <div className="relative overflow-hidden rounded-lg">
                <img src={place.image_url || 'https://placehold.co/100x100'} alt={place.name} className="w-20 h-20 object-cover group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-text-main-light dark:text-text-main truncate group-hover:text-brand-green transition-colors duration-300">{place.name}</h4>
                <div className="flex items-center mt-2">
                    <div className="flex items-center bg-yellow-400/20 px-2 py-1 rounded-full">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        <span className="font-bold ml-1 text-sm text-yellow-400">{place.avg_rating.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-text-tertiary-light dark:text-text-tertiary ml-2">({place.review_count})</span>
                </div>
            </div>
        </div>
    </Link>
);

// Enhanced lost & found card with status indicator
const MiniLostItemCard: React.FC<{ item: LostAndFoundItem }> = ({ item }) => {
    const isLost = item.item_type === 'lost';
    return (
        <div className="group bg-secondary-light dark:bg-secondary rounded-xl p-4 shadow-md border border-tertiary-light dark:border-tertiary hover:shadow-lg transition-all duration-300">
            <div className="flex items-center space-x-4">
                <div className="relative overflow-hidden rounded-lg">
                    <img src={item.image_url || 'https://placehold.co/100x100'} alt={item.title} className="w-20 h-20 object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${isLost ? 'bg-red-500' : 'bg-green-500'} shadow-lg`}></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold uppercase mb-1 ${isLost ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {item.item_type}
                    </div>
                    <h4 className="font-bold text-text-main-light dark:text-text-main truncate">{item.title}</h4>
                    <p className="text-xs text-text-tertiary-light dark:text-text-tertiary truncate mt-1">
                        <span className="inline-block w-1 h-1 bg-brand-green rounded-full mr-1"></span>
                        {item.location_found}
                    </p>
                </div>
            </div>
        </div>
    );
};

const CampusPage: React.FC = () => {
    const { profile } = useAuth();
    const campusName = profile?.campus || 'Campus';

    const [topPlaces, setTopPlaces] = useState<CampusPlace[]>([]);
    const [newestListings, setNewestListings] = useState<MarketplaceListing[]>([]);
    const [latestLostItem, setLatestLostItem] = useState<LostAndFoundItem | null>(null);
    const [loadingPreviews, setLoadingPreviews] = useState(true);
    const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    // Typewriter effect for campus name
    useEffect(() => {
        if (!campusName) return;
        
        setDisplayedText('');
        setIsTyping(true);
        let currentIndex = 0;
        
        const typingInterval = setInterval(() => {
            if (currentIndex <= campusName.length) {
                setDisplayedText(campusName.slice(0, currentIndex));
                currentIndex++;
            } else {
                setIsTyping(false);
                clearInterval(typingInterval);
            }
        }, 100);
        
        return () => clearInterval(typingInterval);
    }, [campusName]);

    useEffect(() => {
        if (!profile?.campus) return;

        const fetchPreviews = async () => {
            setLoadingPreviews(true);
            try {
                const placesPromise = supabase.rpc('get_campus_places_with_ratings', { p_campus: profile.campus }).order('avg_rating', { ascending: false }).limit(2);
                const listingsPromise = supabase.rpc('get_marketplace_listings', { p_campus: profile.campus }).order('created_at', { ascending: false }).limit(3);
                const lostFoundPromise = supabase.from('lost_and_found_items').select('*').eq('campus', profile.campus).order('created_at', { ascending: false }).limit(1).single();

                const [placesResult, listingsResult, lostFoundResult] = await Promise.all([placesPromise, listingsPromise, lostFoundPromise]);

                if (placesResult.data) setTopPlaces(placesResult.data as CampusPlace[]);
                if (listingsResult.data) setNewestListings(listingsResult.data as MarketplaceListing[]);
                if (lostFoundResult.data) setLatestLostItem(lostFoundResult.data as LostAndFoundItem);

            } catch (error) {
                console.error("Error fetching campus previews:", error);
            } finally {
                setLoadingPreviews(false);
            }
        };

        fetchPreviews();
    }, [profile?.campus]);

    return (
        <div className="max-w-7xl mx-auto">
            {/* Enhanced Hero Section with gradient background */}
            <div className="relative bg-gradient-to-br from-brand-green/10 via-secondary-light to-secondary-light dark:from-brand-green/5 dark:via-secondary dark:to-secondary p-12 rounded-2xl shadow-2xl border border-tertiary-light dark:border-tertiary mb-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                <div className="relative text-center">
                    <div className="inline-block mb-4 px-4 py-2 bg-brand-green/20 rounded-full">
                        <span className="text-sm font-semibold text-brand-green">Your Campus Hub</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-text-main-light dark:text-text-main mb-4">
                       Today at BITS <span className="text-brand-green">{displayedText}</span><span className={`text-brand-green ${isTyping ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>|</span>
                    </h1>
                    <p className="text-lg md:text-xl text-text-secondary-light dark:text-text-secondary max-w-2xl mx-auto">
                        Your one-stop destination for campus services, reviews, and community connections
                    </p>
                </div>
            </div>

            {/* Enhanced Main Navigation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                <FeatureCard 
                    to="/campus/reviews" 
                    icon={<BuildingStorefrontIcon className="w-8 h-8 text-white" />} 
                    title="Campus Places" 
                    description="Discover and review the best eateries, shops, and hangout spots on campus"
                    gradient="from-blue-500 to-purple-600"
                />
                <FeatureCard 
                    to="/campus/lost-and-found" 
                    icon={<ArchiveBoxIcon className="w-8 h-8 text-white" />} 
                    title="Lost & Found" 
                    description="Report lost items or help reunite found items with their owners"
                    gradient="from-orange-500 to-red-600"
                />
                <FeatureCard 
                    to="/campus/marketplace" 
                    icon={<ShoppingCartIcon className="w-8 h-8 text-white" />} 
                    title="Marketplace" 
                    description="Buy, sell, and trade items with fellow students safely and easily"
                    gradient="from-green-500 to-teal-600"
                />
            </div>

            {/* Enhanced Dynamic Previews Section */}
            <div className="mt-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-text-main-light dark:text-text-main">What's Happening</h2>
                        <p className="text-text-secondary-light dark:text-text-secondary mt-1">Latest updates from around campus</p>
                    </div>
                    <div className="hidden md:block w-24 h-1 bg-gradient-to-r from-brand-green to-transparent rounded-full"></div>
                </div>
                
                {loadingPreviews ? (
                    <div className="flex justify-center items-center p-20">
                        <Spinner />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Top Places Preview */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-1 h-6 bg-brand-green rounded-full"></div>
                                <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">Top Rated Places</h3>
                            </div>
                            {topPlaces.length > 0 ? (
                                <div className="space-y-3">
                                    {topPlaces.map(place => <MiniPlaceCard key={place.id} place={place} />)}
                                </div>
                            ) : (
                                <div className="bg-secondary-light dark:bg-secondary rounded-xl p-8 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary">
                                    <StarIcon className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary mx-auto mb-3 opacity-50" />
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">No places reviewed yet. Be the first!</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Marketplace Preview */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                                <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">Fresh on Market</h3>
                            </div>
                            {newestListings.length > 0 ? (
                                <ListingCard listing={newestListings[0]} onClick={() => {}} />
                            ) : (
                                <div className="bg-secondary-light dark:bg-secondary rounded-xl p-8 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary">
                                    <ShoppingCartIcon className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary mx-auto mb-3 opacity-50" />
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">Marketplace is empty. List something!</p>
                                </div>
                            )}
                        </div>

                        {/* Latest Lost & Found Preview */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                                <h3 className="text-xl font-bold text-text-main-light dark:text-text-main">Lost & Found</h3>
                            </div>
                            {latestLostItem ? (
                                <MiniLostItemCard item={latestLostItem} />
                            ) : (
                                <div className="bg-secondary-light dark:bg-secondary rounded-xl p-8 text-center border-2 border-dashed border-tertiary-light dark:border-tertiary">
                                    <ArchiveBoxIcon className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary mx-auto mb-3 opacity-50" />
                                    <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">Nothing reported recently. Stay vigilant!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampusPage;