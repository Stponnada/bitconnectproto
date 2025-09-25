
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import Spinner from '../components/Spinner';

const Settings: React.FC = () => {
    const { user, profile, loading: authLoading } = useAuth();
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setUsername(profile.username || '');
            setBio(profile.bio || '');
            setAvatarPreview(profile.avatar_url || null);
        }
    }, [profile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAvatarFile(e.target.files[0]);
            setAvatarPreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setMessage('');

        try {
            let avatarUrl = profile?.avatar_url;
            if (avatarFile) {
                const filePath = `public/${user.id}`;
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true });
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                avatarUrl = `${urlData.publicUrl}?t=${new Date().getTime()}`; // Add timestamp to bust cache
            }

            const updates = {
                id: user.id,
                full_name: fullName,
                username,
                bio,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            setMessage('Profile updated successfully!');
            // Optional: force reload auth context or redirect
        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    if (authLoading) return <div className="flex justify-center p-8"><Spinner /></div>

    return (
        <div className="p-4">
            <h1 className="text-xl font-bold mb-6">Settings</h1>
            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg mx-auto">
                <div className="flex items-center space-x-6">
                    <img src={avatarPreview || `https://picsum.photos/seed/${user?.id}/128`} alt="Avatar" className="w-24 h-24 rounded-full bg-gray-700" />
                    <label htmlFor="avatar-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-full">
                        Change Avatar
                    </label>
                    <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-400">Full Name</label>
                    <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                 <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-400">Username</label>
                    <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                 <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-400">Bio</label>
                    <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-1 w-full px-4 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"></textarea>
                </div>
                <div>
                    <button type="submit" disabled={loading} className="w-full py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors duration-200 disabled:bg-gray-500">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
                {message && <p className={`text-center ${message.startsWith('Error') ? 'text-red-500' : 'text-green-400'}`}>{message}</p>}
            </form>
        </div>
    );
};

export default Settings;
