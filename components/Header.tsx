import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          note Creation Support AI
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          AI SNS投稿ジェネレーター
        </p>
      </div>
    </header>
  );
};
