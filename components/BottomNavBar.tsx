// src/components/BottomNavBar.tsx

import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat.ts';
import { supabase } from '../services/supabase';
// --- STEP 1: Import the BookOpenIcon ---
import { HomeIcon, BuildingLibraryIcon, ChatIcon, UserIcon, BookOpenIcon } from './icons';

const BottomNavBar: React.FC = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const { totalUnreadCount } = useChat();

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
  const inactiveLinkStyle = 'text-text-tertiary-light dark:text-text-tertiary';

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-secondary-light dark:bg-secondary border-t border-tertiary-light dark:border-tertiary z-30 flex md:hidden">
      <NavLink 
        to="/" 
        end
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <HomeIcon className="w-7 h-7" />
      </NavLink>
      <NavLink 
        to="/campus" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <BuildingLibraryIcon className="w-7 h-7" />
      </NavLink>
      <NavLink 
        to="/chat" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <div className="relative">
          <ChatIcon className="w-7 h-7" />
          {totalUnreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-brand-green ring-2 ring-secondary-light dark:ring-secondary" />}
        </div>
      </NavLink>

      {/* --- STEP 2: Add the NavLink for the Directory --- */}
      <NavLink 
        to="/directory" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <BookOpenIcon className="w-7 h-7" />
      </NavLink>

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