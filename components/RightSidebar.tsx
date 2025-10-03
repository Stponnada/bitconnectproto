import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import {
  HomeIcon,
  BookOpenIcon,
  ChatIcon,
  UserIcon,
  LogoutIcon,
} from './icons';

// A new Menu icon
const MenuIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const RightSidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const NavLink: React.FC<{ to: string; icon: React.ReactNode; text: string }> = ({ to, icon, text }) => (
    <Link
      to={to}
      className="flex items-center p-3 my-1 space-x-4 rounded-lg text-gray-300 hover:bg-dark-tertiary hover:text-white transition-colors duration-200"
    >
      {icon}
      <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
        {text}
      </span>
    </Link>
  );

  return (
    <aside
      className={`fixed top-0 right-0 h-full bg-dark-secondary border-l border-dark-tertiary z-30 transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-60' : 'w-20'
      }`}
    >
      <div className="flex flex-col h-full p-3 pt-20">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center p-3 mb-4 space-x-4 rounded-lg hover:bg-dark-tertiary"
        >
          <MenuIcon className="w-7 h-7 flex-shrink-0" />
        </button>

        <nav className="flex-grow">
          <NavLink to="/" icon={<HomeIcon className="w-7 h-7 flex-shrink-0" />} text="Home" />
          <NavLink to="/directory" icon={<BookOpenIcon className="w-7 h-7 flex-shrink-0" />} text="Directory" />
          <NavLink to="/chat" icon={<ChatIcon className="w-7 h-7 flex-shrink-0" />} text="Messages" />
          {username && (
            <NavLink to={`/profile/${username}`} icon={<UserIcon className="w-7 h-7 flex-shrink-0" />} text="Profile" />
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

export default RightSidebar;