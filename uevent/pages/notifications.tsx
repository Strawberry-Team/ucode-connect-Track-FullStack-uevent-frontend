// pages/notifications.tsx
import { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsPage() {
  // At the top of your component
const { notifications: notificationsData, markAsRead, markAllAsRead } = useNotifications();
const [filter, setFilter] = useState<'all' | 'unread'>('all');
const [mounted, setMounted] = useState(false);

// Ensure notifications is always an array
const notifications = Array.isArray(notificationsData) ? notificationsData : [];

// Filter notifications based on selected filter
const filteredNotifications = filter === 'all' 
  ? notifications 
  : notifications.filter(notification => !notification.readAt);
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group notifications by date
 // Group notifications by date
const groupNotificationsByDate = () => {
    const groups: { [key: string]: typeof filteredNotifications } = {};
    
    // Check if filteredNotifications is an array before calling forEach
    if (!Array.isArray(filteredNotifications)) {
      return groups;
    }
    
    filteredNotifications.forEach(notification => {
      if (!notification || !notification.createdAt) return;
      
      const date = new Date(notification.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey;
      
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(notification);
    });
    
    return groups;
  };

  // Get grouped notifications
  const groupedNotifications = groupNotificationsByDate();
  
  // For animation purposes
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Notifications | TripUp</title>
      </Head>
      
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
                Notifications
              </h1>
              
              <div className="flex flex-wrap gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 flex">
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      filter === 'all' 
                        ? 'bg-emerald-500 text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      filter === 'unread' 
                        ? 'bg-emerald-500 text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setFilter('unread')}
                  >
                    Unread
                  </button>
                </div>
                
                {/* {notifications.some(notification => !notification.readAt) && (
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-500 bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow-sm transition-all duration-200 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark all as read
                  </button>
                )} */}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 shadow-lg text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-48 w-48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Stay Updated</h2>
              <p className="max-w-lg opacity-90">
                Get notified about event changes, ticket confirmations, and new opportunities. 
                Never miss an important update again!
              </p>
              <div className="mt-4 text-sm">
                <span className="bg-white bg-opacity-20 rounded-full px-3 py-1 inline-flex items-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-white mr-2"></span>
                  {filter === 'all' 
                    ? `${filteredNotifications.length} notification${filteredNotifications.length !== 1 ? 's' : ''}`
                    : `${filteredNotifications.length} unread notification${filteredNotifications.length !== 1 ? 's' : ''}`
                  }
                </span>
              </div>
            </div>
          </motion.div>
          
          {filteredNotifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center"
            >
              <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">All caught up!</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {filter === 'all' 
                  ? "You don't have any notifications yet. Check back later for updates about your events and activities."
                  : "You don't have any unread notifications. Switch to 'All' to see your notification history."}
              </p>
              {filter === 'unread' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-6 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-500 bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow-sm transition-all duration-200"
                >
                  View all notifications
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
                  <motion.div
                    key={dateGroup}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 ml-4">{dateGroup}</h3>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                      {groupNotifications.map((notification, index) => {
                        const isEventNotification = !!notification.event;
                        const isUnread = !notification.readAt;
                        
                        let destinationUrl = isEventNotification && notification.event
                          ? `/events/${notification.event.id}`
                          : notification.company
                          ? `/companies/${notification.company.id}`
                          : '#';
                        
                        return (
                          <div 
                            key={notification.id} 
                            className={`relative ${index !== 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}
                          >
                            {isUnread && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                            )}
                            <div
                              className={`p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                                isUnread ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div 
                                  className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
                                    isUnread 
                                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  {isEventNotification ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                    <h4 className={`text-base font-semibold ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {notification.title}
                                    </h4>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                                      {formatDate(notification.createdAt)}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    {notification.content}
                                  </p>
                                  <div className="mt-4 flex flex-wrap gap-3">
                                    {/* <Link
                                      href={destinationUrl}
                                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors duration-200"
                                      onClick={() => {
                                        if (isUnread) {
                                          markAsRead(notification.id);
                                        }
                                      }}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                      View details
                                    </Link> */}
                                    {isUnread && (
                                      <button
                                        onClick={() => markAsRead(notification.id)}
                                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Mark as read
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}