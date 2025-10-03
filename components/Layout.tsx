// src/components/Layout.tsx

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import BottomNavBar from './BottomNavBar';

const Layout = () => {
  const { user } = useAuth();
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
      <div className="hidden md:block">
        <LeftSidebar 
          isExpanded={isSidebarExpanded} 
          setIsExpanded={setIsSidebarExpanded} 
          username={username}
        />
      </div>

      <div className="flex-1">
        <Header isSidebarExpanded={isSidebarExpanded} />
        
        <main 
          className={`pt-20 transition-all duration-300 ease-in-out pb-20 md:pb-0 md:pl-20 ${
            isSidebarExpanded ? 'md:pl-60' : 'md:pl-20'
          }`}
        >
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      <BottomNavBar />
    </div>
  );
};

export default Layout;