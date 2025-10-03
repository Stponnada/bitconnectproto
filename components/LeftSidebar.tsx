// src/components/LeftSidebar.tsx

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import {
  HomeIcon,
  BookOpenIcon,
  ChatIcon,
  UserIcon,
  LogoutIcon,
} from './icons';

const MenuIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

interface LeftSidebarProps {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isExpanded, setIsExpanded }) => {
  const { profile } = useAuth();
  const username = profile?.username;
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };
  
  const baseLinkStyle = "flex items-center p-3 my-1 space-x-4 rounded-lg";
  const activeLinkStyle = "bg-dark-tertiary text-white";
  const inactiveLinkStyle = "text-gray-300 hover:bg-dark-tertiary hover:text-white";
  const linkClassName = ({ isActive }: {isActive: boolean}) => `${baseLinkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`;

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-dark-secondary border-r border-dark-tertiary z-30 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-60' : 'w-20'
      }`}
    >
      <div className="flex flex-col h-full p-3 pt-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center p-3 mb-4 space-x-4 rounded-lg hover:bg-dark-tertiary"
        >
          <MenuIcon className="w-7 h-7 flex-shrink-0" />
        </button>

        <nav className="flex-grow mt-4">
          <NavLink to="/" end className={linkClassName}>
            <HomeIcon className="w-7 h-7 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Home</span>
          </NavLink>
          <NavLink to="/directory" className={linkClassName}>
            <BookOpenIcon className="w-7 h-7 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Directory</span>
          </NavLink>
          <NavLink to="/chat" className={linkClassName}>
            <ChatIcon className="w-7 h-7 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Messages</span>
          </NavLink>
          {username && (
             <NavLink to={`/profile/${username}`} className={linkClassName}>
              <UserIcon className="w-7 h-7 flex-shrink-0" />
              <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>Profile</span>
            </NavLink>
          )}
        </nav>

        <div className="mt-auto">
           <button
              onClick={handleSignOut}
              className="flex items-center w-full p-3 space-x-4 rounded-lg text-red-400 hover:bg-dark-tertiary hover:text-red-300 transition-colors duration-200"
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