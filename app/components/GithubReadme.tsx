import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const GithubReadme = () => {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReadme = async () => {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/satory074/satory074/main/README.md'
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        setMarkdown(text);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReadme();
  }, []);

  if (loading) {
    return <p>Loading README...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <ReactMarkdown>
      {markdown}
    </ReactMarkdown>
  );
};

export default GithubReadme;
