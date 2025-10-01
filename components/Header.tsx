import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Profile, SearchResults as SearchResultsType } from '../types';
import SearchResults from './SearchResults';
// Removed BookOpenIcon and ChatIcon imports as they are no longer used here

const Header: React.FC = () => {
    // ... (all the existing state and logic remains the same) ...
    // ... useEffects, handleSignOut, etc. ...

    return (
        // The z-index is increased to ensure the header is above the new sidebar
        <header className="fixed top-0 left-0 right-0 bg-dark-secondary border-b border-dark-tertiary h-20 flex items-center justify-between px-6 z-40">
            <div className="flex-shrink-0">
                <Link 
                  to="/" 
                  className="text-4xl font-raleway font-black text-brand-green [text-shadow:-1px_-1px_0_rgba(0,0,0,0.7),_1px_1px_0_rgba(255,255,255,0.05)]"
                >
                  litelelo.
                </Link>
            </div>
            
            <div ref={searchRef} className="relative w-full max-w-md mx-4">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => setIsSearchFocused(true)} className="w-full p-2.5 bg-dark-tertiary border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green" />
              {isSearchFocused && searchTerm.length > 1 && (
                <SearchResults results={results} loading={loadingSearch} onNavigate={handleCloseSearch} />
              )}
            </div>

            <div className="flex items-center space-x-4 flex-shrink-0">
                {/* --- THIS <nav> SECTION HAS BEEN REMOVED --- */}

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