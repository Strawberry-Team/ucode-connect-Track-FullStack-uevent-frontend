import React, { useState } from 'react';
import Link from 'next/link';
import { EventNewsModal } from './EventNewsModal';

interface CompactEventCardProps {
  event: {
    id: number;
    title: string;
    description: string;
    venue: string;
    startedAt: string;
    endedAt: string;
    posterName?: string;
    status: string;
  };
  getImageUrlEventPosters: (path: string | undefined) => string | null;
}

export const CompactEventCard: React.FC<CompactEventCardProps> = ({ event, getImageUrlEventPosters }) => {
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);

  const openNewsModal = () => setIsNewsModalOpen(true);
  const closeNewsModal = () => setIsNewsModalOpen(false);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-400 dark:border-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800';
      case 'DRAFT':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-400 dark:border-yellow-800';
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="relative h-48 w-full overflow-hidden bg-gray-200 dark:bg-gray-800">
          {event.posterName ? (
            <img 
              src={getImageUrlEventPosters(event.posterName)} 
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          )}
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
              {event.status}
            </span>
          </div>

          <div className="absolute top-3 left-3">
            <button 
              onClick={openNewsModal}
              className="flex items-center justify-center h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md transition-colors"
              title="Create event news"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M12 18v-6"></path>
                <path d="M9 15h6"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-5">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 truncate">
            <Link href={`/events/${event.id}`}>
              <span className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                {event.title}
              </span>
            </Link>
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span className="text-sm truncate">
                {formatDate(event.startedAt)} - {formatDate(event.endedAt)}
              </span>
            </div>
            
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span className="text-sm truncate">{event.venue}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Link 
              href={`/events/${event.id}`}
              className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg py-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              View
            </Link>
            
            <Link 
              href={`/events/${event.id}/edit`}
              className="flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 font-medium rounded-lg py-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
              Edit
            </Link>
            
            <button
              onClick={openNewsModal}
              className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-medium rounded-lg py-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              News
            </button>
          </div>
        </div>
      </div>

      <EventNewsModal 
        isOpen={isNewsModalOpen} 
        onClose={closeNewsModal} 
        eventId={event.id} 
        eventTitle={event.title}
      />
    </>
  );
};

