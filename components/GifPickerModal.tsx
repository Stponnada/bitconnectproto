// src/components/GifPickerModal.tsx

import React, { useState, useEffect, useCallback } from 'react';
import Spinner from './Spinner';
import { XCircleIcon } from './icons';

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;

interface Gif {
  id: string;
  url: string;
  images: {
    fixed_width: {
      url: string;
      width: string;
      height: string;
    };
  };
}

interface GifPickerModalProps {
  onClose: () => void;
  onGifSelect: (gifUrl: string) => void;
}

const GifPickerModal: React.FC<GifPickerModalProps> = ({ onClose, onGifSelect }) => {
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGifs = useCallback(async (term: string) => {
    setLoading(true);
    const endpoint = term
      ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${term}&limit=24`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24`;
    
    try {
      const res = await fetch(endpoint);
      const { data } = await res.json();
      setGifs(data);
    } catch (error) {
      console.error("Failed to fetch GIFs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchGifs(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, fetchGifs]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg w-full max-w-2xl max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-4 border-b border-tertiary-light dark:border-tertiary">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Choose a GIF</h2>
            <button onClick={onClose}><XCircleIcon className="w-8 h-8 text-text-tertiary-light dark:text-text-tertiary" /></button>
          </div>
          <input
            type="text"
            placeholder="Search Giphy for GIFs and Stickers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full mt-3 p-2 bg-primary-light dark:bg-primary border border-tertiary-light dark:border-gray-600 rounded-lg text-sm"
            autoFocus
          />
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          {loading ? <div className="flex justify-center p-8"><Spinner /></div> : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {gifs.map(gif => (
                <button key={gif.id} onClick={() => onGifSelect(gif.images.fixed_width.url)} className="aspect-square">
                  <img src={gif.images.fixed_width.url} alt="GIF" className="w-full h-full object-cover rounded-md" />
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GifPickerModal;