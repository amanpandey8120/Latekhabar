import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="animate-pulse flex flex-col gap-3 rounded-lg p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1e1e]">
      <div className="w-full h-48 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
    </div>
  );
};

export const SkeletonHero: React.FC = () => {
  return (
    <div className="animate-pulse flex flex-col gap-4">
      <div className="w-full h-[380px] bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/5"></div>
      <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-4/5"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
    </div>
  );
};
