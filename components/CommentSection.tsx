import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Comment as CommentType } from '../types';
import Spinner from './Spinner';
import { Link } from 'react-router-dom';

interface CommentSectionProps {
    postId: number;
    onCommentPosted: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, onCommentPosted }) => {
    const { user, profile } = useAuth();
    const [comments, setComments] = useState<CommentType[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        const fetchComments = async () => {
            const { data, error } = await supabase
                .from('comments')
                .select('*, profiles(username, full_name, avatar_url)')
                .eq('post_id', postId)
                .order('created_at', { ascending: true });
            
            if (error) {
                console.error('Error fetching comments:', error);
            } else {
                setComments(data as any);
            }
            setLoading(false);
        };
        fetchComments();
    }, [postId]);

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;
        setPosting(true);
        const { data, error } = await supabase
            .from('comments')
            .insert({
                content: newComment,
                user_id: user.id,
                post_id: postId
            })
            .select('*, profiles(username, full_name, avatar_url)')
            .single();
        
        if (error) {
            console.error('Error posting comment:', error);
        } else if (data) {
            setComments(prev => [...prev, data as any]);
            setNewComment('');
            onCommentPosted();
        }
        setPosting(false);
    };

    return (
        <div className="border-t border-dark-tertiary mt-2 p-4">
            <form onSubmit={handlePostComment} className="flex items-center space-x-3">
                <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username}`} alt="your avatar" className="w-8 h-8 rounded-full object-cover" />
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 p-2 bg-dark-tertiary border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-bits-red"
                />
                <button type="submit" disabled={posting || !newComment.trim()} className="text-bits-red font-semibold disabled:text-gray-500">
                    {posting ? <Spinner isRed/> : 'Post'}
                </button>
            </form>
            <div className="mt-4 space-y-3">
                {loading ? (
                    <Spinner isRed/>
                ) : (
                    comments.map(comment => (
                        // FIX: Add a null check for comment.profiles to handle cases where the author's profile might not exist.
                        <div key={comment.id} className="flex items-start space-x-3 text-sm">
                             {comment.profiles ? (
                                <Link to={`/${comment.profiles.username}`}>
                                    <img src={comment.profiles.avatar_url || `https://ui-avatars.com/api/?name=${comment.profiles.username}`} alt="commenter avatar" className="w-8 h-8 rounded-full object-cover" />
                                </Link>
                             ) : (
                                <img src={`https://ui-avatars.com/api/?name=D`} alt="commenter avatar" className="w-8 h-8 rounded-full object-cover" />
                             )}
                             <div className="flex-1 bg-dark-tertiary p-2 rounded-lg">
                                {comment.profiles ? (
                                    <Link to={`/${comment.profiles.username}`} className="font-semibold text-white mr-2">{comment.profiles.username}</Link>
                                ) : (
                                    <span className="font-semibold text-gray-400 mr-2">Deleted User</span>
                                )}
                                <span className="text-gray-300">{comment.content}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommentSection;
