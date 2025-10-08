// src/pages/Profile.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import PostComponent from '../components/Post';
import CreatePost from '../components/CreatePost';
import { Post as PostType, Profile, Friend } from '../types';
import Spinner from '../components/Spinner';
import { CameraIcon, LogoutIcon } from '../components/icons';
import { isMscBranch, BITS_BRANCHES } from '../data/bitsBranches.ts';
import ImageCropper from '../components/ImageCropper';
import FollowListModal from '../components/FollowListModal';

const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 p-4 font-bold text-center transition-colors ${
            isActive 
            ? 'border-b-2 border-brand-green text-text-main-light dark:text-text-main' 
            : 'text-text-tertiary-light dark:text-text-tertiary hover:bg-tertiary-light/60 dark:hover:bg-tertiary'
        }`}
    >
        {label}
    </button>
);

const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser, profile: currentUserProfile } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTogglingFollow, setIsTogglingFollow] = useState(false);
    
    const [activeTab, setActiveTab] = useState<'posts' | 'mentions'>('posts');
    const [posts, setPosts] = useState<PostType[]>([]);
    const [mentions, setMentions] = useState<PostType[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(true);

    const [followModalState, setFollowModalState] = useState<{ isOpen: boolean; listType: 'followers' | 'following' | null; }>({ isOpen: false, listType: null });

    const fetchProfileData = useCallback(async () => {
        if (!username) return;
        setProfileLoading(true);
        try {
            const { data, error } = await supabase
                .rpc('get_profile_details', { profile_username: username })
                .single();

            if (error || !data) throw error || new Error("Profile not found");
            setProfile(data);
        } catch (error) {
            console.error("Error fetching profile data:", error);
            setProfile(null);
        } finally {
            setProfileLoading(false);
        }
    }, [username]);

    const fetchPostsAndMentions = useCallback(async () => {
        if (!profile) return;
        setPostsLoading(true);
    
        const postsPromise = supabase.from('posts').select('*, profiles(*)').eq('user_id', profile.user_id).order('created_at', { ascending: false });
        const mentionsPromise = supabase.rpc('get_mentions_for_user', { profile_user_id: profile.user_id }).select('*, profiles(*)');
        
        const [postsResult, mentionsResult] = await Promise.all([postsPromise, mentionsPromise]);
    
        if (postsResult.error) console.error("Error fetching posts:", postsResult.error);
        else setPosts((postsResult.data as any) || []);
    
        if (mentionsResult.error) console.error("Error fetching mentions:", mentionsResult.error);
        else setMentions((mentionsResult.data as any) || []);
    
        setPostsLoading(false);
    }, [profile]);

    const fetchFriends = useCallback(async () => {
        if (!profile) return;
        setFriendsLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_mutual_followers', { p_user_id: profile.user_id });
            if (error) throw error;
            setFriends(data || []);
        } catch (error) {
            console.error("Error fetching friends:", error);
        } finally {
            setFriendsLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);
    
    useEffect(() => {
        if (profile) {
            fetchPostsAndMentions();
            fetchFriends();
        }
    }, [profile, fetchPostsAndMentions, fetchFriends]);
    
    const handleFollowToggle = async () => {
      if (!currentUser || !profile || isTogglingFollow) return;
      setIsTogglingFollow(true);
      const isCurrentlyFollowing = profile.is_following;
      setProfile({
        ...profile,
        is_following: !isCurrentlyFollowing,
        follower_count: isCurrentlyFollowing 
          ? profile.follower_count - 1
          : profile.follower_count + 1,
      });
      try {
        if (isCurrentlyFollowing) {
          await supabase.from('followers').delete().match({ follower_id: currentUser.id, following_id: profile.user_id });
        } else {
          await supabase.from('followers').insert({ follower_id: currentUser.id, following_id: profile.user_id });
        }
      } catch (error) {
        console.error('Failed to toggle follow:', error);
        setProfile({ ...profile, is_following: isCurrentlyFollowing, follower_count: profile.follower_count });
      } finally {
        setIsTogglingFollow(false);
      }
    };
    
    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    if (profileLoading) {
        return <div className="flex items-center justify-center h-screen"><Spinner /></div>;
    }
    
    if (!profile) {
        return <div className="text-center py-10 text-xl text-red-400">User not found.</div>;
    }
    
    const isOwnProfile = currentUser?.id === profile.user_id;

    let graduationYear = null;
    if (profile.admission_year && profile.branch && profile.campus) {
        const isMsc = isMscBranch(profile.branch, profile.campus);
        graduationYear = profile.admission_year + (isMsc ? 5 : 4);
    }
    
    const dormInfo = profile.dorm_building ? `${profile.dorm_building}${profile.dorm_room ? `, Room ${profile.dorm_room}` : ''}` : null;

    return (
        <>
            {isEditModalOpen && profile && <EditProfileModal userProfile={profile} onClose={() => setIsEditModalOpen(false)} onSave={fetchProfileData} />}
            {followModalState.isOpen && profile && followModalState.listType && <FollowListModal profile={profile} listType={followModalState.listType} onClose={() => setFollowModalState({ isOpen: false, listType: null })} />}
            
            <div className="w-full max-w-7xl mx-auto">
                <div className="relative bg-secondary-light dark:bg-secondary">
                    {/* Banner Container with Image and Gradient Overlay */}
                    <div className="h-48 sm:h-80 bg-tertiary-light dark:bg-tertiary relative">
                        {profile.banner_url && <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />}
                        
                        {/* Gradient Overlay for better text visibility - increased opacity to black/70 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        
                        {/* User Name at the bottom of the banner - increased top padding for a lower position */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 pt-5 sm:p-6 text-white z-30">
                            <h1 className="text-3xl font-extrabold sm:text-4xl text-shadow-lg pl-44 sm:pl-48">{profile.full_name}</h1>
                            <p className="text-lg text-shadow-md pl-44 sm:pl-48">@{profile.username}</p>
                        </div>
                    </div>
                    
                    {/* Avatar positioned absolutely relative to the banner container (z-20) */}
                    <div className="absolute -bottom-16 left-4 sm:left-6 z-20">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-primary-light dark:border-primary bg-gray-700">
                           {profile.avatar_url && <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full rounded-full object-cover" />}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center p-4">
                    {isOwnProfile ? (
                        <div className="flex items-center space-x-2">
                             <button onClick={() => setIsEditModalOpen(true)} className="font-bold py-2 px-4 rounded-full border-2 border-tertiary-light dark:border-tertiary hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors">Edit Profile</button>
                             <button onClick={handleSignOut} className="p-2 text-red-500 rounded-full hover:bg-tertiary-light dark:hover:bg-tertiary transition-colors md:hidden">
                                 <LogoutIcon className="w-6 h-6" />
                             </button>
                        </div>
                    ) : (
                        <button onClick={handleFollowToggle} disabled={isTogglingFollow} className={`font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50 ${profile.is_following ? 'bg-transparent border border-gray-400 text-text-main-light dark:text-white hover:border-red-500 hover:text-red-500' : 'bg-text-main-light dark:bg-white dark:text-black hover:bg-gray-200'}`}>
                            {isTogglingFollow ? <Spinner /> : (profile.is_following ? 'Following' : 'Follow')}
                        </button>
                    )}
                </div>

                {/* This section for name/username is now empty because it was moved into the banner */}
                <div className="px-4 pb-4 -mt-4">
                    {/* Name and username elements were here, but are now inside the banner div. */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 px-4 sm:px-6 mt-4">
                    <div className="lg:col-span-1 space-y-4"> 
                        <h2 className="text-xl font-bold">About {profile.full_name?.split(' ')[0] || profile.username}</h2>
                        <div className="flex items-center space-x-4 text-sm">
                            <button onClick={() => setFollowModalState({ isOpen: true, listType: 'following' })} className="hover:underline">
                                <span className="font-bold text-text-main-light dark:text-white">{profile.following_count}</span>
                                <span className="text-text-tertiary-light dark:text-text-tertiary"> Following</span>
                            </button>
                            <button onClick={() => setFollowModalState({ isOpen: true, listType: 'followers' })} className="hover:underline">
                                <span className="font-bold text-text-main-light dark:text-white">{profile.follower_count}</span>
                                <span className="text-text-tertiary-light dark:text-text-tertiary"> Followers</span>
                            </button>
                        </div>
                        {profile.bio && <p className="text-text-secondary-light dark:text-text-secondary whitespace-pre-wrap">{profile.bio}</p>}
                        
                        <hr className="border-tertiary-light dark:border-tertiary !my-6" />
                        
                        <div className="space-y-4 text-sm">
                            <ProfileDetail label="Primary Degree" value={profile.branch} />
                            <ProfileDetail label="B.E. Degree" value={profile.dual_degree_branch} />
                            <ProfileDetail label="Relationship Status" value={profile.relationship_status} />
                            <ProfileDetail label="Dorm" value={dormInfo} />
                            <ProfileDetail label="Dining Hall" value={profile.dining_hall} />
                        </div>
                        
                        {!friendsLoading && friends.length > 0 && (
                            <>
                                <hr className="border-tertiary-light dark:border-tertiary !my-6" />
                                <div>
                                    <h3 className="text-lg font-bold mb-3">Friends</h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-3">
                                        {friends.slice(0, 9).map(friend => (
                                            <Link 
                                                to={`/profile/${friend.username}`} 
                                                key={friend.user_id}
                                                className="flex flex-col items-center space-y-1 group"
                                                title={friend.full_name || friend.username}
                                            >
                                                <img 
                                                    src={friend.avatar_url || `https://ui-avatars.com/api/?name=${friend.full_name || friend.username}`} 
                                                    alt={friend.username}
                                                    className="w-16 h-16 rounded-full object-cover"
                                                />
                                                <p className="text-xs text-center text-text-tertiary-light dark:text-text-tertiary group-hover:underline truncate w-full">
                                                    {friend.full_name || friend.username}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="lg:col-span-2 mt-8 lg:mt-0"> 
                        {isOwnProfile && currentUserProfile && activeTab === 'posts' && (
                            <div className="mb-6">
                                <CreatePost onPostCreated={(newPost) => setPosts([newPost as PostType, ...posts])} profile={currentUserProfile} />
                            </div>
                        )}
                        
                        <div className="flex border-b border-tertiary-light dark:border-tertiary">
                            <TabButton label="Posts" isActive={activeTab === 'posts'} onClick={() => setActiveTab('posts')} />
                            <TabButton label="Mentions" isActive={activeTab === 'mentions'} onClick={() => setActiveTab('mentions')} />
                        </div>

                        <div className="mt-4 space-y-4">
                            {postsLoading ? (
                                <div className="text-center py-8"><Spinner/></div>
                            ) : (
                                <>
                                    {activeTab === 'posts' && (
                                        posts.length > 0 
                                            ? posts.map(post => <PostComponent key={post.id} post={post} />) 
                                            : <p className="text-center text-text-tertiary-light dark:text-text-tertiary py-8">No posts yet.</p>
                                    )}
                                    {activeTab === 'mentions' && (
                                        mentions.length > 0 
                                            ? mentions.map(post => <PostComponent key={post.id} post={post} />) 
                                            : <p className="text-center text-text-tertiary-light dark:text-text-tertiary py-8">No mentions yet.</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const EditProfileModal: React.FC<{ userProfile: Profile, onClose: () => void, onSave: () => void }> = ({ userProfile, onClose, onSave }) => {
    const { user, updateProfileContext } = useAuth();
    const [profileData, setProfileData] = useState(userProfile);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.avatar_url);
    const [bannerPreview, setBannerPreview] = useState<string | null>(userProfile.banner_url);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    
    const [cropperState, setCropperState] = useState<{
      isOpen: boolean;
      type: 'avatar' | 'banner' | null;
      src: string | null;
    }>({ isOpen: false, type: null, src: null });

    const [availableBranches, setAvailableBranches] = useState<string[]>([]);
    const [isDualDegreeStudent, setIsDualDegreeStudent] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const campus = profileData.campus;
        if (campus && BITS_BRANCHES[campus]) {
            const campusBranches = BITS_BRANCHES[campus];
            setAvailableBranches([...campusBranches['B.E.'], ...campusBranches['M.Sc.']]);
            const isMsc = isMscBranch(profileData.branch || '', campus);
            setIsDualDegreeStudent(isMsc);
        }
    }, [profileData.campus, profileData.branch]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropperState({ isOpen: true, type, src: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };
    
    const handleCropSave = (croppedImageFile: File) => {
        const previewUrl = URL.createObjectURL(croppedImageFile);
        if (cropperState.type === 'avatar') {
            setAvatarFile(croppedImageFile);
            setAvatarPreview(previewUrl);
        } else if (cropperState.type === 'banner') {
            setBannerFile(croppedImageFile);
            setBannerPreview(previewUrl);
        }
        setCropperState({ isOpen: false, type: null, src: null });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'branch' && !isMscBranch(value, updated.campus || '')) {
                updated.dual_degree_branch = null;
            }
            return updated;
        });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true); setError('');
        try {
            let avatar_url = profileData.avatar_url;
            let banner_url = profileData.banner_url;

            if (avatarFile) {
                const filePath = `${user.id}/avatar.${avatarFile.name.split('.').pop()}`;
                await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                avatar_url = `${publicUrl}?t=${new Date().getTime()}`;
            }
            if (bannerFile) {
                const filePath = `${user.id}/banner.${bannerFile.name.split('.').pop()}`;
                await supabase.storage.from('avatars').upload(filePath, bannerFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
                banner_url = `${publicUrl}?t=${new Date().getTime()}`;
            }

            const { data: updatedProfile, error: updateError } = await supabase.from('profiles').update({
                full_name: profileData.full_name, bio: profileData.bio, branch: profileData.branch,
                dual_degree_branch: profileData.dual_degree_branch || null, relationship_status: profileData.relationship_status,
                dorm_building: profileData.dorm_building, dorm_room: profileData.dorm_room, dining_hall: profileData.dining_hall,
                avatar_url, banner_url, updated_at: new Date().toISOString(),
            }).eq('user_id', user.id).select().single();

            if (updateError) throw updateError;
            
            updateProfileContext(updatedProfile);
            onSave();
            onClose();
        } catch (err: any) { setError(err.message); } finally { setIsSaving(false); }
    };
    
    if (cropperState.isOpen && cropperState.src) {
        return (
            <ImageCropper
                imageSrc={cropperState.src}
                aspect={cropperState.type === 'avatar' ? 1 : 16 / 9}
                cropShape={cropperState.type === 'avatar' ? 'round' : 'rect'}
                onSave={handleCropSave}
                onClose={() => setCropperState({ isOpen: false, type: null, src: null })}
            />
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-2xl font-bold text-brand-green mb-6">Edit Profile</h2>
                    <div className="relative h-48 bg-tertiary-light dark:bg-tertiary rounded-t-lg mb-16">
                        {bannerPreview && <img src={bannerPreview} className="w-full h-full object-cover rounded-t-lg" alt="Banner Preview"/>}
                        <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><CameraIcon className="w-8 h-8 text-white" /></button>
                        <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" hidden />
                        <div className="absolute -bottom-16 left-6 w-32 h-32 rounded-full border-4 border-secondary-light dark:border-secondary bg-gray-600">
                            {avatarPreview && <img src={avatarPreview} className="w-full h-full rounded-full object-cover" alt="Avatar Preview"/>}
                            <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 rounded-full transition-opacity"><CameraIcon className="w-8 h-8 text-white" /></button>
                            <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" hidden />
                        </div>
                    </div>
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    <div className="space-y-4 pt-4">
                        <div><label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Full Name</label><input type="text" name="full_name" value={profileData.full_name || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green" /></div>
                        <div><label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Bio</label><textarea name="bio" value={profileData.bio || ''} onChange={handleChange} rows={3} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Primary Degree</label>
                                <select name="branch" value={profileData.branch || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green">
                                    <option value="">Select Branch</option>
                                    {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            {isDualDegreeStudent && (
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">B.E. Degree</label>
                                    <select name="dual_degree_branch" value={profileData.dual_degree_branch || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green">
                                        <option value="">Select B.E. Branch</option>
                                        {profileData.campus && BITS_BRANCHES[profileData.campus]['B.E.'].map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            )}
                            <div><label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Relationship Status</label><select name="relationship_status" value={profileData.relationship_status || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green"><option value="">Select Status</option><option value="Single">Single</option><option value="In a relationship">In a relationship</option><option value="It's complicated">It's complicated</option><option value="Married">Married</option></select></div>
                            <div><label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Dorm Building</label><input type="text" name="dorm_building" placeholder="e.g., Valmiki" value={profileData.dorm_building || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green" /></div>
                            <div><label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Dorm Room</label><input type="text" name="dorm_room" placeholder="e.g., 469" value={profileData.dorm_room || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green" /></div>
                            <div className="md:col-span-2"><label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary">Dining Hall</label><select name="dining_hall" value={profileData.dining_hall || ''} onChange={handleChange} className="mt-1 block w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-text-main-light dark:text-text-main border border-tertiary-light dark:border-gray-600 focus:ring-brand-green focus:border-brand-green"><option value="">Select Mess</option><option value="Mess 1">Mess 1</option><option value="Mess 2">Mess 2</option></select></div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-6"><button type="button" onClick={onClose} className="py-2 px-6 rounded-full text-text-main-light dark:text-text-main hover:bg-tertiary-light/60 dark:hover:bg-tertiary">Cancel</button><button type="submit" disabled={isSaving} className="py-2 px-6 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50">{isSaving ? <Spinner /> : 'Save Changes'}</button></div>
                </form>
            </div>
        </div>
    );
};

const ProfileDetail: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    if (!value) return null;
    return (<div><span className="font-semibold text-text-secondary-light dark:text-text-main">{label}: </span><span className="text-text-tertiary-light dark:text-text-tertiary">{value}</span></div>);
};

export default ProfilePage;