// components/NotificationDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  // At the top of your component, after getting values from context
const { notifications: notificationsData, unreadCount, markAsRead, markAllAsRead } = useNotifications();

// Make sure notifications is always an array
const notifications = Array.isArray(notificationsData) ? notificationsData : [];
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };

  const handleNotificationClick = async (notificationId: number) => {
    if (!notifications.find(n => n.id === notificationId)?.readAt) {
      await markAsRead(notificationId);
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    await markAllAsRead();
  };

  // Animation variants for the bell icon
  const bellAnimation = unreadCount > 0 ? {
    initial: { rotate: 0 },
    animate: { rotate: [0, 15, -15, 10, -10, 0] },
    transition: { duration: 0.7, ease: "easeInOut", repeat: 0 }
  } : {};

  // Animation variants for the dropdown
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 pr-3 rounded-md text-gray-600 dark:text-gray-200 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none relative transition-all duration-300 ease-in-out flex items-center gap-2"
        aria-label="Notifications"
      >
        <motion.div 
          initial="initial"
          animate={unreadCount > 0 ? "animate" : "initial"}
          variants={bellAnimation}
          className="relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.div>
        <span className="hidden lg:inline">Notifications</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={dropdownVariants}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-xl dark:shadow-lg border border-gray-200 dark:border-gray-800 z-50 overflow-hidden"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <h3 className="text-sm font-bold">Notifications</h3>
              {/* {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded-full transition-all duration-200"
                >
                  Mark all as read
                </button>
              )} */}
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">All caught up!</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">You don't have any notifications yet</p>
                </div>
              ) : (
                notifications.map((notification, index) => {
                  // Determine if notification is related to an event or company
                  const isEventNotification = !!notification.event;
                  const isUnread = !notification.readAt;
                  
                  // Determine destination URL based on notification type
                  let destinationUrl = isEventNotification && notification.event
                    ? `/events/${notification.event.id}`
                    : notification.company
                    ? `/companies/${notification.company.id}`
                    : '#';

                  return (
                    <div 
                      key={notification.id}
                      className="relative"
                    >
                      {isUnread && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-full"></div>
                      )}
                      <Link
                        href={destinationUrl}
                        className={`block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out ${index !== notifications.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''} ${isUnread ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''}`}
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div 
                            className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isUnread 
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                          >
                            {isEventNotification ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className={`text-sm font-medium truncate mr-2 ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                {notification.title}
                              </p>
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.content}
                            </p>
                            {isUnread && (
                              <button
                                className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-500 hover:text-emerald-800 dark:hover:text-emerald-400 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20 py-1 px-2 rounded-full transition-all duration-200"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <Link
                href="/notifications"
                className="block w-full px-4 py-2.5 text-center text-sm font-medium text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-900 hover:border-emerald-300 dark:hover:border-emerald-800 rounded-lg shadow-sm hover:shadow transition-all duration-200"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}