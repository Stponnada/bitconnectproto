
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

interface CreatePostProps {
    onPostCreated: (post: any) => void;
}

const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
    const { user, profile } = useAuth();
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handlePost = async () => {
        if (!content.trim() && !file) {
            setError('Post cannot be empty.');
            return;
        }
        if (!user) {
            setError('You must be logged in to post.');
            return;
        }

        setLoading(true);
        setError(null);
        let imageUrl: string | null = null;

        try {
            if (file) {
                const filePath = `public/${user.id}/${Date.now()}-${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('Post-Images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('Post-Images')
                    .getPublicUrl(filePath);
                
                imageUrl = urlData.publicUrl;
            }

            const { data: newPost, error: insertError } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    content,
                    image_url: imageUrl,
                })
                .select('*, profiles(*)')
                .single();

            if (insertError) throw insertError;
            
            onPostCreated(newPost);
            setContent('');
            setFile(null);
            setPreview(null);
        } catch (error: any) {
            setError(error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border-b border-gray-800">
            <div className="flex space-x-4">
                <img src={profile?.avatar_url || `https://picsum.photos/seed/${user?.id}/50`} alt="avatar" className="w-12 h-12 rounded-full bg-gray-700" />
                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's happening?"
                        className="w-full bg-transparent text-lg placeholder-gray-500 focus:outline-none resize-none"
                        rows={2}
                    />
                    {preview && (
                        <div className="mt-2 relative">
                            <img src={preview} alt="Preview" className="rounded-lg max-h-80 w-auto" />
                            <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">&times;</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-between items-center mt-4">
                <div>
                    <label htmlFor="file-upload" className="cursor-pointer p-2 rounded-full hover:bg-green-500/10">
                        <ImageIcon />
                    </label>
                    <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
                <button
                    onClick={handlePost}
                    disabled={loading || (!content.trim() && !file)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {loading ? 'Posting...' : 'Post'}
                </button>
            </div>
            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
    );
};

export default CreatePost;
