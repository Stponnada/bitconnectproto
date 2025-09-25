import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Profile as ProfileType, Post as PostType } from '../types';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/Spinner';
import PostCard from '../components/PostCard';

const Profile: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { profile: currentProfile } = useAuth();
    const [profile, setProfile] = useState<ProfileType | null>(null);
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!username) return;
            setLoading(true);
            setError(null);
            
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', username)
                    .single();

                if (profileError || !profileData) {
                    throw new Error(profileError?.message || 'Profile not found.');
                }
                setProfile(profileData);

                const { data: postsData, error: postsError } = await supabase
                    .rpc('get_posts_with_likes')
                    .eq('user_id', profileData.user_id)
                    .order('created_at', { ascending: false });

                if (postsError) throw postsError;
                setPosts(postsData as PostType[]);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [username]);

    if (loading) return <div className="flex justify-center items-center h-screen"><Spinner isRed={true} /></div>;
    if (error) return <div className="text-center text-red-400 mt-20">{error}</div>;
    if (!profile) return <div className="text-center text-gray-500 mt-20">User not found.</div>;

    const isOwnProfile = currentProfile?.user_id === profile.user_id;

    const InfoField = ({ label, value }: { label: string; value?: string | number | null }) => (
      value ? <div><span className="font-semibold text-gray-200">{label}:</span> <span className="text-gray-400">{value}</span></div> : null
    );

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-dark-secondary rounded-b-lg">
                <div className="relative">
                    <div className="h-48 md:h-64 bg-dark-tertiary rounded-t-lg">
                        {profile.banner_url && <img src={profile.banner_url} alt="banner" className="w-full h-full object-cover rounded-t-lg" />}
                    </div>
                    <div className="absolute -bottom-16 left-8">
                        <img 
                          src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}&background=E53E3E&color=fff&size=150`} 
                          alt={profile.username}
                          className="w-32 h-32 rounded-full object-cover border-4 border-dark-secondary"
                        />
                    </div>
                </div>

                <div className="pt-20 px-8 pb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-white">{profile.full_name}</h1>
                            <p className="text-gray-400">@{profile.username}</p>
                            <p className="text-gray-400 text-sm mt-1">{profile.campus} &middot; Class of {profile.admission_year ? profile.admission_year + 4 : 'N/A'}</p>
                        </div>
                        {isOwnProfile && (
                            <Link to="/accounts/edit" className="bg-dark-tertiary hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md text-sm">
                                Edit Profile
                            </Link>
                        )}
                    </div>
                    <p className="mt-4 text-gray-300">{profile.bio || 'No bio yet.'}</p>
                    
                    <div className="mt-6 pt-6 border-t border-dark-tertiary grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <InfoField label="Branch" value={profile.branch} />
                        <InfoField label="Relationship Status" value={profile.relationship_status} />
                        <InfoField label="Dorm" value={profile.dorm_building ? `${profile.dorm_building}, Room ${profile.dorm_room}` : null} />
                        <InfoField label="Dining Hall" value={profile.dining_hall} />
                        <InfoField label="Clubs" value={profile.clubs} />
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold text-white mb-4">Posts</h2>
                <div>
                    {posts.length > 0 ? (
                        posts.map(post => <PostCard key={post.id} post={post} />)
                    ) : (
                        <p className="text-center text-gray-500 py-10">No posts to see here.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;