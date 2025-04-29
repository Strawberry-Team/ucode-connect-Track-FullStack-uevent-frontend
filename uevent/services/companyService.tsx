import axios from 'axios';
import { Company } from '../contexts/CompanyContext';
import userService from './userService';

// Base API URL
const API_URL = 'http://localhost:8080/api';

// News type definition
export type CompanyNews = {
  id?: string;
  authorId?: string; 
  companyId?: string;
  eventId?: string | null;
  title: string;
  description: string;
  createdAt?: string;
};

export type CompanyEvent = {
  id: number;
  companyId: number;
  formatId: number;
  title: string;
  description: string;
  venue: string;
  locationCoordinates: string;
  startedAt: string;
  endedAt: string;
  publishedAt?: string;
  ticketsAvailableFrom?: string;
  posterName?: string;
  attendeeVisibility: string;
  status: string;
  format?: {
    id: number;
    title: string;
  };
  themes?: {
    id: number;
    title: string;
  };
  company?: {
    id: number;
    title: string;
    logoName?: string;
  };
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Company service methods
export const companyService = {
  
  // Get current user's primary company
  async getCompany(): Promise<Company | null> {
    try {
      const user = await userService.getCurrentUser('me');
      if (user && user.id) {
        return await userService.getUserCompany(user.id);
      }
      return null;
    } catch (error) {
      console.error('Error fetching user company:', error);
      throw error;
    }
  },
  
  // Get all companies owned by the current user
  async getUserCompanies(): Promise<Company[]> {
    try {
      const user = await userService.getCurrentUser('me');
      if (user && user.id) {
        const company = await userService.getUserCompany(user.id);
        // If the response is already an array, return it
        if (Array.isArray(company)) {
          return company;
        }
        // Otherwise, wrap it in an array (if it exists)
        return company ? [company] : [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching user companies:', error);
      throw error;
    }
  },
  
  // Get any company by ID (public or private)
  async getCompanyById(id: string): Promise<Company> {
    try {
      console.log(`Fetching company with ID: ${id}`);
      // Прямой запрос к API компании без использования userService
      const response = await axios.get(`${API_URL}/companies/${id}`, getAuthHeaders());
      console.log('Response from getCompanyById:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching company with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Create new company
  async createCompany(companyData: Omit<Company, 'id'>): Promise<Company> {
    try {
      const response = await axios.post(`${API_URL}/companies`, companyData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  },
  
  // Update company
  async updateCompany(id: string, companyData: Partial<Company>): Promise<Company> {
    try {
      const response = await axios.patch(`${API_URL}/companies/${id}`, companyData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error updating company with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Upload company logo
  async uploadLogo(id: string, formData: FormData): Promise<{logoName: string}> {
    try {
      const config = {
        ...getAuthHeaders(),
        headers: {
          ...getAuthHeaders().headers,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const response = await axios.post(`${API_URL}/companies/${id}/upload-logo`, formData, config);
      return response.data;
    } catch (error) {
      console.error(`Error uploading logo for company with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Get all companies (for admin or public listings)
  async getAllCompanies(): Promise<Company[]> {
    try {
      const response = await axios.get(`${API_URL}/companies`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching all companies:', error);
      throw error;
    }
  },
  
  // NEWS RELATED METHODS
  
  // Get company news
  async getCompanyNews(companyId: string): Promise<CompanyNews[]> {
    try {
      const response = await axios.get(`${API_URL}/companies/${companyId}/news`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching news for company with ID ${companyId}:`, error);
      throw error;
    }
  },
  
  // Create company news
  async createCompanyNews(companyId: string, newsData: Omit<CompanyNews, 'id' | 'authorId' | 'companyId' | 'createdAt'>): Promise<CompanyNews> {
    try {
      const response = await axios.post(`${API_URL}/companies/${companyId}/news`, newsData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error creating news for company with ID ${companyId}:`, error);
      throw error;
    }
  },
  
  // Delete company news
  async deleteCompanyNews(companyId: string, newsId: string): Promise<void> {
    try {
      // Using the correct endpoint format for consistency
      await axios.delete(`${API_URL}/news/${newsId}`, getAuthHeaders());
    } catch (error) {
      console.error(`Error deleting news with ID ${newsId}:`, error);
      throw error;
    }
  },
  
  // Update company news
  async updateCompanyNews(companyId: string, newsId: string, newsData: Partial<CompanyNews>): Promise<CompanyNews> {
    try {
      // Using the correct endpoint format for consistency
      const response = await axios.patch(`${API_URL}/news/${newsId}`, newsData, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error updating news with ID ${newsId}:`, error);
      throw error;
    }
  },
  
  // Get company events
  async getCompanyEvents(companyId: string): Promise<CompanyEvent[]> {
    try {
      const response = await axios.get(`${API_URL}/companies/${companyId}/events`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching events for company with ID ${companyId}:`, error);
      throw error;
    }
  },
  
  // Check if a company exists
  async checkCompanyExists(id: string): Promise<boolean> {
    try {
      await axios.get(`${API_URL}/companies/${id}`, getAuthHeaders());
      return true;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return false;
      }
      console.error(`Error checking if company with ID ${id} exists:`, error);
      throw error;
    }
  }
};