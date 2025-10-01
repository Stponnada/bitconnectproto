// src/components/Layout.tsx (Updated for Sidebar)

import { Outlet } from 'react-router-dom';
import Header from './Header';
import RightSidebar from './RightSidebar'; // Import the new sidebar

const Layout = () => {
  return (
    <div>
      <Header />
      <RightSidebar />

      {/* 
        This is your main content area.
        - `pr-24`: Adds padding to the right to make space for the collapsed sidebar.
      */}
      <main className="pt-20">
        
        <div className="max-w-3xl mx-auto p-6 pr-24">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;