// src/components/Header.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';
import { Profile, SearchResults as SearchResultsType } from '../types';
import SearchResults from './SearchResults';
import { SearchIcon, SunIcon, MoonIcon } from './icons';

interface HeaderProps {
    isSidebarExpanded: boolean;
}

const Header: React.FC<HeaderProps> = ({ isSidebarExpanded }) => {
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
    const { theme, toggleTheme } = useTheme();

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
        <header 
        className={`fixed top-0 right-0 bg-secondary-light dark:bg-secondary border-b border-tertiary-light dark:border-tertiary h-20 flex items-center justify-between px-4 md:px-6 z-20 transition-all duration-300 ease-in-out left-0 md:left-20 ${
            isSidebarExpanded ? 'md:left-60' : 'md:left-20'
        }`}
        >
            <div className="flex-shrink-0 hidden md:block">
                <Link to="/" className="text-4xl font-raleway font-black text-brand-green [text-shadow:-1px_-1px_0_rgba(0,0,0,0.7),_1px_1px_0_rgba(255,255,255,0.05)]">
                  litelelo.
                </Link>
            </div>
            
            <div ref={searchRef} className="relative w-full max-w-md mx-4 hidden md:block">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setIsSearchFocused(true)} className="w-full p-2.5 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-600 rounded-lg text-sm text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-green" />
              {isSearchFocused && searchTerm.length > 1 && (
                <SearchResults results={results} loading={loadingSearch} onNavigate={handleCloseSearch} />
              )}
            </div>
            
            <div className="flex items-center md:hidden">
              <Link to="/" className="text-4xl font-raleway font-black text-brand-green">litelelo.</Link>
            </div>

            <div className="flex items-center space-x-2">
                <Link to="/search" className="p-2 text-text-secondary-light dark:text-gray-300 rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary md:hidden">
                    <SearchIcon className="w-7 h-7" />
                </Link>

                <button onClick={toggleTheme} className="p-2 text-text-secondary-light dark:text-gray-300 rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary md:hidden">
                    {theme === 'light' ? <MoonIcon className="w-7 h-7" /> : <SunIcon className="w-7 h-7" />}
                </button>

                <div ref={dropdownRef} className="relative hidden md:block">
                    <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="font-bold text-text-main-light dark:text-white text-lg">{(profile?.full_name || 'U').charAt(0).toUpperCase()}</span>
                        )}
                    </button>
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-secondary-light dark:bg-secondary border border-tertiary-light dark:border-tertiary rounded-md shadow-lg py-1">
                            {profile?.username && (
                                <Link to={`/profile/${profile.username}`} onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary">
                                    Profile
                                </Link>
                            )}
                            <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-2 text-sm text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary">
                                <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                                {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                            </button>
                            <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-tertiary-light dark:hover:bg-tertiary">
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