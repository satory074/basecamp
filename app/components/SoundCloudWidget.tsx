import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSoundcloud } from '@fortawesome/free-brands-svg-icons';

export default function SoundCloudWidget() {
  const username = "satory074"; // Replace with the actual SoundCloud username
  const profileUrl = `https://soundcloud.com/${username}`;

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-2">SoundCloud</h2>
      <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
        <FontAwesomeIcon icon={faSoundcloud} className="w-6 h-6 mr-2" />
        <p className="text-gray-600 dark:text-gray-300">{username}</p>
      </a>
    </div>
  );
}
