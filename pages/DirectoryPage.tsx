// src/pages/DirectoryPage.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import Spinner from '../components/Spinner';

// A redesigned UserCard for a list view (horizontal layout)
const UserCard: React.FC<{ profile: Profile }> = ({ profile }) => (
  <Link 
    to={`/profile/${profile.username}`} 
    className="bg-dark-secondary p-4 rounded-lg flex items-center space-x-4 hover:bg-dark-tertiary transition-colors border border-dark-tertiary"
  >
    <img 
      src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name || profile.username}`} 
      alt={profile.username}
      className="w-16 h-16 rounded-full object-cover border-2 border-gray-600"
    />
    <div className="text-left">
      <h3 className="font-bold text-white text-lg">{profile.full_name}</h3>
      <p className="text-sm text-gray-400">@{profile.username}</p>
      <p className="text-xs text-gray-500 mt-1">{profile.campus} Campus</p>
    </div>
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
      {/* THE FIX: Removed grid classes and added space-y-4 for a vertical list */}
      <div className="space-y-4">
        {profiles.map(profile => (
          <UserCard key={profile.user_id} profile={profile} />
        ))}
      </div>
    </div>
  );
};

export default DirectoryPage;