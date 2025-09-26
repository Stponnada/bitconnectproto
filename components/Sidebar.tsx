import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SearchPanel from './SearchPanel';

interface SidebarProps {
    onOpenCreateModal: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenCreateModal }) => {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [isSearching, setIsSearching] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const handleNavigation = () => {
        setIsSearching(false);
    };
    
    const navLinkClasses = "flex items-center p-3 my-1 rounded-lg hover:bg-gray-800 transition-colors";
    const activeLinkClasses = "font-bold";
    
    const NavLinks = () => (
        <nav className="flex-1">
            <NavLink to="/" onClick={handleNavigation} className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} end>
                <i className="fa-solid fa-house text-2xl w-8"></i>
                <span className="ml-4 hidden lg:inline">Home</span>
            </NavLink>
             <button onClick={() => setIsSearching(true)} className={`${navLinkClasses} w-full text-left`}>
                <i className="fa-solid fa-magnifying-glass text-2xl w-8"></i>
                <span className="ml-4 hidden lg:inline">Search</span>
            </button>
            <button onClick={() => { onOpenCreateModal(); handleNavigation(); }} className={`${navLinkClasses} w-full`}>
                <i className="fa-regular fa-square-plus text-2xl w-8"></i>
                <span className="ml-4 hidden lg:inline">Create</span>
            </button>
            <NavLink to={`/${profile?.username}`} onClick={handleNavigation} className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
               {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="profile" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                    <i className="fa-regular fa-circle-user text-2xl w-8"></i>
                )}
                <span className="ml-4 hidden lg:inline">Profile</span>
            </NavLink>
        </nav>
    );

    return (
       <aside className="fixed top-16 left-0 h-screen border-r border-gray-800 p-3 md:w-20 lg:w-60 flex flex-col z-10 bg-black">
            <div className="py-4 mb-4">
                 <button onClick={handleNavigation} className="w-full text-left">
                    <h1 className="text-2xl font-serif hidden lg:block">BitsConnect</h1>
                    <i className="fa-solid fa-b text-3xl lg:hidden text-center block"></i>
                </button>
            </div>
            
            <div className="flex-1 flex flex-col">
                {isSearching ? <SearchPanel onNavigate={handleNavigation} /> : <NavLinks />}
            </div>

            <div className="mt-auto">
                 {!isSearching && (
                     <button onClick={handleSignOut} className={`${navLinkClasses} w-full`}>
                        <i className="fa-solid fa-arrow-right-from-bracket text-2xl w-8"></i>
                        <span className="ml-4 hidden lg:inline">Logout</span>
                    </button>
                 )}
            </div>
        </aside>
    );
};

export default Sidebar;