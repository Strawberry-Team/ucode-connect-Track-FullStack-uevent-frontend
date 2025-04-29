import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Tag, ArrowRight, Clock } from 'lucide-react';
import { companyService } from '../services/companyService';

const CompanyEventsSection = ({ event, maxEvents = 3 }) => {
  const [companyEvents, setCompanyEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Keeping the original data fetching logic exactly as it was
  useEffect(() => {
    const fetchCompanyEvents = async () => {
      if (!event?.companyId) return;
      
      try {
        setIsLoading(true);
        const events = await companyService.getCompanyEvents(event.companyId.toString());
        
        // Filter to exclude current event and limit quantity
        const filteredEvents = events
          .filter(e => e.id !== event.id)
          .slice(0, maxEvents);
          
        setCompanyEvents(filteredEvents);
      } catch (error) {
        console.error('Error fetching company events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompanyEvents();
  }, [event?.companyId, event?.id, maxEvents]);

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get image URL function
  const getImageUrl = (path) => {
    if (!path) return null;
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}/uploads/event-posters/${path}`;
  };

  // Helper function for status badge styling
  const getStatusClass = (status) => {
    switch(status) {
      case 'PUBLISHED':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'FINISHED':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      case 'SALES_STARTED':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ONGOING':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    }
  };

  // Helper function to translate status to English
  const getStatusText = (status) => {
    switch(status) {
      case 'PUBLISHED': return 'Published';
      case 'CANCELLED': return 'Cancelled';
      case 'FINISHED': return 'Finished';
      case 'SALES_STARTED': return 'Tickets On Sale';
      case 'ONGOING': return 'In Progress';
      default: return 'Draft';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3 animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden animate-pulse shadow">
                <div className="h-48 bg-gray-200 dark:bg-gray-600"></div>
                <div className="p-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded-lg w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-lg w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-lg w-5/6 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-lg w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded-lg w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state (no results)
  if (companyEvents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <span className="w-1 h-6 bg-emerald-500 rounded-full mr-3"></span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">More from {event.company?.title || 'this organizer'}</h2>
        </div>
        {companyEvents.length > 0 && (
          <Link href={`/companies/${event.companyId}`} className="text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center group">
            View all
            <ArrowRight className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {companyEvents.map((companyEvent) => (
            <Link href={`/events/${companyEvent.id}`} key={companyEvent.id}>
              <div className="group bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-600 h-full flex flex-col transform hover:-translate-y-1">
                <div className="h-48 bg-gray-100 dark:bg-gray-600 relative overflow-hidden">
                  {companyEvent.posterName ? (
                    <img 
                      src={getImageUrl(companyEvent.posterName)} 
                      alt={companyEvent.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-600 dark:from-emerald-600 dark:to-teal-800">
                      <span className="text-white text-4xl font-bold opacity-20">{companyEvent.title.charAt(0)}</span>
                    </div>
                  )}
                  
                  {/* Date badge */}
                  <div className="absolute top-3 left-3 bg-white dark:bg-gray-900 shadow-md rounded-lg p-1.5 text-center w-14">
                    <div className="text-xs font-semibold bg-emerald-600 text-white rounded-t-sm -mt-1 -mx-1 py-0.5">
                      {new Date(companyEvent.startedAt).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                      {new Date(companyEvent.startedAt).getDate()}
                    </div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 -mb-1">
                      {new Date(companyEvent.startedAt).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(companyEvent.status)}`}>
                      {getStatusText(companyEvent.status)}
                    </span>
                  </div>
                  
                  {/* Format badge - if available */}
                  {companyEvent.format && (
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                      {companyEvent.format.title}
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex-grow flex flex-col">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {companyEvent.title}
                  </h3>
                  
                  {/* Themes - if available */}
                  {companyEvent.themes && companyEvent.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {companyEvent.themes.slice(0, 2).map(theme => (
                        <span key={theme.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <Tag className="w-3 h-3 mr-1" />
                          {theme.title}
                        </span>
                      ))}
                      {companyEvent.themes.length > 2 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">+{companyEvent.themes.length - 2}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-600 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-1.5 text-emerald-500 dark:text-emerald-400" />
                        <span>
                          {new Date(companyEvent.startedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-1.5 text-emerald-500 dark:text-emerald-400" />
                      <span className="truncate">{companyEvent.venue}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyEventsSection;