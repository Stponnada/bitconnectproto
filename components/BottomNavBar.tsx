import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, BookOpenIcon, ChatIcon, SearchIcon } from './icons';

const BottomNavBar: React.FC = () => {
  const activeLinkStyle = 'text-brand-green';
  const inactiveLinkStyle = 'text-gray-400';

  return (
    // This entire component is hidden on medium screens and up (md:hidden)
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-dark-secondary border-t border-dark-tertiary z-30 flex md:hidden">
      <NavLink 
        to="/" 
        end // 'end' prop ensures this only matches the exact root path
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
      <NavLink 
        to="/search" 
        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center ${isActive ? activeLinkStyle : inactiveLinkStyle}`}
      >
        <SearchIcon className="w-7 h-7" />
      </NavLink>
    </nav>
  );
};

export default BottomNavBar;