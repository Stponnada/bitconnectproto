// src/pages/Profile.tsx (Complete and Corrected)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import PostComponent from '../components/Post';
import { Post as PostType, Profile } from '../types';
import Spinner from '../components/Spinner';
import { CameraIcon } from '../components/icons';
import { isMscBranch, BITS_BRANCHES } from '../data/bitsBranches.ts'; // Corrected path alias

// Main Page Component
const ProfilePage: React.FC = () => {
    const { username } = useParams<{ username: string }>();
    const { user: currentUser } = useAuth();
    const { posts, loading: postsLoading } = usePosts();

    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTogglingFollow, setIsTogglingFollow] = useState(false);

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
          await supabase.from('followers').delete().match({
            follower_id: currentUser.id,
            following_id: profile.user_id,
          });
        } else {
          await supabase.from('followers').insert({
            follower_id: currentUser.id,
            following_id: profile.user_id,
          });
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
            
            <div className="w-full">
                <div className="h-48 sm:h-64 bg-dark-tertiary border-b-4 border-dark-primary">{profile.banner_url && <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />}</div>
                <div className="px-4 sm:px-6 relative bg-dark-secondary pb-10">
                    <div className="flex items-end -mt-16 sm:-mt-20">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-dark-secondary bg-gray-700 flex-shrink-0">
                            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name || ''} className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center text-4xl font-bold">{(profile.full_name || '?').charAt(0).toUpperCase()}</div>}
                        </div>
                        <div className="ml-auto pb-4 flex items-center space-x-4">
                            {isOwnProfile ? (
                                <button onClick={() => setIsEditModalOpen(true)} className="bg-dark-tertiary text-white font-bold py-2 px-4 rounded-full hover:bg-gray-600">Edit Profile</button>
                            ) : (
                                <button onClick={handleFollowToggle} disabled={isTogglingFollow} className={`font-bold py-2 px-6 rounded-full transition-colors disabled:opacity-50 ${profile.is_following ? 'bg-transparent border border-gray-500 text-white hover:border-red-500 hover:text-red-500' : 'bg-white text-black hover:bg-gray-200'}`}>
                                  {isTogglingFollow ? <Spinner /> : (profile.is_following ? 'Following' : 'Follow')}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="mt-4">
                        <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                        <p className="text-gray-400">@{profile.username}</p>
                        <div className="mt-3 flex items-center space-x-4 text-sm">
                            <p><span className="font-bold text-white">{profile.following_count}</span> <span className="text-gray-400">Following</span></p>
                            <p><span className="font-bold text-white">{profile.follower_count}</span> <span className="text-gray-400">Followers</span></p>
                        </div>
                        <div className="mt-2 flex items-center space-x-2 text-sm text-gray-400">
                            {profile.campus && <span>{profile.campus} Campus</span>}
                            {graduationYear && <span className="text-gray-500">&middot;</span>}
                            {graduationYear && <span>Class of {graduationYear}</span>}
                        </div>
                    </div>
                    {profile.bio && <p className="mt-4 text-gray-300 whitespace-pre-wrap">{profile.bio}</p>}
                    <hr className="border-gray-700 my-6" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <ProfileDetail label="Primary Degree" value={profile.branch} />
                        <ProfileDetail label="B.E. Degree" value={profile.dual_degree_branch} />
                        <ProfileDetail label="Relationship Status" value={profile.relationship_status} />
                        <ProfileDetail label="Dorm" value={dormInfo} />
                        <ProfileDetail label="Dining Hall" value={profile.dining_hall} />
                    </div>
                    <div className="mt-8">
                        <h2 className="text-xl font-bold border-b border-gray-700 pb-2">Posts</h2>
                        <div className="mt-4 space-y-4">{userPosts.length > 0 ? (userPosts.map(post => <PostComponent key={post.id} post={post} />)) : (<p className="text-center text-gray-500 py-8">No posts yet.</p>)}</div>
                    </div>
                </div>
            </div>
        </>
    );
};

