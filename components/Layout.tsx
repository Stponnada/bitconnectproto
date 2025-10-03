// src/components/Layout.tsx

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import BottomNavBar from './BottomNavBar';

const Layout = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  // <-- REMOVED: Redundant useEffect and state for username
  
  return (
    <div className="md:flex">
      <div className="hidden md:block">
        <LeftSidebar 
          isExpanded={isSidebarExpanded} 
          setIsExpanded={setIsSidebarExpanded}
          // <-- REMOVED: username prop is no longer needed
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