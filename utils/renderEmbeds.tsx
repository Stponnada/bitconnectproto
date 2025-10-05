// src/utils/renderEmbeds.tsx

import React from 'react';
import { Tweet } from 'react-tweet';
import { renderWithMentions } from './renderMentions';

// Regex to find YouTube and Twitter/X links
const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9\-_]{11})/;
const TWITTER_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:[a-zA-Z0-9_]+)\/status\/(\d+)/;

// A simple, responsive component for YouTube embeds
const YouTubeEmbed: React.FC<{ videoId: string }> = ({ videoId }) => (
  <div className="aspect-w-16 aspect-h-9 my-4 rounded-lg overflow-hidden">
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="w-full h-full"
    ></iframe>
  </div>
);

// The main function to parse and render content
export const renderContentWithEmbeds = (text: string): React.ReactNode[] => {
  if (!text) return [];

  // Split content by newlines to process each line individually
  const lines = text.split('\n');

  return lines.map((line, index) => {
    // Check for YouTube link
    const youtubeMatch = line.match(YOUTUBE_REGEX);
    if (youtubeMatch && youtubeMatch[1]) {
      return <YouTubeEmbed key={`yt-${index}`} videoId={youtubeMatch[1]} />;
    }

    // Check for Twitter/X link
    const twitterMatch = line.match(TWITTER_REGEX);
    if (twitterMatch && twitterMatch[1]) {
      return (
        <div key={`tweet-${index}`} className="my-4 [&>div]:mx-auto">
          <Tweet id={twitterMatch[1]} />
        </div>
      );
    }

    // If no embeddable link, render the line as text with mentions
    // We wrap it in a <p> tag to ensure proper spacing for paragraphs
    if (line.trim() === '') {
        return null; // Don't render empty lines as paragraphs
    }
    
    return (
      <p key={`text-${index}`} className="whitespace-pre-wrap">
        {renderWithMentions(line)}
      </p>
    );
  });
};