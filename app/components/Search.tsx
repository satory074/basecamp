import React from 'react';

const Search = () => {
  return (
    <div className="search-container flex items-center">
      <input
        type="text"
        placeholder="Search..."
        className="search-input rounded-md px-2 py-1 mr-2"
      />
      <button className="search-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">Search</button>
    </div>
  );
};

export default Search;
