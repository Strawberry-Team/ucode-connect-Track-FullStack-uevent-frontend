import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { toast } from 'react-toastify';
import { eventService } from '../services/eventService';
import { useAuth } from './AuthContext';
export interface Event {
  id?: number;
  title: string;
  description: string;
  venue: string;
  locationCoordinates?: string;
  startedAt: string;
  endedAt: string;
  publishedAt?: string;
  ticketsAvailableFrom?: string;
  posterName?: string;
  attendeeVisibility: 'EVERYONE' | 'ATTENDEES_ONLY' | 'NOBODY';
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'SALES_STARTED' | 'ONGOING' | 'FINISHED';
  companyId: number;
  formatId: number;
}

export interface EventNews {
  id?: string;
  title: string;
  description: string;
  eventId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Theme {
  id: number;
}

export interface Ticket {
  title: string;
  price: number;
  status: 'AVAILABLE' | 'SOLD' | 'RESERVED';
  quantity: number;
}

export interface EventAttendee {
  id: number;
  eventId: number;
  userId: number;
  isVisible: boolean;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

export interface TicketType {
  title: string;
  price: number;
  count: number;
}

export interface EventTicket {
  id: number;
  eventId: number;
  title: string;
  number: string;
  price: number;
  status: 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'UNAVAILABLE';
}

export interface EventContextType {
  events: Event[];
  currentEvent: Event | null;
  isLoading: boolean;
  error: string | null;
  createEvent: (eventData: Partial<Event>) => Promise<{
    success: boolean;
    eventId?: number;
    message?: string;
    event?: Event;
  }>;
  getEvents: () => Promise<void>;
  getEventById: (id: number) => Promise<Event | null>;
  updateEvent: (eventData: Partial<Event>) => Promise<{
    success: boolean;
    message?: string;
  }>;
  deleteEvent: (id: number) => Promise<{
    success: boolean;
    message?: string;
  }>;
  uploadPoster: (file: File, eventId: number) => Promise<{
    success: boolean;
    posterName?: string;
    message?: string;
  }>;
  syncThemes: (eventId: number, themeIds: number[]) => Promise<{
    success: boolean;
    message?: string;
  }>;
  createTickets: (eventId: number, tickets: Ticket[]) => Promise<{
    success: boolean;
    message?: string;
    tickets?: Ticket[];
    
  }>;
  getEventNews: (eventId: number) => Promise<EventNews[]>;
  createEventNews: (eventId: number, newsData: { title: string; description: string }) => Promise<{
    success: boolean;
    news?: EventNews;
    message?: string;
  }>;
  updateEventNews: (eventId: number, newsId: string, newsData: { title: string; description: string }) => Promise<{
    success: boolean;
    news?: EventNews;
    message?: string;
  }>;
  deleteEventNews: (eventId: number, newsId: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
  getEventAttendees: (eventId: number) => Promise<EventAttendee[]>;
updateAttendeeVisibility: (attendeeId: number, isVisible: boolean) => Promise<{
  success: boolean;
  message?: string;
}>;
canViewAttendees: (event: Event) => boolean;
 getTicketTypes: (eventId: number) => Promise<TicketType[]>;
 getEventTickets: (eventId: number, filters?: { title?: string, status?: string }) => Promise<EventTicket[]>;
 getTicketById: (eventId: number, ticketId: number) => Promise<EventTicket>;

}
const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventService.getEvents();
      
      
      if (Array.isArray(data)) {
        setEvents(data);
      } else if (data && Array.isArray(data.items)) {
        
        setEvents(data.items);
      } else {
        console.error('Unexpected data format from getEvents():', data);
        setEvents([]); 
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events');
      toast.error('Failed to fetch events');
      setEvents([]); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  
const fetchEventAttendees = useCallback(async (eventId: number) => {
  setIsLoading(true);
  setError(null);
  try {
    const attendees = await eventService.getEventAttendees(eventId);
    return attendees;
  } catch (error) {
    console.error(`Error fetching attendees for event with ID ${eventId}:`, error);
    setError(`Failed to fetch attendees for event with ID ${eventId}`);
    toast.error('Failed to fetch event attendees');
    return [];
  } finally {
    setIsLoading(false);
  }
}, []);


const handleUpdateAttendeeVisibility = useCallback(async (attendeeId: number, isVisible: boolean) => {
  setIsLoading(true);
  setError(null);
  try {
    await eventService.updateAttendeeVisibility(attendeeId, isVisible);
    toast.success('Visibility updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating attendee visibility:', error);
    setError('Failed to update attendee visibility');
    toast.error('Failed to update visibility');
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to update attendee visibility' 
    };
  } finally {
    setIsLoading(false);
  }
}, []);



const checkCanViewAttendees = useCallback((event: Event) => {
  
  if (!event || event.attendeeVisibility === 'NOBODY') {
    return false;
  }
  
  
  if (event.attendeeVisibility === 'EVERYONE') {
    return true;
  }
  
  
  if (event.attendeeVisibility === 'ATTENDEES_ONLY') {
    
    if (!user) {
      return false;
    }
    
    
    
    
    
    return true;
  }
  
  return false;
}, [user]);  

  
  const fetchEventById = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventService.getEventById(id);
      setCurrentEvent(data);
      return data;
    } catch (error) {
      console.error(`Error fetching event with ID ${id}:`, error);
      setError(`Failed to fetch event with ID ${id}`);
      toast.error('Failed to fetch event details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  const handleCreateEvent = useCallback(async (eventData: Partial<Event>) => {
    setIsLoading(true);
    setError(null);
    try {
      const event = await eventService.createEvent(eventData);
      setEvents(prev => [...prev, event]);
      toast.success('Event created successfully');
      return {
        success: true,
        eventId: event.id,
        event: event
      };
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event');
      toast.error('Failed to create event');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to create event' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

 
const handleUpdateEvent = useCallback(async (eventData: Partial<Event>) => {
  if (!eventData.id) {
    return { success: false, message: 'Event ID is required for update' };
  }

  setIsLoading(true);
  setError(null);
  try {
    const { id, ...dataWithoutId } = eventData;
    
    const updatedEvent = await eventService.updateEvent(id, dataWithoutId);
    
    
    setEvents(prev => {
      
      if (!Array.isArray(prev)) {
        console.error('Expected events state to be an array but got:', typeof prev);
        return [updatedEvent]; 
      }
      return prev.map(event => event.id === id ? { ...event, ...updatedEvent } : event);
    });
    
    
    if (currentEvent && currentEvent.id === id) {
      setCurrentEvent(prev => prev ? { ...prev, ...updatedEvent } : prev);
    }
    
    toast.success('Event updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating event:', error);
    setError('Failed to update event');
    toast.error('Failed to update event');
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to update event' 
    };
  } finally {
    setIsLoading(false);
  }
}, [currentEvent]);

  
  const handleDeleteEvent = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await eventService.deleteEvent(id);
      
      
      setEvents(prev => prev.filter(event => event.id !== id));
      
      
      if (currentEvent && currentEvent.id === id) {
        setCurrentEvent(null);
      }
      
      toast.success('Event deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event');
      toast.error('Failed to delete event');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to delete event' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentEvent]);

  
  const handleUploadPoster = useCallback(async (file: File, eventId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await eventService.uploadEventPoster(file, eventId);
      
      
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId 
            ? { ...event, posterName: result.posterName } 
            : event
        )
      );
      
      
      if (currentEvent && currentEvent.id === eventId) {
        setCurrentEvent(prev => 
          prev ? { ...prev, posterName: result.posterName } : prev
        );
      }
      
      toast.success('Poster uploaded successfully');
      return {
        success: true,
        posterName: result.posterName
      };
    } catch (error) {
      console.error('Error uploading poster:', error);
      setError('Failed to upload poster');
      toast.error('Failed to upload poster');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to upload poster' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [currentEvent]);

  
  const handleSyncThemes = useCallback(async (eventId: number, themeIds: number[]) => {
    setIsLoading(true);
    setError(null);
    try {
      await eventService.syncEventThemes(eventId, themeIds);
      toast.success('Event themes updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error syncing event themes:', error);
      setError('Failed to sync event themes');
      toast.error('Failed to update event themes');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to sync event themes' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  const handleCreateTickets = useCallback(async (eventId: number, tickets: Ticket[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const createdTickets = await eventService.createEventTickets(eventId, tickets);
      toast.success('Tickets created successfully');
      return {
        success: true,
        tickets: createdTickets
      };
    } catch (error) {
      console.error('Error creating tickets:', error);
      setError('Failed to create tickets');
      toast.error('Failed to create tickets');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to create tickets' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  
  
  const fetchEventNews = useCallback(async (eventId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const news = await eventService.getEventNews(eventId);
      return news;
    } catch (error) {
      console.error(`Error fetching news for event with ID ${eventId}:`, error);
      setError(`Failed to fetch news for event with ID ${eventId}`);
      toast.error('Failed to fetch event news');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  const handleCreateEventNews = useCallback(async (eventId: number, newsData: { title: string; description: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const news = await eventService.createEventNews(eventId, newsData);
      toast.success('Event news created successfully');
      return {
        success: true,
        news: news
      };
    } catch (error) {
      console.error('Error creating event news:', error);
      setError('Failed to create event news');
      toast.error('Failed to create event news');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to create event news' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  const handleUpdateEventNews = useCallback(async (eventId: number, newsId: string, newsData: { title: string; description: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedNews = await eventService.updateEventNews(eventId, newsId, newsData);
      toast.success('Event news updated successfully');
      return {
        success: true,
        news: updatedNews
      };
    } catch (error) {
      console.error('Error updating event news:', error);
      setError('Failed to update event news');
      toast.error('Failed to update event news');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update event news' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  
  const handleDeleteEventNews = useCallback(async (eventId: number, newsId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await eventService.deleteEventNews(eventId, newsId);
      toast.success('Event news deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('Error deleting event news:', error);
      setError('Failed to delete event news');
      toast.error('Failed to delete event news');
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to delete event news' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

const fetchTicketTypes = useCallback(async (eventId: number) => {
  setIsLoading(true);
  setError(null);
  try {
    const ticketTypes = await eventService.getTicketTypes(eventId);
    return ticketTypes;
  } catch (error) {
    console.error(`Error fetching ticket types for event with ID ${eventId}:`, error);
    setError(`Failed to fetch ticket types for event with ID ${eventId}`);
    toast.error('Failed to fetch ticket types');
    return [];
  } finally {
    setIsLoading(false);
  }
}, []);


const fetchEventTickets = useCallback(async (eventId: number, filters?: { title?: string, status?: string }) => {
  setIsLoading(true);
  setError(null);
  try {
    const tickets = await eventService.getEventTickets(eventId, filters);
    return tickets;
  } catch (error) {
    console.error(`Error fetching tickets for event with ID ${eventId}:`, error);
    setError(`Failed to fetch tickets for event with ID ${eventId}`);
    toast.error('Failed to fetch event tickets');
    return [];
  } finally {
    setIsLoading(false);
  }
}, []);


const fetchTicketById = useCallback(async (eventId: number, ticketId: number) => {
  setIsLoading(true);
  setError(null);
  try {
    const ticket = await eventService.getTicketById(eventId, ticketId);
    return ticket;
  } catch (error) {
    console.error(`Error fetching ticket with ID ${ticketId}:`, error);
    setError(`Failed to fetch ticket with ID ${ticketId}`);
    toast.error('Failed to fetch ticket details');
    return null;
  } finally {
    setIsLoading(false);
  }
}, []);


  
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  
  const value: EventContextType = {
    events,
    currentEvent,
    isLoading,
    error,
    createEvent: handleCreateEvent,
    getEvents: fetchEvents,
    getEventById: fetchEventById,
    updateEvent: handleUpdateEvent,
    deleteEvent: handleDeleteEvent,
    uploadPoster: handleUploadPoster,
    syncThemes: handleSyncThemes,
    createTickets: handleCreateTickets,
    
    getEventNews: fetchEventNews,
    createEventNews: handleCreateEventNews,
    updateEventNews: handleUpdateEventNews,
    deleteEventNews: handleDeleteEventNews,
    getEventAttendees: fetchEventAttendees,
updateAttendeeVisibility: handleUpdateAttendeeVisibility,
canViewAttendees: checkCanViewAttendees,

getTicketTypes: fetchTicketTypes,
getEventTickets: fetchEventTickets,
getTicketById: fetchTicketById,

  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};


export const useEvents = (): EventContextType => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};