// Updated Edit Profile Modal Component
const EditProfileModal: React.FC<{ userProfile: Profile, onClose: () => void, onSave: () => void }> = ({ userProfile, onClose, onSave }) => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(userProfile);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile.avatar_url);
    const [bannerPreview, setBannerPreview] = useState<string | null>(userProfile.banner_url);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

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
            const previewUrl = URL.createObjectURL(file);
            if (type === 'avatar') {
                setAvatarFile(file);
                setAvatarPreview(previewUrl);
            } else {
                setBannerFile(file);
                setBannerPreview(previewUrl);
            }
        }
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
        setIsSaving(true);
        setError('');
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

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: profileData.full_name,
                    bio: profileData.bio,
                    branch: profileData.branch,
                    dual_degree_branch: profileData.dual_degree_branch || null,
                    relationship_status: profileData.relationship_status,
                    dorm_building: profileData.dorm_building,
                    dorm_room: profileData.dorm_room,
                    dining_hall: profileData.dining_hall,
                    avatar_url,
                    banner_url,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);

            if (updateError) throw updateError;
            
            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-dark-secondary rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-2xl font-bold text-brand-green mb-6">Edit Profile</h2>
                    <div className="relative h-48 bg-dark-tertiary rounded-t-lg mb-16">
                        {bannerPreview && <img src={bannerPreview} className="w-full h-full object-cover rounded-t-lg" alt="Banner Preview"/>}
                        <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><CameraIcon className="w-8 h-8 text-white" /></button>
                        <input type="file" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" hidden />
                        <div className="absolute -bottom-16 left-6 w-32 h-32 rounded-full border-4 border-dark-secondary bg-gray-600">
                            {avatarPreview && <img src={avatarPreview} className="w-full h-full rounded-full object-cover" alt="Avatar Preview"/>}
                            <button type="button" onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 rounded-full transition-opacity"><CameraIcon className="w-8 h-8 text-white" /></button>
                            <input type="file" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" hidden />
                        </div>
                    </div>
                    {error && <p className="text-red-400 mb-4">{error}</p>}
                    <div className="space-y-4 pt-4">
                        <div><label className="block text-sm font-medium text-gray-400">Full Name</label><input type="text" name="full_name" value={profileData.full_name || ''} onChange={handleChange} className="mt-1 block w-full bg-dark-tertiary rounded p-2 text-white border border-gray-600 focus:ring-brand-green focus:border-brand-green" /></div>
                        <div><label className="block text-sm font-medium text-gray-400">Bio</label><textarea name="bio" value={profileData.bio || ''} onChange={handleChange} rows={3} className="mt-1 block w-full bg-dark-tertiary rounded p-2 text-white border border-gray-600 focus:ring-brand-green focus:border-brand-green" /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-400">Primary Degree</label>
                                <select name="branch" value={profileData.branch || ''} onChange={handleChange} className="mt-1 block w-full bg-dark-tertiary rounded p-2 text-white border border-gray-600 focus:ring-brand-green focus:border-brand-green">
                                    <option value="">Select Branch</option>
                                    {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            {isDualDegreeStudent && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400">B.E. Degree</label>
                                    <select name="dual_degree_branch" value={profileData.dual_degree_branch || ''} onChange={handleChange} className="mt-1 block w-full bg-dark-tertiary rounded p-2 text-white border border-gray-600 focus:ring-brand-green focus:border-brand-green">
                                        <option value="">Select B.E. Branch</option>
                                        {profileData.campus && BITS_BRANCHES[profileData.campus]['B.E.'].map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            )}
                            <div><label className="block text-sm font-medium text-gray-400">Relationship Status</label><select name="relationship_status" value={profileData.relationship_status || ''} onChange={handleChange} className="mt-1 block w-full bg-dark-tertiary rounded p-2 text-white border border-gray-600 focus:ring-brand-green focus:border-brand-green"><option value="">Select Status</option><option value="Single">Single</option><option value="In a relationship">In a relationship</option><option value="It's complicated">It's complicated</option><option value="Married">Married</option></select></div>
                            <div><label className="block text-sm font-medium text-gray-400">Dorm Building</label><input type="text" name="dorm_building" placeholder="e.g., Valmiki" value={profileData.dorm_building || ''} onChange={handleChange} className="mt-1 block w-full bg-dark-tertiary rounded p-2 text-white border border-gray-600 focus:ring-brand-green focus:border-brand-green" /></div>
                            <div><label className="block text-sm font-medium text-gray-400">Dorm Room</label><input type="text" name="dorm_room" placeholder="e.g., 469" value={profileData.dorm_room || ''} onChange={handleChange} className="mt-1 block w-full bg-dark-tertiary rounded p-2 text-white border border-gray-600 focus:ring-brand-green focus:border-brand-green" /></div>
                            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-400">Dining Hall</label><select name="dining_hall" value={profileData.dining_hall || ''} onChange={handleChange} className="mt-1 block w-full bg-dark-tertiary rounded p-2 text-white border border-gray-600 focus:ring-brand-green focus:border-brand-green"><option value="">Select Mess</option><option value="Mess 1">Mess 1</option><option value="Mess 2">Mess 2</option></select></div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-6"><button type="button" onClick={onClose} className="py-2 px-6 rounded-full text-white hover:bg-gray-700">Cancel</button><button type="submit" disabled={isSaving} className="py-2 px-6 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50">{isSaving ? <Spinner /> : 'Save Changes'}</button></div>
                </form>
            </div>
        </div>
    );
};

// Helper Component
const ProfileDetail: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
    if (!value) return null;
    return (<div><span className="font-semibold text-gray-200">{label}: </span><span className="text-gray-400">{value}</span></div>);
};

export default ProfilePage;