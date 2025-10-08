// src/pages/CampusDirectoryPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CampusPlace } from '../types';
import Spinner from '../components/Spinner';
import { StarIcon } from '../components/icons';

const PlaceCard: React.FC<{ place: CampusPlace }> = ({ place }) => {
    const ratingColor = place.avg_rating >= 4.5 ? 'text-green-500' : place.avg_rating >= 3.5 ? 'text-yellow-500' : 'text-orange-500';
    
    return (
        <Link 
            to={`/campus/reviews/${place.id}`} 
            className="group block bg-gradient-to-br from-secondary-light to-primary-light dark:from-secondary dark:to-primary rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-tertiary-light/30 dark:border-tertiary/30 hover:-translate-y-2"
        >
            <div className="relative overflow-hidden">
                <img 
                    className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-110" 
                    src={place.image_url || 'https://placehold.co/600x400/1e293b/3cfba2?text=Image'} 
                    alt={place.name} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                    <span className="px-3 py-1.5 bg-brand-green/95 backdrop-blur-sm text-black text-xs font-bold uppercase tracking-wide rounded-lg shadow-lg">
                        {place.category}
                    </span>
                </div>
                
                {/* Rating Badge */}
                <div className="absolute top-3 right-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-1.5">
                    <StarIcon className={`w-4 h-4 ${ratingColor} fill-current`} />
                    <span className={`font-bold text-sm ${ratingColor}`}>
                        {place.avg_rating.toFixed(1)}
                    </span>
                </div>
            </div>
            
            <div className="p-5">
                <h3 className="text-xl font-bold text-text-main-light dark:text-text-main group-hover:text-brand-green transition-colors line-clamp-1">
                    {place.name}
                </h3>
                
                <div className="flex items-center mt-3 text-sm">
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <StarIcon 
                                key={i}
                                className={`w-4 h-4 ${
                                    i < Math.floor(place.avg_rating) 
                                        ? `${ratingColor} fill-current` 
                                        : 'text-gray-300 dark:text-gray-600'
                                }`}
                            />
                        ))}
                    </div>
                    <span className="ml-2 text-text-tertiary-light dark:text-text-tertiary font-medium">
                        {place.review_count} {place.review_count === 1 ? 'review' : 'reviews'}
                    </span>
                </div>
                
                {/* View Details Arrow */}
                <div className="flex items-center gap-2 mt-4 text-brand-green font-semibold text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1">
                    <span>View details</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </Link>
    );
};

