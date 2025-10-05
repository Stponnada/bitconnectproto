// src/components/ImageCropper.tsx

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import Spinner from './Spinner';

interface ImageCropperProps {
  imageSrc: string;
  aspect: number; // e.g., 1 for square, 3 / 1 for banner
  cropShape: 'rect' | 'round';
  onSave: (croppedImageFile: File) => void;
  onClose: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, aspect, cropShape, onSave, onClose }) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(croppedImageFile);
    } catch (e) {
      console.error('Error cropping image:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg h-[60vh] bg-dark-primary rounded-lg">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={cropShape}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="w-full max-w-lg p-4 space-y-4">
        <div className="flex items-center space-x-2 text-white">
          <span>Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="py-2 px-6 rounded-full text-white hover:bg-gray-700">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="py-2 px-6 rounded-full text-black bg-brand-green hover:bg-brand-green-darker disabled:opacity-50"
          >
            {isSaving ? <Spinner /> : 'Set Image'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;