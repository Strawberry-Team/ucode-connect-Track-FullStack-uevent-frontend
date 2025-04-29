'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import NotificationDropdown from './NotificationDropdown';
import { useNotifications } from '../contexts/NotificationContext';
import axios from 'axios';
import { format } from 'date-fns';

// Define Event type
interface Event {
  id: number;
  title: string;
  description: string;
  venue: string;
  startedAt: string;
  endedAt: string;
  posterName?: string;
  format?: {
    title: string;
  };
}

export default function Header() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { isDarkMode, setTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isAuthenticated = !!user;

  // API base URL
  const API_URL = 'http://localhost:8080/api';

  // Search for events
  const searchEvents = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Get auth headers
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Make API request with search parameters
      const response = await axios.get(`${API_URL}/events`, {
        params: {
          title: query,
          take: 5, // Limit to 5 results in dropdown
        },
        headers
      });
      
      // Update search results
      let eventData: Event[] = [];
      if (response.data.items) {
        eventData = response.data.items;
      } else if (Array.isArray(response.data)) {
        eventData = response.data;
      }

      setSearchResults(eventData);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching events:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Close search
  const closeSearch = () => {
    setIsSearchActive(false);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Handle search input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchEvents(searchQuery);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus search input when search becomes active
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  // Handle Escape key to close search
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSearchActive) {
        closeSearch();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isSearchActive]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  // Format location to show only city/country
  const formatLocation = (venue: string) => {
    // Extract city/country from full address
    // This is a simple example - adjust based on your venue format
    const parts = venue.split(',');
    if (parts.length > 1) {
      return `${parts[parts.length - 2]?.trim()}, ${parts[parts.length - 1]?.trim()}`;
    }
    return venue;
  };

  // Get a truncated description
  const getTruncatedDescription = (description: string) => {
    return description.length > 80 ? description.substring(0, 80) + '...' : description;
  };

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle navigation to event page
  const navigateToEvent = (eventId: number) => {
    router.push(`/events/${eventId}`);
    closeSearch();
    setIsMobileMenuOpen(false);
  };

  // Get image URL with correct domain
  const getImageUrl = (path?: string) => {
    if (!path) return null;
    
    // Check if path is already a full URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // If it's a relative path, prepend the backend URL
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}/uploads/event-posters/${path}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
    router.push('/login');
  };

  // Get user initials
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName ? firstName.charAt(0) : '';
    const last = lastName ? lastName.charAt(0) : '';
    return (first + last).toUpperCase();
  };

  // Sync user data on storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      if (user) {
        refreshUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, refreshUser]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none"
      aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
  
  return (
    <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-0 sm:px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo и бренд */}
          <div className="pl-4 md:pl-6">
            <Link href="/" className="text-xl font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
            TripUp
            </Link>
          </div>

          {/* Десктопная навигация */}
          <div className="hidden md:flex items-center space-x-4">
            {isSearchActive ? (
              <div className="relative w-96" ref={searchRef}>
                <div className="flex items-center relative">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    ref={searchInputRef}
                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 dark:bg-black text-base" 
                    placeholder="Search events..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearchResults(true)}
                  />
                  
                  {/* Close button */}
                  <button 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    onClick={closeSearch}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {isSearching && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-5 w-5 border-t-2 border-emerald-500 rounded-full"></div>
                  </div>
                )}
                
                {/* Search dropdown results */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[500px] overflow-y-auto z-50 border border-gray-200 dark:border-gray-700">
                    {searchResults.map((event) => (
                      <div 
                        key={event.id} 
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                        onClick={() => navigateToEvent(event.id)}
                      >
                        <div className="flex gap-3">
                          {/* Event image or placeholder */}
                          <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-md overflow-hidden flex-shrink-0">
                            {event.posterName ? (
                              <img 
                                src={getImageUrl(event.posterName)} 
                                alt={event.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-emerald-500 font-bold text-xl">
                                {event.title.charAt(0)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">{event.title}</h4>
                              {event.format && (
                                <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 px-2 py-1 rounded-full flex-shrink-0">
                                  {event.format.title}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
                              {getTruncatedDescription(event.description)}
                            </p>
                            
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{formatDate(event.startedAt)}</span>
                              </div>
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate">{formatLocation(event.venue)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* <div className="p-3 text-center border-t border-gray-100 dark:border-gray-700">
                      <Link 
                        href={`/events?search=${encodeURIComponent(searchQuery)}`}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        onClick={() => {
                          setShowSearchResults(false);
                          setIsSearchActive(false);
                        }}
                      >
                        View all results
                      </Link>
                    </div> */}
                  </div>
                )}
                
                {/* No results found */}
                {showSearchResults && searchQuery && searchResults.length === 0 && !isSearching && (
                  <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                    <div className="p-6 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400 mb-1">No events found for</p>
                      <p className="text-gray-900 dark:text-white font-medium">"{searchQuery}"</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <ThemeToggle />
                <button 
                  onClick={() => setIsSearchActive(true)}
                  className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <Link href="/events" className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="hidden lg:inline">Explore</span>
                </Link>
                {isAuthenticated && (
                  <>
                    <Link href="/calendar" className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="hidden lg:inline">Calendar</span>
                    </Link>
                    <NotificationDropdown />
                    
                    {/* <Link href="/events/create" className="px-4 py-2 text-sm font-medium text-emerald-600 bg-white dark:bg-black border border-emerald-600 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-800/30 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create Event</span>
                    </Link> */}
                  </>
                )}
              </>
            )}
          </div>

          {/* Меню профиля (десктоп) */}
          <div className="hidden md:flex items-center">
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center focus:outline-none group"
                >
                  
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                  
                    {user.profilePictureUrl ? (
                      <img 
                        src={user.profilePictureUrl} 
                        alt={user.firstName} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-medium">{getInitials(user.firstName, user.lastName)}</span>
                    )}
                  </div>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-black rounded-md shadow-lg dark:shadow-none border border-gray-200 dark:border-gray-800 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center" onClick={() => setIsDropdownOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </Link>
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center" onClick={() => setIsDropdownOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        My Tickets
                      </Link>
                      <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center" onClick={() => setIsDropdownOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
                      <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                      <button 
                        onClick={handleLogout} 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                
                <Link href="/login" className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-md transition-colors">
                  Login
                </Link>
                <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Мобильное меню */}
          <div className="md:hidden flex items-center">
            {isAuthenticated && user ? (
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <Link href="/login" className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-md transition-colors">
                  Login
                </Link>
                <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Мобильное боковое меню */}
      {isMobileMenuOpen && isAuthenticated && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed right-0 top-0 h-full w-[300px] bg-white dark:bg-black shadow-lg dark:shadow-none p-5 overflow-y-auto transition transform">
            <div className="flex justify-between items-center mb-5">
              <div className="text-xl font-bold text-emerald-600">TripUp</div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="p-2 rounded-md text-gray-600 dark:text-gray-200 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                {user?.profilePictureUrl ? (
                  <img 
                    src={user.profilePictureUrl} 
                    alt={user.firstName} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium">{getInitials(user?.firstName, user?.lastName)}</span>
                )}
              </div>
              <div>
                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Mobile search with dropdown */}
              <div className="relative mb-4" ref={searchRef}>
                <div className="flex items-center relative">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input 
                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 dark:bg-black" 
                    placeholder="Search events..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSearchResults(true)}
                  />
                  
                  {/* Clear button */}
                  {searchQuery && (
                    <button 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      onClick={() => setSearchQuery('')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {isSearching && (
                  <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-t-2 border-emerald-500 rounded-full"></div>
                  </div>
                )}

                {/* Mobile search results dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-72 overflow-y-auto z-50 border border-gray-200 dark:border-gray-700">
                    {searchResults.map((event) => (
                      <div 
                        key={event.id} 
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                        onClick={() => {
                          navigateToEvent(event.id);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <div className="flex gap-3">
                          {/* Event image or placeholder */}
                          <div className="h-14 w-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-md overflow-hidden flex-shrink-0">
                            {event.posterName ? (
                              <img 
                                src={getImageUrl(event.posterName)} 
                                alt={event.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-emerald-500 font-bold text-lg">
                                {event.title.charAt(0)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-grow min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate mb-1">{event.title}</h4>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{formatDate(event.startedAt)}</span>
                              </div>
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate">{formatLocation(event.venue)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="p-3 text-center border-t border-gray-100 dark:border-gray-700">
                      <Link 
                        href={`/events?search=${encodeURIComponent(searchQuery)}`}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        onClick={() => {
                          setShowSearchResults(false);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        View all results
                      </Link>
                    </div>
                  </div>
                )}
                
                {/* No results found (mobile) */}
                {showSearchResults && searchQuery && searchResults.length === 0 && !isSearching && (
                  <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                    <div className="p-4 text-center">
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No events found for "{searchQuery}"</p>
                    </div>
                  </div>
                )}
              </div>

              <nav className="space-y-1">
                <Link 
                  href="/events" 
                  className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-800/30 hover:text-emerald-600 flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Explore Events
                </Link>
                <Link 
                  href="/calendar" 
                  className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-800/30 hover:text-emerald-600 flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  My Calendar
                </Link>
                <Link 
                  href="/notifications" 
                  className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-800/30 hover:text-emerald-600 flex items-center justify-between"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notifications
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link 
                  href="/profile" 
                  className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-800/30 hover:text-emerald-600 flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  My Profile
                </Link>
                <Link 
                  href="/tickets" 
                  className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-800/30 hover:text-emerald-600 flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  My Tickets
                </Link>
                <Link 
                  href="/settings" 
                  className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-800/30 hover:text-emerald-600 flex items-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </Link>
              </nav>

              <div className="mt-8 space-y-3">
                {/* <Link 
                  href="/events/create"
                  className="block w-full px-4 py-2 text-center font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center justify-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Event
                </Link> */}
                <button 
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-center text-gray-700 dark:text-gray-200 bg-white dark:bg-black border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-md transition-colors flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}