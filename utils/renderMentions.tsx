// src/utils/renderMentions.tsx

import React from 'react';
import { Link } from 'react-router-dom';

export const renderWithMentions = (text: string): React.ReactNode[] => {
  const mentionRegex = /@(\w+)/g;
  const parts = text.split(mentionRegex);

  return parts.map((part, index) => {
    // Every odd-indexed part is a username
    if (index % 2 === 1) {
      return (
        <Link
          key={index}
          to={`/profile/${part}`}
          className="text-brand-green hover:underline"
          onClick={(e) => e.stopPropagation()} // Prevent triggering post link
        >
          @{part}
        </Link>
      );
    }
    // Even-indexed parts are regular text
    return part;
  });
};