// src/components/LightBox.tsx

import React from 'react';
import { XCircleIcon } from './icons';

interface LightBoxProps {
    imageUrl: string;
    onClose: () => void;
}

const LightBox: React.FC<LightBoxProps> = ({ imageUrl, onClose }) => {
    // Prevents the modal from closing when the image itself is clicked.
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 animate-fadeIn"
            onClick={onClose} // Close the lightbox when clicking the backdrop.
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
                aria-label="Close image view"
            >
                <XCircleIcon className="w-10 h-10" />
            </button>
            
            <div className="relative w-full h-full flex items-center justify-center" onClick={handleContentClick}>
                 <img
                    src={imageUrl}
                    alt="Full size view"
                    className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
                />
            </div>
        </div>
    );
};

export default LightBox;