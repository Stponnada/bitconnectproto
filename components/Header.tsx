// src/components/Header.tsx (Simple and Correct)

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Ensure this path is correct
import { supabase } from '../services/supabase';

const Header: React.FC = () => {
    // We still need the profile to get the username for the URL
    const { profile } = useAuth();
    
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 bg-dark-secondary border-b border-dark-tertiary h-16 flex items-center justify-between px-6 z-40">
            <Link to="/" className="text-xl font-bold text-bits-red">BITS Connect</Link>
            
            {/* Your Search Bar can go here */}
            <div className="w-full max-w-xs"></div>

            <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span className="font-bold text-white">
                            {(profile?.full_name || profile?.username || 'U').charAt(0).toUpperCase()}
                        </span>
                    )}
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-secondary border border-dark-tertiary rounded-md shadow-lg py-1">
                        
                        {/* ================================================================== */}
                        {/* THE NEW BUTTON IS HERE - Simple and Direct */}
                        {/* ================================================================== */}
                        {profile?.username && (
                            <Link 
                                to={`/profile/${profile.username}`} 
                                onClick={() => setDropdownOpen(false)} 
                                className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-tertiary"
                            >
                                Profile
                            </Link>
                        )}
                        
                        <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-tertiary">
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;