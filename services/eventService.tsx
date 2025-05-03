import axios from 'axios';
import { Event, Ticket, Theme } from '../contexts/EventContext';

const API_URL = 'http://localhost:8080/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
};


export const eventService = {

  async getEvents(): Promise<Event[]> {
    try {
      
      const response = await axios.get(`${API_URL}/events`, getAuthHeaders());
      console.log('events',response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },


  async getEventById(id: number): Promise<Event> {
    try {
      const response = await axios.get(`${API_URL}/events/${id}`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching event with ID ${id}:`, error);
      throw error;
    }
  },


  async createEvent(eventData: Partial<Event>): Promise<Event> {
    try {
      const response = await axios.post(`${API_URL}/events`, eventData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },


  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event> {
    try {
      const response = await axios.patch(`${API_URL}/events/${id}`, eventData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },


  async deleteEvent(id: number): Promise<void> {
    try {
      await axios.delete(`${API_URL}/events/${id}`, getAuthHeaders());
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },


  async uploadEventPoster(file: File, eventId: number): Promise<{posterName: string}> {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const response = await axios.post(`${API_URL}/events/${eventId}/upload-poster`, formData, config);
      return response.data;
    } catch (error) {
      console.error('Error uploading event poster:', error);
      throw error;
    }
  },


  async syncEventThemes(eventId: number, themeIds: number[]): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/events/${eventId}/themes`, 
        { themes: themeIds.map(id => ({ id })) }, 
        getAuthHeaders()
      );
    } catch (error) {
      console.error('Error syncing event themes:', error);
      throw error;
    }
  },


  async createEventTickets(eventId: number, tickets: Ticket[]): Promise<Ticket[]> {
    try {
      const promises = tickets.map(ticket => 
        axios.post(`${API_URL}/events/${eventId}/tickets`, ticket, getAuthHeaders())
          .then(response => response.data)
      );
      
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error creating event tickets:', error);
      throw error;
    }
  },


  async getFormats(): Promise<{ id: number; title: string; }[]> {
    try {
      const response = await axios.get(`${API_URL}/formats`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching formats:', error);

      return [
        { id: 1, title: 'Conference' },
        { id: 2, title: 'Workshop' },
        { id: 3, title: 'Webinar' },
        { id: 4, title: 'Meetup' },
        { id: 5, title: 'Training' }
      ];
    }
  },


  async getThemes(): Promise<{id: number, title: string}[]> {
    try {
      const response = await axios.get(`${API_URL}/themes`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching themes:', error);

      return [
        { id: 1, title: 'Technology' },
        { id: 2, title: 'Business' },
        { id: 3, title: 'Web Development' },
        { id: 4, title: 'Marketing' },
        { id: 5, title: 'Health' },
        { id: 6, title: 'Education' }
      ];
    }
  },


  

  async getEventNews(eventId: number): Promise<any[]> {
    try {
      const response = await axios.get(`${API_URL}/events/${eventId}/news`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching news for event with ID ${eventId}:`, error);
      throw error;
    }
  },


  async createEventNews(eventId: number, newsData: { title: string; description: string }): Promise<any> {
    try {
      const response = await axios.post(`${API_URL}/events/${eventId}/news`, newsData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating event news:', error);
      throw error;
    }
  },
  

  async updateEventNews(eventId: number, newsId: string, newsData: { title: string; description: string }): Promise<any> {
    try {
      const response = await axios.patch(`${API_URL}/news/${newsId}`, newsData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error updating event news:', error);
      throw error;
    }
  },
  

  async deleteEventNews(eventId: number, newsId: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/news/${newsId}`, getAuthHeaders());
    } catch (error) {
      console.error('Error deleting event news:', error);
      throw error;
    }
  },


async getEventAttendees(eventId: number): Promise<any[]> {
  try {
    const response = await axios.get(`${API_URL}/events/${eventId}/attendees`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching attendees for event with ID ${eventId}:`, error);
    throw error;
  }
},


async updateAttendeeVisibility(attendeeId: number, isVisible: boolean): Promise<any> {
  try {
    const response = await axios.patch(
      `${API_URL}/event-attendees/${attendeeId}`, 
      { isVisible }, 
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error updating attendee visibility:', error);
    throw error;
  }
},


async getTicketTypes(eventId: number): Promise<any[]> {
  try {
    const response = await axios.get(`${API_URL}/events/${eventId}/ticket-types`, getAuthHeaders());
    return response.data.items || [];
  } catch (error) {
    console.error(`Error fetching ticket types for event with ID ${eventId}:`, error);
    throw error;
  }
},


async getEventTickets(eventId: number, filters?: { title?: string, status?: string }): Promise<any[]> {
  try {
    let url = `${API_URL}/events/${eventId}/tickets`;
    const params: any = {};
    
    if (filters) {
      if (filters.title) params.title = filters.title;
      if (filters.status) params.status = filters.status;
    }
    
    const config = {
      ...getAuthHeaders(),
      params
    };
    
    const response = await axios.get(url, config);
    return response.data.items || [];
  } catch (error) {
    console.error(`Error fetching tickets for event with ID ${eventId}:`, error);
    throw error;
  }
},


async getTicketById(eventId: number, ticketId: number): Promise<any> {
  try {
    const response = await axios.get(`${API_URL}/events/${eventId}/tickets/${ticketId}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error(`Error fetching ticket with ID ${ticketId}:`, error);
    throw error;
  }
},

};

