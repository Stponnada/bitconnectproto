// src/components/ListingCard.tsx

import React from 'react';
import { MarketplaceListing } from '../types';

interface ListingCardProps {
    listing: MarketplaceListing;
    onClick: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
    return (
        <div 
            onClick={onClick} 
            className="group cursor-pointer bg-secondary-light dark:bg-secondary rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-tertiary-light dark:border-tertiary flex flex-col"
        >
            <div className="relative w-full aspect-square overflow-hidden">
                <img 
                    src={listing.primary_image_url || 'https://placehold.co/400x400/1e293b/3cfba2?text=No+Image'} 
                    alt={listing.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-text-main-light dark:text-text-main text-lg truncate group-hover:text-brand-green">{listing.title}</h3>
                <p className="text-sm text-text-tertiary-light dark:text-text-tertiary mt-1">{listing.category}</p>
                <p className="mt-auto text-xl font-semibold text-brand-green pt-2">₹{listing.price.toLocaleString()}</p>
            </div>
        </div>
    );
};

export default ListingCard;