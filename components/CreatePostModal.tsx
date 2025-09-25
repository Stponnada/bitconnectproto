import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';

interface CreatePostModalProps {
    onClose: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose }) => {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handlePost = async () => {
        if (!file) {
            setError('Please select an image to post.');
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
            const filePath = `public/${user.id}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('Post-Images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('Post-Images')
                .getPublicUrl(filePath);
            
            imageUrl = urlData.publicUrl;

            const { error: insertError } = await supabase
                .from('posts')
                .insert({
                    user_id: user.id,
                    content: caption,
                    image_url: imageUrl,
                });

            if (insertError) throw insertError;
            
            document.dispatchEvent(new CustomEvent('postCreated'));
            onClose();
        } catch (error: any) {
            setError(error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-lg w-11/12 max-w-2xl text-white" onClick={(e) => e.stopPropagation()}>
                <div className="text-center py-3 border-b border-gray-800 font-semibold">
                    Create new post
                </div>
                <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
                    {preview ? (
                        <div className="w-full">
                           <img src={preview} alt="Preview" className="w-full h-auto max-h-96 object-contain rounded" />
                           <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Write a caption..."
                                className="w-full bg-transparent p-2 mt-4 focus:outline-none"
                                rows={3}
                           />
                            <div className="flex justify-end gap-4 mt-4">
                               <button onClick={onClose} className="text-gray-400">Cancel</button>
                               <button onClick={handlePost} disabled={loading} className="text-blue-500 font-semibold disabled:text-blue-300">
                                   {loading ? <Spinner /> : 'Share'}
                               </button>
                           </div>
                        </div>
                    ) : (
                        <>
                            <i className="fa-regular fa-images text-6xl mb-4"></i>
                            <h2 className="text-xl">Drag photos here</h2>
                            <button onClick={() => fileInputRef.current?.click()} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
                                Select from computer
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </>
                    )}
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;