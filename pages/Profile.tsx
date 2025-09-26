import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PostComponent from '../components/Post';
import { Post as PostType, Profile } from '../types';
import Spinner from '../components/Spinner';
import { ChatIcon } from '../components/icons';

// Your reusable helper component for displaying details
const ProfileDetail: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="text-gray-400">
            <span className="font-semibold text-gray-200">{label}: </span>
            {value}
        </div>
    );
};

// ... (Your EditProfileModal component can go here, no changes needed yet) ...

const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchProfileData = async () => {
        if (!username) return;
        setLoading(true);

        const { data: profileData } = await supabase.from('profiles').select('*').eq('username', username).single();
        
        if (profileData) {
            setProfile(profileData);
            const { data: postsData } = await supabase.from('posts').select('*, profiles(*)').eq('user_id', profileData.user_id).order('created_at', { ascending: false });
            setPosts((postsData as any) || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProfileData();
    }, [username]);

    if (loading) return <div className="text-center py-10"><Spinner /></div>;
    if (!profile) return <div className="text-center py-10 text-red-400">User not found</div>;
    
    const isOwnProfile = currentUser?.id === profile.user_id;

    return (
        <>
        {/* {isEditModalOpen && <EditProfileModal ... />} */}
        
        <div className="w-full max-w-4xl mx-auto pb-10">
            <div className="h-48 sm:h-64 bg-gray-700">{profile.banner_url && <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />}</div>
            
            <div className="px-4 sm:px-6 relative">
                <div className="flex items-end -mt-16 sm:-mt-20">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-bits-dark bg-bits-dark flex-shrink-0">
                        {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center text-4xl font-bold">{(profile.full_name || '?').charAt(0)}</div>}
                    </div>
                    <div className="ml-auto pb-4">
                        {isOwnProfile && <button onClick={() => setIsEditModalOpen(true)} className="bg-bits-medium-dark text-white font-bold py-2 px-4 rounded-full hover:bg-bits-light-dark">Edit Profile</button>}
                        {!isOwnProfile && <button className="flex items-center bg-bits-red text-white font-bold py-2 px-4 rounded-full hover:bg-red-700"><ChatIcon className="w-5 h-5 mr-2" />Message</button>}
                    </div>
                </div>

                <div className="mt-4">
                    <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                    <p className="text-bits-text-muted">@{profile.username}</p>
                </div>

                {profile.bio && <p className="mt-4 text-gray-300 whitespace-pre-wrap">{profile.bio}</p>}

                {/* ================================================================== */}
                {/* THIS IS THE FIX: Displaying all the user details */}
                {/* ================================================================== */}
                <div className="mt-6 border-t border-gray-700 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <ProfileDetail label="Campus" value={profile.campus} />
                    <ProfileDetail label="Admission Year" value={profile.admission_year} />
                    <ProfileDetail label="Branch" value={profile.branch} />
                    <ProfileDetail label="Relationship Status" value={profile.relationship_status} />
                    <ProfileDetail label="Dorm" value={profile.dorm_building && `${profile.dorm_building}${profile.dorm_room ? `, Room ${profile.dorm_room}` : ''}`} />
                    <ProfileDetail label="Dining Hall" value={profile.dining_hall} />
                </div>
                {/* ================================================================== */}

                <div className="mt-8 border-t border-gray-700">
                    <h2 className="text-xl font-bold px-4 sm:px-6 pt-6">Posts</h2>
                    <div className="mt-4 space-y-4">
                        {posts.length > 0 ? (
                            posts.map(post => <PostComponent key={post.id} post={post} />)
                        ) : (<p className="text-center text-gray-500 py-8">No posts yet.</p>)}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default ProfilePage;