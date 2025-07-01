import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBlog } from '@fortawesome/free-solid-svg-icons';

export default function HatenaBlogWidget() {
  const blogId = "satory074"; // Replace with the actual Hatena Blog ID
  const profileUrl = `https://${blogId}.hatenablog.com/`;

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-2">Hatena Blog</h2>
      <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center">
        <FontAwesomeIcon icon={faBlog} className="w-6 h-6 mr-2" />
        <p className="text-gray-600 dark:text-gray-300">{blogId}</p>
      </a>
    </div>
  );
}
