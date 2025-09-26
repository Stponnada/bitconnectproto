import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Ensure this path is correct for your project
import { supabase } from '../services/supabase';
import { Profile } from '../types';

const Header: React.FC = () => {
    // We get the user's profile from our context to display their avatar and link
    const { profile } = useAuth();
    
    // We get the navigate function from React Router to redirect the user
    const navigate = useNavigate();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ==================================================================
    // THE FIX IS HERE: This is the function that handles logging out.
    // ==================================================================
    const handleSignOut = async () => {
        // Step 1: Tell Supabase to sign the user out.
        await supabase.auth.signOut();
        
        // Step 2: Navigate the user back to the login page.
        navigate('/login');
    };

    // This is a nice-to-have feature that closes the dropdown when you click elsewhere
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Your search bar logic can go here if you add it back later

    return (
        <header className="fixed top-0 left-0 right-0 bg-dark-secondary border-b border-dark-tertiary h-16 flex items-center justify-between px-6 z-40">
            <Link to="/" className="text-xl font-bold text-bits-red">BITS Connect</Link>
            
            {/* --- Your Search Bar JSX would go here --- */}
            <div className="w-full max-w-xs">
                {/* <input type="text" placeholder="Search..." /> */}
            </div>

            <div className="relative" ref={dropdownRef}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span className="font-bold text-white">
                            {/* Display the first letter of the user's full name or username */}
                            {(profile?.full_name || profile?.username || 'U').charAt(0).toUpperCase()}
                        </span>
                    )}
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-secondary border border-dark-tertiary rounded-md shadow-lg py-1">
                        {profile && (
                            <Link to={`/profile/${profile.username}`} onClick={() => setDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-tertiary">
                                My Profile
                            </Link>
                        )}
                        
                        {/* THE FIX IS HERE: The onClick handler is now attached to this button */}
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