// src/pages/PlaceDetailPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CampusPlace, Review as ReviewType, Profile } from '../types';
import Spinner from '../components/Spinner';
import { StarIcon } from '../components/icons';
import { formatTimestamp } from '../utils/timeUtils';

// Star Rating Component
const StarRating: React.FC<{ rating: number; onRatingChange?: (rating: number) => void }> = ({ rating, onRatingChange }) => {
    return (
        <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onRatingChange?.(star)}
                    className={`transition-colors ${onRatingChange ? 'cursor-pointer' : ''}`}
                >
                    <StarIcon className={`w-6 h-6 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400 dark:text-gray-600'}`} />
                </button>
            ))}
        </div>
    );
};


// Review Card Component
const ReviewCard: React.FC<{ review: ReviewType, onDelete: (reviewId: string) => void }> = ({ review, onDelete }) => {
    const { user } = useAuth();
    const author = review.profiles;
    
    return (
        <div className="bg-secondary-light dark:bg-secondary p-4 rounded-lg border border-tertiary-light dark:border-tertiary">
            <div className="flex items-start space-x-3">
                <Link to={`/profile/${author?.username}`}>
                    <img src={author?.avatar_url || ''} alt={author?.username} className="w-10 h-10 rounded-full object-cover" />
                </Link>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <Link to={`/profile/${author?.username}`} className="font-bold hover:underline">{author?.full_name}</Link>
                            <p className="text-sm text-text-tertiary-light dark:text-text-tertiary">@{author?.username}</p>
                        </div>
                        <div className="text-xs text-text-tertiary-light dark:text-text-tertiary">{formatTimestamp(review.created_at)}</div>
                    </div>
                    <div className="my-2"><StarRating rating={review.rating} /></div>
                    <p className="text-text-secondary-light dark:text-text-secondary whitespace-pre-wrap">{review.comment}</p>
                </div>
            </div>
            {user?.id === review.user_id && (
                <div className="flex justify-end mt-2">
                    <button onClick={() => onDelete(review.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </div>
            )}
        </div>
    );
};


const PlaceDetailPage: React.FC = () => {
    const { placeId } = useParams<{ placeId: string }>();
    const { user, profile } = useAuth();

    const [place, setPlace] = useState<CampusPlace | null>(null);
    const [reviews, setReviews] = useState<ReviewType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fetchPlaceAndReviews = useCallback(async () => {
        if (!placeId || !profile?.campus) return;
        setLoading(true);
        setError(null);

        try {
            const placePromise = supabase.rpc('get_campus_places_with_ratings', { p_campus: profile.campus })
                .eq('id', placeId)
                .single();
                
            const reviewsPromise = supabase.from('reviews')
                .select('*, profiles(*)')
                .eq('place_id', placeId)
                .order('created_at', { ascending: false });

            const [placeResult, reviewsResult] = await Promise.all([placePromise, reviewsPromise]);

            if (placeResult.error) throw placeResult.error;
            if (reviewsResult.error) throw reviewsResult.error;

            setPlace(placeResult.data as CampusPlace);
            setReviews(reviewsResult.data as any[] || []);
            
            const userReview = (reviewsResult.data || []).find(r => r.user_id === user?.id);
            if(userReview) {
                setUserRating(userReview.rating);
                setUserComment(userReview.comment || '');
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [placeId, user?.id, profile?.campus]);

    useEffect(() => {
        fetchPlaceAndReviews();
    }, [fetchPlaceAndReviews]);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !placeId || userRating === 0) return;
        setIsSubmitting(true);

        try {
            const { error } = await supabase.from('reviews').upsert({
                place_id: placeId,
                user_id: user.id,
                rating: userRating,
                comment: userComment
            }, { onConflict: 'place_id, user_id' });

            if (error) throw error;
            await fetchPlaceAndReviews(); // Refetch everything to update averages and list
        } catch (err: any) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteReview = async (reviewId: string) => {
        if (!window.confirm("Are you sure you want to delete your review?")) return;
        
        try {
            const { error } = await supabase.from('reviews').delete().match({ id: reviewId, user_id: user?.id });
            if (error) throw error;
            
            setUserRating(0);
            setUserComment('');
            await fetchPlaceAndReviews(); // Refetch to update list and averages
        } catch (err: any) {
            console.error("Failed to delete review:", err);
        }
    }

    if (loading) return <div className="text-center p-8"><Spinner /></div>;
    if (error || !place) return <div className="text-center p-8 text-red-400">Error: {error || "Place not found."}</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-secondary-light dark:bg-secondary p-6 rounded-lg shadow-lg border border-tertiary-light dark:border-tertiary">
                <img src={place.image_url || ''} alt={place.name} className="w-full h-64 object-cover rounded-md" />
                <h1 className="text-4xl font-bold mt-4 text-text-main-light dark:text-text-main">{place.name}</h1>
                <p className="text-brand-green font-semibold">{place.category}</p>
                <div className="flex items-center mt-2">
                    <StarIcon className="w-6 h-6 text-yellow-400" />
                    <span className="text-xl text-text-main-light dark:text-text-main font-bold ml-1">{place.avg_rating.toFixed(1)}</span>
                    <span className="text-text-tertiary-light dark:text-text-tertiary ml-2">from {place.review_count} reviews</span>
                </div>
            </div>

            <div className="mt-8 bg-secondary-light dark:bg-secondary p-6 rounded-lg border border-tertiary-light dark:border-tertiary">
                <h2 className="text-2xl font-bold mb-4">Leave a Review</h2>
                <form onSubmit={handleSubmitReview}>
                    <StarRating rating={userRating} onRatingChange={setUserRating} />
                    <textarea 
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        placeholder="Share your experience..."
                        className="w-full mt-4 p-3 bg-tertiary-light dark:bg-tertiary rounded-md border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green"
                        rows={4}
                    />
                    <div className="flex justify-end mt-4">
                        <button type="submit" disabled={isSubmitting || userRating === 0} className="bg-brand-green text-black font-bold py-2 px-6 rounded-full hover:bg-brand-green-darker transition-colors disabled:opacity-50">
                            {isSubmitting ? <Spinner /> : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">All Reviews ({reviews.length})</h2>
                <div className="space-y-4">
                    {reviews.length > 0 ? (
                        reviews.map(review => <ReviewCard key={review.id} review={review} onDelete={handleDeleteReview} />)
                    ) : (
                        <p className="text-center text-text-tertiary-light dark:text-text-tertiary py-10">Be the first to review this place!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaceDetailPage;