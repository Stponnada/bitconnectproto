// src/components/Header.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Profile } from '../types';

const Header: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchHeaderProfile = async () => {
            if (user) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('username, avatar_url, full_name')
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
    }, [user]);

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
        // CHANGE #1: Increased header height from h-16 to h-20 for a wider/taller feel
        <header className="fixed top-0 left-0 right-0 bg-dark-secondary border-b border-dark-tertiary h-20 flex items-center justify-between px-6 z-40">
            
            {/* CHANGE #2: Increased logo font size from text-xl to text-2xl */}
            <Link to="/" className="text-3xl font-bold text-bits-red">BITS Connect</Link>
            
            <div className="w-full max-w-xs">{/* Your Search Bar can go here */}</div>

            <div className="relative" ref={dropdownRef}>
                {/* CHANGE #3: Increased button size from w-10 h-10 to w-12 h-12 */}
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        // CHANGE #4: Increased font size for the initial to look better in the larger circle
                        <span className="font-bold text-white text-lg">
                            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                        </span>
                    )}
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-secondary border border-dark-tertiary rounded-md shadow-lg py-1">
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