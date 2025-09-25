// components/Layout.tsx

import { Outlet } from 'react-router-dom';
import Header from './Header'; // Assuming you have a Header component
import LeftSidebar from './LeftSidebar'; // Assuming you have these components
import RightSidebar from './RightSidebar'; // Assuming you have these components

const Layout = () => {
  return (
    // This is just an example structure. Your actual JSX may vary.
    <div className="main-container"> 
      <Header />
      <div className="content-container">
        <LeftSidebar />
        <main className="page-content">
          {/* 
            THIS IS THE MOST IMPORTANT PART.
            The <Outlet /> component tells React Router "render the 
            matched child route component right here". 
            Without this, none of your pages (Home, Settings, Profile)
            will ever be displayed.
          */}
          <Outlet />
        </main>
        <RightSidebar />
      </div>
    </div>
  );
};

export default Layout;