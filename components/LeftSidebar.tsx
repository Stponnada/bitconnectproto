
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;

const LeftSidebar: React.FC = () => {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };
    
    const navLinkClasses = "flex items-center space-x-4 py-3 px-4 rounded-full hover:bg-gray-800 transition-colors duration-200";
    const activeLinkClasses = "bg-gray-800 font-bold";

    return (
        <aside className="w-1/4 lg:w-1/5 h-screen sticky top-0 p-4 hidden md:flex flex-col justify-between">
            <div>
                <div className="text-2xl font-bold mb-8 text-green-400">
                    BitsConnect
                </div>
                <nav className="space-y-2">
                    <NavLink to="/" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`} end>
                        <HomeIcon />
                        <span>Home</span>
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                        <UserIcon />
                        <span>Profile</span>
                    </NavLink>
                    <NavLink to="/settings" className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}>
                        <CogIcon />
                        <span>Settings</span>
                    </NavLink>
                </nav>
                 <button className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-full transition-colors duration-200">
                    Create Post
                </button>
            </div>
            <div className="mt-auto">
                <button onClick={handleSignOut} className="w-full flex items-center justify-center space-x-4 py-3 px-4 rounded-full hover:bg-red-900/50 bg-gray-800 transition-colors duration-200">
                    <LogoutIcon />
                    <span>Logout</span>
                </button>
                 {profile && (
                    <div className="flex items-center space-x-3 mt-4 p-2 rounded-full hover:bg-gray-800">
                        {/* FIX: Use `user_id` instead of `id` for the profile image seed, as `id` does not exist on the Profile type. */}
                        <img src={profile.avatar_url || `https://picsum.photos/seed/${profile.user_id}/40`} alt="avatar" className="w-10 h-10 rounded-full bg-gray-700" />
                        <div>
                            <p className="font-semibold text-sm">{profile.full_name || profile.username}</p>
                            <p className="text-xs text-gray-400">@{profile.username}</p>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default LeftSidebar;