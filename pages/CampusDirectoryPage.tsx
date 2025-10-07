// src/pages/CampusDirectoryPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CampusPlace } from '../types';
import Spinner from '../components/Spinner';
import { StarIcon } from '../components/icons';

const PlaceCard: React.FC<{ place: CampusPlace }> = ({ place }) => (
    <Link to={`/campus/reviews/${place.id}`} className="block bg-secondary-light dark:bg-secondary rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-tertiary-light dark:border-tertiary">
        <img className="w-full h-48 object-cover" src={place.image_url || 'https://placehold.co/600x400/1e293b/3cfba2?text=Image'} alt={place.name} />
        <div className="p-4">
            <p className="text-xs text-brand-green font-semibold uppercase">{place.category}</p>
            <h3 className="text-xl font-bold mt-1 text-text-main-light dark:text-text-main">{place.name}</h3>
            <div className="flex items-center mt-2">
                <StarIcon className="w-5 h-5 text-yellow-400" />
                <span className="text-text-main-light dark:text-text-main font-bold ml-1">{place.avg_rating.toFixed(1)}</span>
                <span className="text-text-tertiary-light dark:text-text-tertiary ml-2">({place.review_count} reviews)</span>
            </div>
        </div>
    </Link>
);


const CampusDirectoryPage: React.FC = () => {
    const { profile } = useAuth();
    const [places, setPlaces] = useState<CampusPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
    
    // Group places by location
    const groupedPlaces = useMemo(() => {
        return places.reduce((acc, place) => {
            const location = place.location || 'Other';
            if (!acc[location]) {
                acc[location] = [];
            }
            acc[location].push(place);
            return acc;
        }, {} as Record<string, CampusPlace[]>);
    }, [places]);

    if (loading) {
        return <div className="text-center p-8"><Spinner /></div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-400">Error: {error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-text-main-light dark:text-text-main">Campus Places</h1>
            <p className="mt-2 text-lg text-text-secondary-light dark:text-text-secondary">Review your favorite spots at BITS Hyderabad.</p>
            
            <div className="mt-8 space-y-12">
                {Object.keys(groupedPlaces).length > 0 ? (
                    Object.entries(groupedPlaces).map(([location, placesInLocation]) => (
                        <div key={location}>
                            <h2 className="text-2xl font-semibold border-b-2 border-brand-green pb-2 mb-6 text-text-main-light dark:text-text-main">{location}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {placesInLocation.map(place => <PlaceCard key={place.id} place={place} />)}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-center text-text-tertiary-light dark:text-text-tertiary py-16">No places found for this campus yet.</p>
                )}
            </div>
        </div>
    );
};

export default CampusDirectoryPage;