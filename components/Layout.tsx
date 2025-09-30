// src/components/Layout.tsx

import { Outlet } from 'react-router-dom';
import Header from './Header';

// We have removed the "import LeftSidebar from './LeftSidebar';" line

const Layout = () => {
  return (
    <div>
      {/* This is your fixed header. It floats on top. */}
      <Header />

      {/* 
        This is your main content area.
        - `pt-16`: Pushes the content down to start exactly where the header ends.
        - We have removed all the sidebar-related padding (`pl-60`, etc.).
      */}
      <main className="pt-16">
        
        {/* 
          This inner div is now responsible for centering your feed.
          - `max-w-2xl`: Sets a maximum width for your feed (looks good on all screen sizes).
          - `mx-auto`: This is the magic that centers the container horizontally.
          - `p-6`: Adds some nice spacing around the content.
        */}
        <div className="max-w-3xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;