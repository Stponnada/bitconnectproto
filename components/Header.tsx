// src/components/Header.tsx (Final, Corrected, and Self-Sufficient)

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // We still need this to get the logged-in user
import { supabase } from '../services/supabase';
import { Profile } from '../types'; // Import your Profile type

const Header: React.FC = () => {
    // 1. Get the core authenticated user object from the context.
    //    This gives us the user's ID.
    const { user } = useAuth();
    
    // 2. The Header will manage its own profile state.
    const [profile, setProfile] = useState<Profile | null>(null);
    
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ==================================================================
    // THE FIX IS HERE:
    // 3. This useEffect makes the Header fetch its own data.
    //    It runs whenever the user logs in or out.
    // ==================================================================
    useEffect(() => {
        const fetchHeaderProfile = async () => {
            if (user) {
                // Use the user's ID to fetch their username and avatar from the public profiles table.
                const { data, error } = await supabase
                    .from('profiles')
                    .select('username, avatar_url, full_name') // We only need these for the header
                    .eq('user_id', user.id)
                    .single();

                if (error) {
                    console.error("Header could not fetch the user's profile:", error);
                } else {
                    setProfile(data);
                }
            }
        };
        fetchHeaderProfile();
    }, [user]); // This dependency array ensures the code re-runs on login/logout.

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    // This useEffect handles closing the dropdown menu
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
            
            <div className="w-full max-w-xs">{/* Your Search Bar can go here */}</div>

            <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span className="font-bold text-white">
                            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                        </span>
                    )}
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-secondary border border-dark-tertiary rounded-md shadow-lg py-1">
                        
                        {/* 4. This link will now appear as soon as the profile is fetched. */}
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