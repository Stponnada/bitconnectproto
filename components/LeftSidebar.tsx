// components/LeftSidebar.tsx

import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

// Assuming you have icons, you'd import them here
// import { HomeIcon, UserIcon, CogIcon, LogoutIcon, PlusIcon } from '@heroicons/react/outline';

const LeftSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login'); // Redirect to login after sign out
  };

  // This function helps NavLink apply a different style to the active link
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    isActive ? 'sidebar-link active' : 'sidebar-link';

  return (
    <aside className="left-sidebar">
      <div className="sidebar-logo">
        BITS Connect
      </div>
      <nav className="sidebar-nav">
        {/*
          THE FIX IS HERE: We use NavLink and the "to" prop must exactly
          match the paths in App.tsx.
        */}
        <NavLink to="/" className={getNavLinkClass}>
          {/* <HomeIcon /> */}
          <span>Home</span>
        </NavLink>

        <NavLink to="/profile" className={getNavLinkClass}>
          {/* <UserIcon /> */}
          <span>Profile</span>
        </NavLink>

        <NavLink to="/accounts/edit" className={getNavLinkClass}>
          {/* <CogIcon /> */}
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="sidebar-actions">
        <button className="create-post-button">
          {/* <PlusIcon /> */}
          <span>Create Post</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button">
          {/* <LogoutIcon /> */}
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default LeftSidebar;