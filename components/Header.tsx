// src/components/Header.tsx (Complete with new Logo)

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Profile, SearchResults as SearchResultsType } from '../types';
import SearchResults from './SearchResults';
import { BookOpenIcon } from './icons';

const Header: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResultsType | null>(null);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchHeaderProfile = async () => {
            if (user) {
                const { data, error } = await supabase.from('profiles').select('username, avatar_url, full_name').eq('user_id', user.id).single();
                if (error) console.error("Header could not fetch profile:", error);
                else setProfile(data);
            }
        };
        fetchHeaderProfile();
    }, [user]);

    useEffect(() => {
      const performSearch = async () => {
        if (searchTerm.trim().length < 2) {
          setResults(null);
          return;
        }
        setLoadingSearch(true);
        const { data, error } = await supabase.rpc('search_all', { search_term: searchTerm.trim() });
        if (error) console.error('Search error:', error);
        else setResults(data);
        setLoadingSearch(false);
      };
      const debounceTimer = setTimeout(() => { performSearch(); }, 300);
      return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) { setDropdownOpen(false); }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) { setIsSearchFocused(false); }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleCloseSearch = () => {
      setSearchTerm('');
      setResults(null);
      setIsSearchFocused(false);
    };

    return (
        <header className="fixed top-0 left-0 right-0 bg-dark-secondary border-b border-dark-tertiary h-20 flex items-center justify-between px-6 z-40">
            <div className="flex-shrink-0">
                {/* --- MODIFIED: Logo text and font classes updated --- */}
                <Link to="/" className="text-3xl font-raleway font-black text-brand-green">litelelo.</Link>
            </div>
            
            <div ref={searchRef} className="relative w-full max-w-md mx-4">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full p-2.5 bg-dark-tertiary border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
              {isSearchFocused && searchTerm.length > 1 && (
                <SearchResults results={results} loading={loadingSearch} onNavigate={handleCloseSearch} />
              )}
            </div>

            <div className="flex items-center space-x-4 flex-shrink-0">
                <nav>
                    <Link to="/directory" title="User Directory" className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-dark-tertiary transition-colors">
                        <BookOpenIcon className="w-7 h-7" />
                    </Link>
                </nav>

                <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="font-bold text-white text-lg">{(profile?.full_name || 'U').charAt(0).toUpperCase()}</span>
                        )}
                    </button>
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-dark-secondary border border-dark-tertiary rounded-md shadow-lg py-1">
                            {profile?.username && (
                                <Link to={`/profile/${profile.username}`} onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-tertiary">
                                    Profile
                                </Link>
                            )}
                            <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-tertiary">
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;