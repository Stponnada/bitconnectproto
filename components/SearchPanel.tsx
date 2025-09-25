import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import Spinner from './Spinner';

interface SearchPanelProps {
    onNavigate: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ onNavigate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleSearch = async () => {
            if (searchTerm.trim().length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .or(`username.ilike.%${searchTerm.trim()}%,full_name.ilike.%${searchTerm.trim()}%`)
                .limit(10);
            
            if (error) {
                console.error("Error searching profiles:", error);
            } else {
                setResults(data || []);
            }
            setLoading(false);
        };

        const debounceTimer = setTimeout(() => {
            handleSearch();
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-6 px-3">Search</h2>
            <div className="px-3">
                <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500"
                    autoFocus
                />
            </div>
            <hr className="border-gray-700 my-6" />
            <div className="flex-1 overflow-y-auto -mr-3 pr-3">
                {loading && <div className="flex justify-center"><Spinner /></div>}
                {!loading && results.length > 0 && (
                    <div className="space-y-2">
                        {results.map(profile => (
                            // FIX: Use `user_id` as the key, as `id` does not exist on the Profile type. `user_id` is a unique identifier for the profile.
                            <Link to={`/${profile.username}`} onClick={onNavigate} key={profile.user_id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800">
                                <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}&background=0D8ABC&color=fff&size=50`} alt={profile.username} className="w-11 h-11 rounded-full object-cover" />
                                <div>
                                    <p className="font-semibold text-sm">{profile.username}</p>
                                    <p className="text-xs text-gray-400">{profile.full_name}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                {!loading && searchTerm.length > 1 && results.length === 0 && (
                     <p className="text-gray-500 text-center px-3">No results found.</p>
                )}
            </div>
        </div>
    );
};

export default SearchPanel;