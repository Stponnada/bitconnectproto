
import React from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-gray-100 flex justify-center">
      <div className="w-full max-w-screen-xl flex">
        <LeftSidebar />
        <main className="flex-grow w-full md:w-1/2 lg:w-2/4 border-x border-gray-800">
          <Outlet />
        </main>
        <RightSidebar />
      </div>
    </div>
  );
};

export default Layout;
