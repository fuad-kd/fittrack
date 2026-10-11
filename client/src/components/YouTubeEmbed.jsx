import React from 'react';
import './YouTubeEmbed.css';

/**
 * Renders a responsive YouTube iframe embed.
 * @param {string} videoId  - The YouTube video ID (e.g. "dQw4w9WgXcQ")
 * @param {string} title    - Accessible title for the iframe
 */
export default function YouTubeEmbed({ videoId, title = 'YouTube video' }) {
  return (
    <div className="yt-embed-container">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
