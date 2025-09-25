
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Feed from '../components/Feed';
import Spinner from '../components/Spinner';

const Profile: React.FC = () => {
    const { user, profile, loading } = useAuth();

    if (loading || !profile || !user) {
        return <div className="flex justify-center p-8"><Spinner /></div>;
    }

    return (
        <div>
            <div className="p-4 border-b border-gray-800">
                <h1 className="text-xl font-bold">{profile.full_name || profile.username}</h1>
                {/* Add more profile details if needed */}
            </div>
            <div className="relative">
                <div className="h-48 bg-gray-800">
                    {/* Cover image placeholder */}
                </div>
                <div className="absolute top-24 left-4">
                    <img src={profile.avatar_url || `https://picsum.photos/seed/${user.id}/128`} alt="avatar" className="w-32 h-32 rounded-full border-4 border-black bg-gray-700" />
                </div>
            </div>
            <div className="p-4 mt-16">
                <h2 className="text-2xl font-bold">{profile.full_name || profile.username}</h2>
                <p className="text-gray-400">@{profile.username}</p>
                <p className="mt-2">{profile.bio || "No bio yet."}</p>
            </div>
            <div className="border-t border-gray-800">
                <h3 className="text-lg font-bold p-4">Posts</h3>
                <Feed userId={user.id} />
            </div>
        </div>
    );
};

export default Profile;
