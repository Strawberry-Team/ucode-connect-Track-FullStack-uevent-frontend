import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useEvents } from '../../contexts/EventContext';
import { useCompany } from '../../contexts/CompanyContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const EventsPage: React.FC = () => {
  const { events, isLoading: eventsLoading } = useEvents();
  const { company, isLoading: companyLoading } = useCompany();
  
  const isLoading = eventsLoading || companyLoading;
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return dateString;
    }
  };
  
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleTimeString(undefined, options);
    } catch (error) {
      return '';
    }
  };
  
  const getImageUrl = (path: string | undefined) => {
    if (!path) return null;
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}/uploads/event-posters/${path.startsWith('/') ? path.substring(1) : path}`;
  };

  const isUserEvent = (event) => {
    return company && event.companyId === company.id;
  };
  
  return (
    <>
      <Head>
        <title>Events | EventMaster</title>
        <meta name="description" content="Browse and manage events on EventMaster" />
      </Head>
      
      <main className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Discover Events</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                  Find exciting events or create your own
                </p>
              </div>
              
              {company && (
                <Link
                  href="/events/create"
                  className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all transform hover:scale-105"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  Create Event
                </Link>
              )}
            </div>
          </div>
          
          {/* Loading State */}
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
              <div className="p-12 flex flex-col items-center justify-center">
                <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                <p className="mt-6 text-emerald-600 dark:text-emerald-400 font-medium">Loading amazing events...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Company Required Warning */}
              {!company && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 mb-8">
                  <div className="p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                          <line x1="12" y1="9" x2="12" y2="13"></line>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create Your Organization</h3>
                      <p className="mt-2 text-gray-600 dark:text-gray-300">
                        To host your own events, you'll need to create an organization profile. This allows you to manage events, collect registrations, and build your audience.
                      </p>
                      <div className="mt-4">
                        <Link
                          href="/companies"
                          className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>
                          Create Organization
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Events List */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-8 py-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-gray-100 dark:border-gray-700 flex items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upcoming Events</h2>
                </div>
                
                {(!events || events.length === 0) ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-full flex items-center justify-center mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">No Events Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                      {company 
                        ? "You haven't created any events yet. Get started by creating your first event and connect with your audience."
                        : "No events to display. Create a company to start organizing your own events and share amazing experiences."}
                    </p>
                    
                    {company && (
                      <Link
                        href="/events/create"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white text-base font-medium rounded-lg shadow-sm transition-all transform hover:scale-105"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="8" x2="12" y2="16"></line>
                          <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        Create Your First Event
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {events.map(event => (
                      <div key={event.id} className="flex flex-col sm:flex-row p-6 sm:p-8 gap-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        {/* Event Image */}
                        <div className="sm:w-56 h-36 sm:h-40 flex-shrink-0 rounded-xl overflow-hidden shadow-md">
                          {event.posterName ? (
                            <img 
                              src={getImageUrl(event.posterName)} 
                              alt={event.title}
                              className="w-full h-full object-cover transition-transform hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-emerald-400 to-teal-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Event Info */}
                        <div className="flex-1 flex flex-col">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                              <Link
                                href={`/events/${event.id}`}
                                className="text-2xl font-bold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                              >
                                {event.title}
                              </Link>
                              
                              <span className={`self-start px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center ${
                                event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' :
                                event.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'
                              }`}>
                                {event.status === 'PUBLISHED' && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                  </svg>
                                )}
                                {event.status === 'CANCELLED' && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                  </svg>
                                )}
                                {event.status === 'DRAFT' && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                  </svg>
                                )}
                                {event.status}
                              </span>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                              {event.description}
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span>{formatDate(event.startedAt)}</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span>{formatTime(event.startedAt)} - {formatTime(event.endedAt)}</span>
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                  <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <span>{event.venue}</span>
                              </div>
                              
                              {event.format && (
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                  </svg>
                                  <span>{event.format.title}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            <Link 
                              href={`/events/${event.id}`} 
                              className="px-5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 text-sm font-medium rounded-lg transition-colors flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              </svg>
                              View Details
                            </Link>
                            
                            {isUserEvent(event) && (
                              <Link 
                                href={`/events/${event.id}/edit`} 
                                className="px-5 py-2 bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-lg transition-colors flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9"></path>
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                                Edit
                              </Link>
                            )}
                            
                            {event.status === 'PUBLISHED' && (
                              <Link 
                                href={`/events/${event.id}#register`}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center shadow-sm"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                  <line x1="1" y1="10" x2="23" y2="10"></line>
                                </svg>
                                Register
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
};

export default EventsPage;

