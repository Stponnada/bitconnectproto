// src/components/Header.tsx (Corrected)

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Ensure this path is correct
import { supabase } from '../services/supabase';
import { Profile } from '../types';

const Header: React.FC = () => {
    const { profile, signOut } = useAuth(); // Assuming useAuth provides the logged-in user's profile
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleSearch = async () => {
            if (searchTerm.trim().length < 2) {
                setSearchResults([]);
                return;
            }
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .or(`username.ilike.%${searchTerm.trim()}%,full_name.ilike.%${searchTerm.trim()}%`)
                .limit(5);
            setSearchResults(data || []);
        };
        const debounceTimer = setTimeout(() => handleSearch(), 300);
        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    const onResultClick = () => {
        setSearchTerm('');
        setSearchResults([]);
        setIsSearchFocused(false);
    }

    return (
        <header className="fixed top-0 left-0 right-0 bg-dark-secondary border-b border-dark-tertiary h-16 flex items-center justify-between px-6 z-40">
            <Link to="/" className="text-xl font-bold text-bits-red">BITS Connect</Link>
            
            <div className="relative w-full max-w-xs" ref={searchRef}>
                <input
                    type="text"
                    placeholder="Search users"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    className="w-full p-2 pl-10 bg-dark-tertiary border border-gray-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-bits-red"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                {isSearchFocused && searchTerm && (
                    <div className="absolute top-full mt-2 w-full bg-dark-secondary border border-dark-tertiary rounded-md shadow-lg overflow-hidden">
                        {searchResults.length > 0 ? (
                           searchResults.map(p => (
                             <Link to={`/profile/${p.username}`} key={p.user_id} onClick={onResultClick} className="flex items-center p-3 hover:bg-dark-tertiary">
                                <img src={p.avatar_url || `https://ui-avatars.com/api/?name=${p.username}`} alt={p.username} className="w-8 h-8 rounded-full object-cover" />
                                <div className="ml-3">
                                  <p className="text-sm font-semibold">{p.full_name}</p>
                                  <p className="text-xs text-gray-400">@{p.username}</p>
                                </div>
                             </Link>
                           ))
                        ) : <div className="p-3 text-sm text-gray-500">No results found.</div>}
                    </div>
                )}
            </div>

            <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)}>
                    <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username}&background=333&color=fff`} alt="profile" className="w-9 h-9 rounded-full object-cover" />
                </button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-secondary border border-dark-tertiary rounded-md shadow-lg py-1">
                        {profile && (
                            // THIS IS THE FIX: This link now points to your dynamic profile page
                            <Link to={`/profile/${profile.username}`} onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-tertiary">My Profile</Link>
                        )}
                        {/* THE REDUNDANT "EDIT PROFILE" LINK HAS BEEN REMOVED */}
                        <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-tertiary">Logout</button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;