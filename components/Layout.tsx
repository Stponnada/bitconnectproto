// src/components/Layout.tsx (Updated for Left Sidebar)

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import Header from './Header';
import LeftSidebar from './LeftSidebar';

const Layout = () => {
  const { user } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
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

  return (
    <div>
      <Header isSidebarExpanded={isSidebarExpanded} />
      <LeftSidebar 
        isExpanded={isSidebarExpanded} 
        setIsExpanded={setIsSidebarExpanded} 
        username={username}
      />
      
      <main 
        className={`pt-20 transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? 'pl-60' : 'pl-20'
        }`}
      >
        <div className="max-w-4xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;