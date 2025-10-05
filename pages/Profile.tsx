// src/pages/Profile.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import PostComponent from '../components/Post';
import { Post as PostType, Profile } from '../types';
import Spinner from '../components/Spinner';
import { CameraIcon } from '../components/icons';
import { isMscBranch, BITS_BRANCHES } from '../data/bitsBranches.ts';
import ImageCropper from '../components/ImageCropper';
import FollowListModal from '../components/FollowListModal';

const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const { posts, loading: postsLoading } = usePosts();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTogglingFollow, setIsTogglingFollow] = useState(false);

    const [followModalState, setFollowModalState] = useState<{
        isOpen: boolean;
        listType: 'followers' | 'following' | null;
    }>({ isOpen: false, listType: null });

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

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);
    
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

    if (profileLoading || postsLoading) {
        return <div className="flex items-center justify-center h-screen"><Spinner /></div>;
    }
    
    if (!profile) {
        return <div className="text-center py-10 text-xl text-red-400">User not found.</div>;
    }
    
    const userPosts = posts.filter(post => post.user_id === profile.user_id);
    const isOwnProfile = currentUser?.id === profile.user_id;

    let graduationYear = null;
    if (profile.admission_year && profile.branch && profile.campus) {
        const isMsc = isMscBranch(profile.branch, profile.campus);
        graduationYear = profile.admission_year + (isMsc ? 5 : 4);
    }
    
    const dormInfo = profile.dorm_building ? `${profile.dorm_building}${profile.dorm_room ? `, Room ${profile.dorm_room}` : ''}` : null;

    return (
        <>
            {isEditModalOpen && profile && (
                <EditProfileModal userProfile={profile} onClose={() => setIsEditModalOpen(false)} onSave={fetchProfileData} />
            )}
            
            {followModalState.isOpen && profile && followModalState.listType && (
                <FollowListModal
                    profile={profile}
                    listType={followModalState.listType}
                    onClose={() => setFollowModalState({ isOpen: false, listType: null })}
                />
            )}
            
            <div className="w-full max-w-7xl mx-auto">
                {/* Banner Section */}
                <div className="relative bg-secondary-light dark:bg-secondary">
                    {/* ... (Banner content, avatar, name, buttons remain the same) ... */}
                    <div className="h-64 sm:h-80 bg-tertiary-light dark:bg-tertiary">
                        {profile.banner_url && <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10"></div>
                    <div className="absolute left-4 sm:left-6 -bottom-16 z-20">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-primary-light dark:border-primary bg-gray-700">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center text-4xl font-bold">
                                    {(profile.full_name || '?').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="absolute bottom-4 left-40 sm:left-48 text-white z-20" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                        <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                        <p className="text-gray-200">@{profile.username}</p>
                    </div>
                    <div className="absolute bottom-4 right-4 sm:right-6 z-20">
                        {isOwnProfile ? (
                            <button onClick={() => setIsEditModalOpen(true)} className="bg-tertiary-light/80 dark:bg-tertiary/80 text-text-main-light dark:text-white font-bold py-2 px-4 rounded-full hover:bg-gray-300/80 dark:hover:bg-gray-600/80">Edit Profile</button>
                        ) : (
                            <button onClick={handleFollowToggle} disabled={isTogglingFollow} className={`font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50 ${profile.is_following ? 'bg-transparent border border-gray-400 text-text-main-light dark:text-white hover:border-red-500 hover:text-red-500' : 'bg-white text-black hover:bg-gray-200'}`}>
                                {isTogglingFollow ? <Spinner /> : (profile.is_following ? 'Following' : 'Follow')}
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 px-4 sm:px-6">
                    
                    {/* Left Column: Profile Info */}
                    <div className="lg:col-span-1 space-y-4 mt-24"> 
                        {/* ... (About, Following/Followers, Roomies, etc. content remains the same) ... */}
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
                        {profile.roommates && profile.roommates.length > 0 && (
                            <div className="text-sm text-text-tertiary-light dark:text-text-tertiary flex items-center flex-wrap">
                                <span>🏠 Roomies with </span>
                                {profile.roommates.map((roommate, index) => (
                                <React.Fragment key={roommate.user_id}>
                                    <Link to={`/profile/${roommate.username}`} className="text-brand-green hover:underline ml-1">
                                    @{roommate.username}
                                    </Link>
                                    {index < profile.roommates.length - 1 && ', '}
                                </React.Fragment>
                                ))}
                                ?
                            </div>
                        )}
                        <div className="flex items-center space-x-2 text-sm text-text-tertiary-light dark:text-text-tertiary">
                            {profile.campus && <span>{profile.campus} Campus</span>}
                            {graduationYear && <span className="text-gray-500">&middot;</span>}
                            {graduationYear && <span>Class of {graduationYear}</span>}
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
                    </div>

                    {/* Right Column: Posts */}
                    {/* --- THIS IS THE FIX --- */}
                    <div className="lg:col-span-2 mt-8 lg:mt-24"> 
                        <h2 className="text-xl font-bold">Posts</h2>
                        <div className="mt-4 space-y-4">
                            {userPosts.length > 0 
                                ? userPosts.map(post => <PostComponent key={post.id} post={post} />) 
                                : <p className="text-center text-text-tertiary-light dark:text-text-tertiary py-8 bg-secondary-light dark:bg-secondary rounded-lg">No posts yet.</p>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// --- THIS COMPONENT IS NOW INCLUDED AND FULLY THEME-AWARE ---
const EditProfileModal: React.FC<{ userProfile: Profile, onClose: () => void, onSave: () => void }> = ({ userProfile, onClose, onSave }) => {
    const { user } = useAuth();
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

            const { error: updateError } = await supabase.from('profiles').update({
                full_name: profileData.full_name, bio: profileData.bio, branch: profileData.branch,
                dual_degree_branch: profileData.dual_degree_branch || null, relationship_status: profileData.relationship_status,
                dorm_building: profileData.dorm_building, dorm_room: profileData.dorm_room, dining_hall: profileData.dining_hall,
                avatar_url, banner_url, updated_at: new Date().toISOString(),
            }).eq('user_id', user.id);

            if (updateError) throw updateError;
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