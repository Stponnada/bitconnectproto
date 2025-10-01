import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { SearchResults as SearchResultsType } from '../types';
import Spinner from '../components/Spinner';

const BackIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const SearchPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResultsType | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const performSearch = async () => {
            if (searchTerm.trim().length < 2) {
                setResults(null);
                return;
            }
            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('search_all', { search_term: searchTerm.trim() });
                if (error) throw error;
                setResults(data);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    const hasResults = results && (results.users.length > 0 || results.posts.length > 0);

    return (
        <div className="fixed inset-0 bg-dark-primary z-50 flex flex-col">
            <header className="flex items-center p-2 border-b border-dark-tertiary flex-shrink-0">
                <button onClick={() => navigate(-1)} className="p-2 text-gray-300 rounded-full hover:bg-dark-tertiary">
                    <BackIcon className="w-6 h-6" />
                </button>
                <input
                    type="text"
                    placeholder="Search litelelo"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent p-2 text-white placeholder-gray-500 focus:outline-none"
                    autoFocus
                />
            </header>

            <main className="flex-1 overflow-y-auto">
                {loading && <div className="p-8 flex justify-center"><Spinner /></div>}
                
                {!loading && searchTerm.length > 1 && !hasResults && (
                    <p className="text-center text-gray-500 p-8">No results for "{searchTerm}"</p>
                )}

                {hasResults && (
                    <div>
                        {results.users.length > 0 && (
                             <div className="p-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase px-3 pt-2 pb-1">Users</h3>
                                <ul>
                                    {results.users.map(user => (
                                    <li key={user.username}>
                                        <Link to={`/profile/${user.username}`} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-dark-tertiary">
                                        <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                                        <div>
                                            <p className="font-semibold text-white text-sm">{user.full_name}</p>
                                            <p className="text-xs text-gray-400">@{user.username}</p>
                                        </div>
                                        </Link>
                                    </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {results.posts.length > 0 && (
                            <div className="p-2">
                                <h3 className="text-xs font-bold text-gray-400 uppercase px-3 pt-2 pb-1">Posts & Comments</h3>
                                <ul>
                                    {results.posts.map(post => (
                                    <li key={post.id}>
                                        <Link to={`/post/${post.id}`} className="block p-3 rounded-lg hover:bg-dark-tertiary">
                                        <p className="text-sm text-gray-300 truncate">"{post.content}"</p>
                                        <p className="text-xs text-gray-500 mt-1">by {post.author_full_name}</p>
                                        </Link>
                                    </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default SearchPage;