// src/utils/renderEmbeds.tsx

import React from 'react';
import { Tweet } from 'react-tweet';
import { renderWithMentions } from './renderMentions';

const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9\-_]{11})/;
const TWITTER_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:[a-zA-Z0-9_]+)\/status\/(\d+)/;

const YouTubeEmbed: React.FC<{ videoId: string }> = ({ videoId }) => (
  <div className="my-4 rounded-lg overflow-hidden">
    <div className="relative" style={{ paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  </div>
);

export const renderContentWithEmbeds = (text: string): React.ReactNode[] => {
  if (!text) return [];

  const lines = text.split('\n');

  return lines.map((line, index) => {
    const youtubeMatch = line.match(YOUTUBE_REGEX);
    if (youtubeMatch && youtubeMatch[1]) {
      return <YouTubeEmbed key={`yt-${index}`} videoId={youtubeMatch[1]} />;
    }

    const twitterMatch = line.match(TWITTER_REGEX);
    if (twitterMatch && twitterMatch[1]) {
      return (
        // --- THE DEFINITIVE FIX: Using 'grid' and 'place-items-center' ---
        <div key={`tweet-${index}`} className="my-4 grid place-items-center">
          <Tweet id={twitterMatch[1]} />
        </div>
      );
    }

    if (line.trim() === '') {
        return null;
    }
    
    return (
      <p key={`text-${index}`} className="whitespace-pre-wrap">
        {renderWithMentions(line)}
      </p>
    );
  });
};