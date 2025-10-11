// src/components/LeftSidebar.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';
import {
  HomeIcon,
  BookOpenIcon,
  ChatIcon,
  UserIcon,
  LogoutIcon,
  SunIcon,
  MoonIcon,
  BuildingLibraryIcon,
} from './icons';

const MenuIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

interface LeftSidebarProps {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    username: string | null;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isExpanded, setIsExpanded, username }) => {
  const navigate = useNavigate();
  const { totalUnreadCount } = useChat();
  const { theme, toggleTheme } = useTheme(); 

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const NavLink: React.FC<{ to: string; icon: React.ReactNode; text: string }> = ({ to, icon, text }) => (
    <Link
      to={to}
      className="flex items-center p-3 my-1 space-x-4 rounded-lg text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary hover:text-text-main-light dark:hover:text-text-main transition-colors duration-200"
    >
      {icon}
      <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
        {text}
      </span>
    </Link>
  );

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-gray-100 dark:bg-secondary border-r border-tertiary-light dark:border-tertiary z-30 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-60' : 'w-20'
      }`}
    >
      <div className="flex flex-col h-full p-3 pt-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center p-3 mb-4 space-x-4 rounded-lg text-text-main-light dark:text-text-main hover:bg-tertiary-light dark:hover:bg-tertiary"
        >
          <MenuIcon className="w-7 h-7 flex-shrink-0" />
        </button>

        <nav className="flex-grow mt-4">
          {/* 1st: Home Icon */}
          <NavLink to="/" icon={<HomeIcon className="w-7 h-7 flex-shrink-0" />} text="Home" />
          
          {/* 2nd: Campus Icon */}
          <NavLink to="/campus" icon={<BuildingLibraryIcon className="w-7 h-7 flex-shrink-0" />} text="Campus" />
          
          {/* 3rd: Chat Icon (Messages) */}
          <NavLink
            to="/chat"
            icon={
              <div className="relative">
                <ChatIcon className="w-7 h-7 flex-shrink-0" />
                {totalUnreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-brand-green ring-2 ring-secondary-light dark:ring-secondary" />}
              </div>
            }
            text="Messages"
          />

          {/* 4th: Directory Icon */}
          <NavLink to="/directory" icon={<BookOpenIcon className="w-7 h-7 flex-shrink-0" />} text="Directory" />
          
          {/* 5th: Profile Icon */}
          {username && (
            <NavLink to={`/profile/${username}`} icon={<UserIcon className="w-7 h-7 flex-shrink-0" />} text="Profile" />
          )}
        </nav>

        <div className="mt-auto">
           <button
            onClick={toggleTheme}
            className="flex items-center w-full p-3 space-x-4 rounded-lg text-text-secondary-light dark:text-text-secondary hover:bg-tertiary-light dark:hover:bg-tertiary hover:text-text-main-light dark:hover:text-text-main transition-colors duration-200"
          >
            {theme === 'light' ? <MoonIcon className="w-7 h-7 flex-shrink-0" /> : <SunIcon className="w-7 h-7 flex-shrink-0" />}
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              {theme === 'light' ? 'Dark Mode' : 'Lite Mode'}
            </span>
          </button>
           <button
              onClick={handleSignOut}
              className="flex items-center w-full p-3 space-x-4 rounded-lg text-red-500 hover:bg-tertiary-light dark:hover:bg-tertiary hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
            >
              <LogoutIcon className="w-7 h-7 flex-shrink-0" />
              <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                Logout
              </span>
            </button>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;