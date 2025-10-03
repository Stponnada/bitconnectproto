// src/components/BottomNavBar.tsx

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { HomeIcon, BookOpenIcon, ChatIcon, UserIcon } from './icons'; // <-- MODIFIED: Swapped SearchIcon for UserIcon

const BottomNavBar: React.FC = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);

  // <-- NEW: Fetch username to create the correct profile link
  useEffect(() => {
    const fetchUsername = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .single();
        if (data) setUsername(data.username);
      }
    };
    fetchUsername();
  }, [user]);

  const activeLinkStyle = 'text-brand-green';
  const inactiveLinkStyle = 'text-gray-400';

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-dark-secondary border-t border-dark-tertiary z-30 flex md:hidden">
      <NavLink 
        to="/" 
        end
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <HomeIcon className="w-7 h-7" />
      </NavLink>
      <NavLink 
        to="/directory" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <BookOpenIcon className="w-7 h-7" />
      </NavLink>
      <NavLink 
        to="/chat" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <ChatIcon className="w-7 h-7" />
      </NavLink>
      {/* <-- MODIFIED: This now links to the user's profile page */}
      {username && (
        <NavLink 
          to={`/profile/${username}`} 
          className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
        >
          <UserIcon className="w-7 h-7" />
        </NavLink>
      )}
    </nav>
  );
};

export default BottomNavBar;