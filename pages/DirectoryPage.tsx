// src/pages/DirectoryPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import Spinner from '../components/Spinner';

// A reusable component for displaying a single user in the directory
const UserCard: React.FC<{ profile: Profile }> = ({ profile }) => (
  <Link 
    to={`/profile/${profile.username}`} 
    className="bg-dark-secondary p-4 rounded-lg flex flex-col items-center text-center hover:bg-dark-tertiary transition-colors border border-dark-tertiary"
  >
    <img 
      src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name || profile.username}`} 
      alt={profile.username}
      className="w-24 h-24 rounded-full object-cover mb-4 border-2 border-gray-600"
    />
    <h3 className="font-bold text-white text-lg">{profile.full_name}</h3>
    <p className="text-sm text-gray-400">@{profile.username}</p>
    <p className="text-xs text-gray-500 mt-2">{profile.campus} Campus</p>
  </Link>
);

const DirectoryPage: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all profiles, ordered by their full name
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .order('full_name', { ascending: true });

        if (fetchError) throw fetchError;
        setProfiles(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  if (loading) {
    return <div className="text-center p-8"><Spinner /></div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-400">Error: {error}</div>;
  }

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-6 text-white border-b border-dark-tertiary pb-4">User Directory</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {profiles.map(profile => (
          <UserCard key={profile.user_id} profile={profile} />
        ))}
      </div>
    </div>
  );
};

export default DirectoryPage;