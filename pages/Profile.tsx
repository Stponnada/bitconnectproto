import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Profile as ProfileType, Post as PostType } from '../types';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';
import PostCard from '../components/PostCard';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      if (!username) return;
      setLoadingProfile(true);
      setLoadingPosts(true);
      setError(null);
      setProfile(null);
      setPosts([]);
      
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      
      if (fetchError) {
        setError('Profile not found.');
        console.error(fetchError);
        setLoadingProfile(false);
        setLoadingPosts(false);
        return;
      }
      
      setProfile(profileData);
      setLoadingProfile(false);

      if (profileData) {
        const { data: postsData, error: postsError } = await supabase.rpc('get_posts_with_likes', { profile_id: profileData.user_id });
        if (postsError) {
          setError('Could not load posts.');
          console.error(postsError);
        } else {
          setPosts(postsData || []);
        }
        setLoadingPosts(false);
      }
    };

    fetchProfileAndPosts();
  }, [username]);

  if (loadingProfile) {
    return <div className="flex justify-center p-8"><Spinner isRed={true} /></div>;
  }

  if (error || !profile) {
    return <div className="text-center p-8 text-red-400">{error || 'Could not load profile.'}</div>;
  }

  const isOwnProfile = user && profile.user_id === user.id;

  return (
    <div>
      <div className="bg-dark-secondary rounded-lg overflow-hidden mb-6">
        <div className="h-48 bg-dark-tertiary relative">
          {profile.banner_url && (
            <img src={profile.banner_url} alt="banner" className="w-full h-full object-cover" />
          )}
          <div className="absolute -bottom-16 left-6">
            <img
              src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}&background=E53E3E&color=fff&size=128`}
              alt="avatar"
              className="w-32 h-32 rounded-full border-4 border-dark-secondary bg-dark-tertiary object-cover"
            />
          </div>
        </div>
        <div className="p-6 pt-20">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{profile.full_name}</h1>
              <p className="text-gray-400">@{profile.username}</p>
            </div>
            {isOwnProfile && (
              <Link to="/accounts/edit" className="bg-dark-tertiary hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">
                Edit Profile
              </Link>
            )}
          </div>
          {profile.bio && <p className="mt-4 text-gray-300">{profile.bio}</p>}
          
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 text-sm text-gray-400 border-t border-dark-tertiary pt-4">
            {profile.campus && <div><span className="font-semibold text-gray-300">Campus:</span> {profile.campus}</div>}
            {profile.admission_year && <div><span className="font-semibold text-gray-300">Admission Year:</span> {profile.admission_year}</div>}
            {profile.branch && <div><span className="font-semibold text-gray-300">Branch:</span> {profile.branch}</div>}
            {profile.dorm_building && <div><span className="font-semibold text-gray-300">Dorm:</span> {profile.dorm_building} {profile.dorm_room && `- ${profile.dorm_room}`}</div>}
            {profile.dining_hall && <div><span className="font-semibold text-gray-300">Mess:</span> {profile.dining_hall}</div>}
            {profile.relationship_status && <div><span className="font-semibold text-gray-300">Status:</span> {profile.relationship_status}</div>}
            {profile.clubs && <div className="sm:col-span-2 lg:col-span-3"><span className="font-semibold text-gray-300">Clubs:</span> {profile.clubs}</div>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Posts</h2>
        {loadingPosts ? (
          <div className="flex justify-center p-8"><Spinner isRed={true} /></div>
        ) : posts.length === 0 ? (
          <div className="text-gray-400 text-center p-8">This user hasn't posted anything yet.</div>
        ) : (
          <div>
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;