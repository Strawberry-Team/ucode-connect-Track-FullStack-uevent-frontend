import React, { useState } from 'react';
import { Users, User, EyeOff, Eye, ChevronRight, UserPlus } from 'lucide-react';
import Link from 'next/link';

const EventAttendeesSection = ({ 
  eventId, 
  attendees = [], 
  attendeesLoading = false, 
  currentUserAttendee = null, 
  toggleAttendeeVisibility = () => {}, 
  canViewAttendees = true, 
  event = {},
  user = null
}) => {
  const [showAllAttendees, setShowAllAttendees] = useState(false);
  
  // Get avatar URL
  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}/uploads/avatars/${path}`;
  };
  
  // Get user display name
  const getUserDisplayName = (attendee) => {
    if (!attendee.user) return 'Unknown User';
    return `${attendee.user.firstName} ${attendee.user.lastName}`;
  };
  
  // Get user role for display
  const getUserRole = (attendee) => {
    if (attendee.isOrganizer) return 'Organizer';
    if (attendee.isHost) return 'Host';
    if (attendee.isSpeaker) return 'Speaker';
    return 'Member';
  };
  
  // If users can't view attendees
  if (!canViewAttendees) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-emerald-500" />
            Attendees
          </h2>
        </div>
        <div className="p-6 text-center">
          {event.attendeeVisibility === 'ATTENDEES_ONLY' ? (
            <div className="flex flex-col items-center">
              <UserPlus className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                Only attendees can view the participant list
              </p>
              <button className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                Register to see attendees
              </button>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Unable to load attendees
            </p>
          )}
        </div>
      </div>
    );
  }
  
  // Loading state
  if (attendeesLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-emerald-500" />
            Attendees
          </h2>
        </div>
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }
  
  // Calculate visible attendees
  const visibleAttendees = attendees.filter(
    attendee => attendee.isVisible || (user && attendee.userId === user.id)
  );
  
  // Determine the preview and remaining count
  const previewCount = 4; // Show first 4 attendees in preview
  const previewAttendees = visibleAttendees.slice(0, previewCount);
  const remainingCount = Math.max(0, visibleAttendees.length - previewCount);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <Users className="w-5 h-5 mr-2 text-emerald-500" />
          Attendees ({visibleAttendees.length})
        </h2>
        
        {visibleAttendees.length > previewCount && !showAllAttendees && (
          <Link 
            href={`/events/${eventId}/attendees`}
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium flex items-center"
            onClick={(e) => {
              e.preventDefault();
              setShowAllAttendees(true);
            }}
          >
            See all
          </Link>
        )}
      </div>
      
      {/* Current user visibility toggle */}
      {currentUserAttendee && (
        <div className="px-6 pt-6">
          <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Your Visibility</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Control whether other attendees can see you in the list
                </p>
              </div>
              <button
                onClick={toggleAttendeeVisibility}
                disabled={attendeesLoading}
                className="flex items-center px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {currentUserAttendee.isVisible ? (
                  <>
                    <Eye className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                    <span>Visible</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                    <span>Hidden</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Attendees list */}
      <div className="px-6 pb-6">
        {visibleAttendees.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-600 dark:text-gray-400">No attendees yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Show either preview or all attendees based on state */}
            {(showAllAttendees ? visibleAttendees : previewAttendees).map(attendee => (
              <div key={attendee.id} className="flex flex-col items-center text-center">
                {/* Profile picture with role badge */}
                <div className="relative mb-2">
                  <div className={`w-20 h-20 rounded-full overflow-hidden ${
                    user && attendee.userId === user.id 
                      ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' 
                      : ''
                  }`}>
                    {attendee.user?.profilePictureName ? (
                      <img 
                        src={getAvatarUrl(attendee.user.profilePictureName)} 
                        alt={getUserDisplayName(attendee)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  
                  {/* Role Badge (Host, Organizer, etc) */}
                  {(attendee.isHost || attendee.isOrganizer || attendee.isSpeaker) && (
                    <div className="absolute -top-1 -right-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-md 
                        ${attendee.isHost || attendee.isOrganizer ? 'bg-amber-700 text-white' : 
                         attendee.isSpeaker ? 'bg-blue-600 text-white' : ''}`}>
                        {getUserRole(attendee)}
                      </span>
                    </div>
                  )}
                  
                  {/* Hidden indicator */}
                  {!attendee.isVisible && (
                    <div className="absolute bottom-0 right-0 bg-gray-800 dark:bg-gray-700 rounded-full p-1">
                      <EyeOff className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Name and role */}
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {getUserDisplayName(attendee)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getUserRole(attendee)}
                </p>
                
                {/* "You" indicator */}
                {user && attendee.userId === user.id && (
                  <span className="mt-1 text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    You
                  </span>
                )}
              </div>
            ))}
            
            {/* Remaining attendees count */}
            {!showAllAttendees && remainingCount > 0 && (
              <div className="flex flex-col items-center justify-center">
                <div 
                  className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-pointer"
                  onClick={() => setShowAllAttendees(true)}
                >
                  <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                    +{remainingCount}
                  </span>
                </div>
                <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 cursor-pointer" onClick={() => setShowAllAttendees(true)}>
                  +{remainingCount} more
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Show less button when expanded */}
        {showAllAttendees && visibleAttendees.length > previewCount && (
          <div className="mt-6 text-center">
            <button 
              onClick={() => setShowAllAttendees(false)}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
            >
              Show less
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventAttendeesSection;