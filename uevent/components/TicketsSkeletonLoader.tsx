import React from 'react';

const TicketsSkeletonLoader = ({ orderCount = 5 }) => {
  return (
    <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
      <div className="p-4 md:p-6">
        {/* Header section */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
        </div>

        {/* Multiple Order Skeletons */}
        {[...Array(orderCount)].map((_, index) => (
          <div 
            key={index} 
            className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm"
          >
            {/* Order Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
            </div>

            {/* Order Content */}
            <div className="flex items-center space-x-4">
              {/* Calendar Icon Placeholder */}
              <div className="h-12 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              
              {/* Event Details */}
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
              </div>
              
              {/* View Event Button Placeholder */}
              <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>

            {/* Ticket Count Dropdown Placeholder */}
            <div className="mt-4 h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
          </div>
        ))}

        {/* Additional Padding to Extend Length */}
        <div className="h-24 bg-transparent"></div>
      </div>
    </div>
  );
};

export default TicketsSkeletonLoader;