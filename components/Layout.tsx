// components/Layout.tsx

// src/components/Layout.tsx

import { Outlet } from 'react-router-dom';
import Header from './Header';
import LeftSidebar from './LeftSidebar';

const Layout = () => {
  return (
    <div>
      {/* Both the Header and Sidebar are fixed and float on top */}
      <Header />
      <LeftSidebar />

      {/* 
        This is your main content area.
        - `pt-16`: Pushes it down below the header.
        - `md:pl-20 lg:pl-60`: THIS IS THE KEY. It adds padding to the left that
          exactly matches your sidebar's responsive width, making space for it.
      */}
      <main className="pt-16 md:pl-20 lg:pl-60">
        <div className="p-6"> {/* This inner div adds some nice spacing for the feed */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;