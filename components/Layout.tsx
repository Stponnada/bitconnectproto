// src/components/Layout.tsx

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import BottomNavBar from './BottomNavBar'; // Import the new bottom nav

const Layout = () => {
  const { user } = useAuth();
  // State for desktop sidebar
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsername = async () => {
      if (user) {
        const { data } = await supabase.from('profiles').select('username').eq('user_id', user.id).single();
        if (data) setUsername(data.username);
      }
    };
    fetchUsername();
  }, [user]);

  return (
    <div className="md:flex">
      {/* Renders the full sidebar on medium screens and up */}
      <div className="hidden md:block">
        <LeftSidebar 
          isExpanded={isSidebarExpanded} 
          setIsExpanded={setIsSidebarExpanded} 
          username={username}
        />
      </div>

      <div className="flex-1">
        <Header isSidebarExpanded={isSidebarExpanded} />
        
        {/* Responsive main content area */}
        <main 
          className={`pt-20 transition-all duration-300 ease-in-out 
                      pb-20 md:pb-0  /* Padding for bottom bar on mobile */
                      md:pl-20       /* Padding for collapsed sidebar on desktop */
                      ${isSidebarExpanded ? 'md:pl-60' : 'md:pl-20'}`}
        >
          <div className="p-4 md:p-6"> {/* Reduced padding on mobile */}
            <Outlet />
          </div>
        </main>
      </div>

      {/* Renders the bottom navigation bar on mobile */}
      <BottomNavBar />
    </div>
  );
};

export default Layout;