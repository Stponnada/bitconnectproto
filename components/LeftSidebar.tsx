// src/components/LeftSidebar.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { HomeIcon, BookOpenIcon, ChatIcon, UserIcon, LogoutIcon } from './icons';

// ... (MenuIcon remains the same)

interface LeftSidebarProps {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isExpanded, setIsExpanded }) => {
  const { profile } = useAuth(); // <-- MODIFIED: Use profile from context
  const username = profile?.username;
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  // ... (NavLink component remains the same) ...

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-dark-secondary border-r border-dark-tertiary z-30 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-60' : 'w-20'
      }`}
    >
      <div className="flex flex-col h-full p-3 pt-6">
        { /* ... button and nav items ... */ }
        <nav className="flex-grow mt-4">
          <NavLink to="/" icon={<HomeIcon className="w-7 h-7 flex-shrink-0" />} text="Home" />
          <NavLink to="/directory" icon={<BookOpenIcon className="w-7 h-7 flex-shrink-0" />} text="Directory" />
          <NavLink to="/chat" icon={<ChatIcon className="w-7 h-7 flex-shrink-0" />} text="Messages" />
          {username && (
            <NavLink to={`/profile/${username}`} icon={<UserIcon className="w-7 h-7 flex-shrink-0" />} text="Profile" />
          )}
        </nav>
        { /* ... logout button ... */ }
      </div>
    </aside>
  );
};

export default LeftSidebar;