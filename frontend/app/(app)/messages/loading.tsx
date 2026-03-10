import React from 'react';

export default function MessagesLoading() {
  return (
    <div className="h-[calc(100vh-200px)] flex animate-pulse">
      {/* Conversations list skeleton */}
      <div className="w-full md:w-1/3 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Message thread skeleton - hidden on mobile */}
      <div className="hidden md:flex flex-1 flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs space-y-2 ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
                <div className="h-16 bg-gray-200 rounded-lg w-48" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
