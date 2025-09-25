import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';

interface CreatePostProps {
    onPostCreated: (post: any) => void;
}

const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 001.553.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>;

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
    const { user, profile } = useAuth();
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

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
        let fileUrl: string | null = null;

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
                
                fileUrl = urlData.publicUrl;
            }

            const { data: newPost, error: insertError } = await supabase
                .from('posts')
                .insert({ user_id: user.id, content, image_url: fileUrl })
                .select('*, profiles(*)')
                .single();

            if (insertError) throw insertError;
            
            onPostCreated({ ...newPost, like_count: 0, user_has_liked: false, comment_count: 0 });
            setContent('');
            setFile(null);
            setPreview(null);
            if(imageInputRef.current) imageInputRef.current.value = "";
            if(videoInputRef.current) videoInputRef.current.value = "";
        } catch (error: any) {
            setError(error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-dark-secondary rounded-lg">
            <div className="flex space-x-4">
                <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username}&background=E53E3E&color=fff`} alt="avatar" className="w-11 h-11 rounded-full bg-dark-tertiary" />
                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`What's on your mind, ${profile?.full_name?.split(' ')[0] || profile?.username}?`}
                        className="w-full bg-transparent placeholder-gray-500 focus:outline-none resize-none text-lg"
                        rows={2}
                    />
                    {preview && (
                        <div className="mt-3 relative">
                            <img src={preview} alt="Preview" className="rounded-lg max-h-80 w-auto" />
                            <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-2 right-2 bg-black/60 text-white rounded-full h-6 w-6 flex items-center justify-center text-lg">&times;</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-dark-tertiary">
                <div className="flex items-center space-x-4 text-gray-400">
                    <button onClick={() => imageInputRef.current?.click()} className="flex items-center space-x-2 hover:text-bits-red">
                        <ImageIcon /> <span>Image</span>
                    </button>
                    <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} ref={imageInputRef} />
                    {/* Video upload can be enabled here */}
                    {/* <button onClick={() => videoInputRef.current?.click()} className="flex items-center space-x-2 hover:text-bits-red">
                        <VideoIcon /> <span>Video</span>
                    </button>
                    <input id="video-upload" type="file" className="hidden" accept="video/*" onChange={handleFileChange} ref={videoInputRef} /> */}
                </div>
                <button
                    onClick={handlePost}
                    disabled={loading || (!content.trim() && !file)}
                    className="bg-bits-red hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md disabled:bg-red-900 disabled:cursor-not-allowed transition-colors duration-200"
                >
                    {loading ? <Spinner /> : 'Post'}
                </button>
            </div>
            {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
        </div>
    );
};

export default CreatePost;