const CampusDirectoryPage: React.FC = () => {
    const { profile } = useAuth();
    const [places, setPlaces] = useState<CampusPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        if (!profile?.campus) return;

        const fetchPlaces = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: rpcError } = await supabase.rpc('get_campus_places_with_ratings', { p_campus: profile.campus });
                if (rpcError) throw rpcError;
                setPlaces(data as CampusPlace[] || []);
            } catch (err: any) {
                console.error("Error fetching places:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPlaces();
    }, [profile?.campus]);
    
    // Get unique categories
    const categories = useMemo(() => {
        const cats = Array.from(new Set(places.map(p => p.category))).sort();
        return ['all', ...cats];
    }, [places]);
    
    // Filter places by search and category
    const filteredPlaces = useMemo(() => {
        return places.filter(place => {
            const matchesSearch = place.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || place.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [places, searchTerm, selectedCategory]);
    
    // Group places by location
    const groupedPlaces = useMemo(() => {
        return filteredPlaces.reduce((acc, place) => {
            const location = place.location || 'Other';
            if (!acc[location]) {
                acc[location] = [];
            }
            acc[location].push(place);
            return acc;
        }, {} as Record<string, CampusPlace[]>);
    }, [filteredPlaces]);
    
    // Calculate stats
    const stats = useMemo(() => {
        const totalPlaces = places.length;
        const totalReviews = places.reduce((sum, place) => sum + place.review_count, 0);
        const avgRating = places.length > 0 
            ? places.reduce((sum, place) => sum + place.avg_rating, 0) / places.length 
            : 0;
        
        return { totalPlaces, totalReviews, avgRating };
    }, [places]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-red-600 dark:text-red-400 font-semibold text-lg">Error loading places</p>
                    <p className="text-red-500 dark:text-red-500 text-sm mt-2">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Hero Header */}
            <div className="mb-8 bg-gradient-to-br from-brand-green/10 via-brand-green/5 to-transparent dark:from-brand-green/20 dark:via-brand-green/10 dark:to-transparent rounded-3xl p-8 shadow-lg border border-brand-green/20 dark:border-brand-green/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-green/5 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-green to-brand-green/80 flex items-center justify-center shadow-xl">
                            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-5xl font-bold text-text-main-light dark:text-text-main">Campus Places</h1>
                            <p className="mt-2 text-lg text-text-secondary-light dark:text-text-secondary">
                                Discover and review the best spots at BITS Hyderabad
                            </p>
                        </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-tertiary-light/30 dark:border-tertiary/30">
                            <p className="text-2xl font-bold text-brand-green">{stats.totalPlaces}</p>
                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary font-medium uppercase tracking-wide">Places</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-tertiary-light/30 dark:border-tertiary/30">
                            <p className="text-2xl font-bold text-brand-green">{stats.totalReviews}</p>
                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary font-medium uppercase tracking-wide">Reviews</p>
                        </div>
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-tertiary-light/30 dark:border-tertiary/30">
                            <div className="flex items-center gap-1">
                                <StarIcon className="w-5 h-5 text-yellow-500 fill-current" />
                                <p className="text-2xl font-bold text-brand-green">{stats.avgRating.toFixed(1)}</p>
                            </div>
                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary font-medium uppercase tracking-wide">Avg Rating</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="mb-8 bg-gradient-to-br from-secondary-light to-primary-light dark:from-secondary dark:to-primary rounded-2xl p-6 shadow-lg border border-tertiary-light/30 dark:border-tertiary/30">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search for places..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-5 py-3 pl-12 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-tertiary-light/50 dark:border-gray-600/50 text-text-main-light dark:text-text-main placeholder:text-text-tertiary-light dark:placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all"
                        />
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary-light dark:text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary-light dark:text-text-tertiary hover:text-text-main-light dark:hover:text-text-main transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    
                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin scrollbar-thumb-tertiary-light dark:scrollbar-thumb-tertiary scrollbar-track-transparent">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-5 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                                    selectedCategory === category
                                        ? 'bg-gradient-to-r from-brand-green to-brand-green/90 text-black shadow-lg shadow-brand-green/30'
                                        : 'bg-white/40 dark:bg-gray-800/40 text-text-secondary-light dark:text-text-secondary hover:bg-white/60 dark:hover:bg-gray-800/60'
                                }`}
                            >
                                {category === 'all' ? 'All Places' : category}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Results count */}
                {(searchTerm || selectedCategory !== 'all') && (
                    <div className="mt-4 pt-4 border-t border-tertiary-light/40 dark:border-tertiary/40">
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary">
                            Found <span className="font-bold text-brand-green">{filteredPlaces.length}</span> {filteredPlaces.length === 1 ? 'place' : 'places'}
                            {searchTerm && <> matching "<span className="font-semibold">{searchTerm}</span>"</>}
                            {selectedCategory !== 'all' && <> in <span className="font-semibold">{selectedCategory}</span></>}
                        </p>
                    </div>
                )}
            </div>
            
            {/* Places Grid */}
            <div className="space-y-12">
                {Object.keys(groupedPlaces).length > 0 ? (
                    Object.entries(groupedPlaces).map(([location, placesInLocation]) => (
                        <div key={location} className="animate-fade-in">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-green/20 to-brand-green/10 dark:from-brand-green/30 dark:to-brand-green/20 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-3xl font-bold text-text-main-light dark:text-text-main">{location}</h2>
                                    <div className="h-1 bg-gradient-to-r from-brand-green to-transparent rounded-full mt-2"></div>
                                </div>
                                <span className="px-4 py-2 bg-brand-green/10 dark:bg-brand-green/20 rounded-xl text-brand-green font-bold text-sm">
                                    {placesInLocation.length} {placesInLocation.length === 1 ? 'place' : 'places'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {placesInLocation.map(place => <PlaceCard key={place.id} place={place} />)}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-tertiary-light/50 to-tertiary-light/20 dark:from-tertiary/50 dark:to-tertiary/20 flex items-center justify-center mb-6">
                            <svg className="w-12 h-12 text-text-tertiary-light dark:text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className="text-text-secondary-light dark:text-text-secondary text-xl font-medium mb-2">
                            {searchTerm || selectedCategory !== 'all' ? 'No places found' : 'No places available yet'}
                        </p>
                        <p className="text-text-tertiary-light dark:text-text-tertiary text-sm">
                            {searchTerm || selectedCategory !== 'all' 
                                ? 'Try adjusting your search or filters' 
                                : 'Check back later for new places'}
                        </p>
                        {(searchTerm || selectedCategory !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedCategory('all');
                                }}
                                className="mt-6 px-6 py-3 bg-gradient-to-r from-brand-green to-brand-green/90 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-green/30 transition-all"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampusDirectoryPage;