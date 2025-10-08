// src/components/RateSellerModal.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Profile } from '../types';
import Spinner from './Spinner';
import { XCircleIcon, StarIcon } from './icons';

interface RateSellerModalProps {
    sellerProfile: Profile;
    onClose: () => void;
    onRatingSuccess: () => void; // To refetch profile data
}

const StarRatingInput: React.FC<{ rating: number; onRatingChange: (rating: number) => void }> = ({ rating, onRatingChange }) => {
    return (
        <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onRatingChange(star)}
                    className="transition-transform transform hover:scale-110"
                >
                    <StarIcon className={`w-10 h-10 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400 dark:text-gray-600'}`} />
                </button>
            ))}
        </div>
    );
};

const RateSellerModal: React.FC<RateSellerModalProps> = ({ sellerProfile, onClose, onRatingSuccess }) => {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchExistingRating = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('seller_ratings')
                .select('rating, comment')
                .eq('rater_id', user.id)
                .eq('seller_id', sellerProfile.user_id)
                .single();
            
            if (data) {
                setRating(data.rating);
                setComment(data.comment || '');
            }
            if (error && error.code !== 'PGRST116') { // Ignore 'no rows found' error
                console.error("Error fetching existing rating:", error);
            }
        };
        fetchExistingRating();
    }, [user, sellerProfile.user_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || rating === 0) {
            setError('Please select a rating (1-5 stars).');
            return;
        }
        setIsSubmitting(true);
        setError(null);

        try {
            const { error: upsertError } = await supabase
                .from('seller_ratings')
                .upsert({
                    rater_id: user.id,
                    seller_id: sellerProfile.user_id,
                    rating,
                    comment
                }, { onConflict: 'rater_id, seller_id' });
            
            if (upsertError) throw upsertError;

            onRatingSuccess(); // This will trigger a refetch on the profile page
            onClose();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6">
                    <header className="flex items-center justify-between pb-4">
                        <h2 className="text-xl font-bold">Rate {sellerProfile.full_name}</h2>
                        <button type="button" onClick={onClose}><XCircleIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" /></button>
                    </header>
                    
                    <div className="mt-4 space-y-6">
                        <StarRatingInput rating={rating} onRatingChange={setRating} />
                        <div>
                            <label className="block text-sm font-medium">Comment (Optional)</label>
                            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className="mt-1 w-full p-2 bg-tertiary-light dark:bg-tertiary rounded border border-tertiary-light dark:border-gray-600" />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                    
                    <footer className="flex justify-end space-x-4 pt-6 mt-4 border-t border-tertiary-light dark:border-tertiary">
                        <button type="button" onClick={onClose} className="py-2 px-6 rounded-full hover:bg-tertiary-light/60 dark:hover:bg-tertiary">Cancel</button>
                        <button type="submit" disabled={isSubmitting || rating === 0} className="py-2 px-6 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50">
                            {isSubmitting ? <Spinner /> : 'Submit Rating'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default RateSellerModal;