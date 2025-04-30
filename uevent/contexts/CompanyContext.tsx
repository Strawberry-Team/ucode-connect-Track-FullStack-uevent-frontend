import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { companyService, CompanyNews } from '../services/companyService';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

// Define Company type
export type Company = {
  id?: string;
  title: string;
  email: string;
  description?: string;
  logoName?: string;
  createdAt?: string;
  updatedAt?: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureName?: string;
    role?: string;
  };
};

// Define the context type with extended return types
type CompanyContextType = {
  company: Company | null;
  isLoading: boolean;
  error: string | null;
  userCompanies: Company[]; // Add user companies list
  fetchCompany: () => Promise<void>;
  fetchCompanyById: (id: string) => Promise<void>; // New method to fetch company by ID
  getUserCompanies: () => Promise<void>; // Fetch all companies owned by the user
  createCompany: (companyData: Omit<Company, 'id'>) => Promise<{ 
    success: boolean; 
    message?: string; 
    companyId?: string;
    company?: Company;
    updateCompanyState?: React.Dispatch<React.SetStateAction<Company | null>>;
    refreshCompanyData?: () => Promise<void>;
  }>;
  updateCompany: (companyData: Partial<Company>) => Promise<{ success: boolean; message?: string }>;
  uploadLogo: (file: File, companyId?: string) => Promise<{ 
    success: boolean; 
    message?: string;
    logoName?: string;
  }>;
  resetCompanyState: () => void;
  
  // News related functionality
  companyNews: CompanyNews[];
  isLoadingNews: boolean;
  newsError: string | null;
  fetchCompanyNews: (companyId?: string) => Promise<void>;
  createCompanyNews: (newsData: Omit<CompanyNews, 'id' | 'authorId' | 'companyId' | 'createdAt'>, companyId?: string) => 
    Promise<{ success: boolean; message?: string; newsItem?: CompanyNews }>;
  deleteCompanyNews: (newsId: string, companyId?: string) => Promise<{ success: boolean; message?: string }>;
  updateCompanyNews: (newsId: string, newsData: Partial<CompanyNews>, companyId?: string) => 
    Promise<{ success: boolean; message?: string; newsItem?: CompanyNews }>;
  viewingSpecificCompany: boolean; // Add this if not already present
  resetViewingSpecificCompany: () => void;
};

// Create the context with default values
const CompanyContext = createContext<CompanyContextType>({
  company: null,
  isLoading: false,
  error: null,
  userCompanies: [], // Default empty array for user companies
  fetchCompany: async () => {},
  fetchCompanyById: async () => {}, // Add default for fetchCompanyById
  getUserCompanies: async () => {}, // Add default for getUserCompanies
  createCompany: async () => ({ success: false }),
  updateCompany: async () => ({ success: false }),
  uploadLogo: async () => ({ success: false }),
  resetCompanyState: () => {},
  
  // News defaults
  companyNews: [],
  isLoadingNews: false,
  newsError: null,
  fetchCompanyNews: async () => {},
  createCompanyNews: async () => ({ success: false }),
  deleteCompanyNews: async () => ({ success: false }),
  updateCompanyNews: async () => ({ success: false }),
  viewingSpecificCompany: false,
  resetViewingSpecificCompany: () => {},
});

// Provider component
export const CompanyProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [userCompanies, setUserCompanies] = useState<Company[]>([]); // State for user's companies
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // News related state
  const [companyNews, setCompanyNews] = useState<CompanyNews[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [viewingSpecificCompany, setViewingSpecificCompany] = useState<boolean>(false);
  // Fetch all companies owned by the current user
  const getUserCompanies = async () => {
    // Simply call fetchCompany which now handles both states
    await fetchCompany();
  };

  // Fetch company data of the current user's primary company
  const fetchCompany = async () => {
    // Only reset if we're actually viewing a specific company,
    // preventing the infinite loop
    if (viewingSpecificCompany) {
      resetViewingSpecificCompany();
    }
  
    if (!user) {
      setCompany(null);
      setUserCompanies([]);
      return;
    }
  
    try {
      //setIsLoading(true);
      setError(null);
      const companyData = await companyService.getCompany();
      
      // Update both states from a single API call
      if (Array.isArray(companyData) && companyData.length > 0) {
        setCompany(companyData[0]);
        setUserCompanies(companyData); // Set all companies
      } else if (companyData) {
        setCompany(companyData);
        setUserCompanies([companyData]); // Wrap in array
      } else {
        setCompany(null);
        setUserCompanies([]);
      }
    } catch (error) {
      // Error handling
      if (error.response && error.response.status === 404) {
        setCompany(null);
        setUserCompanies([]);
      } else {
        setError('Failed to fetch company data');
        console.error('Error fetching company:', error);
        toast.error('Failed to load company data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Fetch a specific company by ID (for viewing other companies)
  const fetchCompanyById = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setViewingSpecificCompany(true); // Установите флаг
      
      // Остальной код без изменений
      const existingCompany = userCompanies.find(c => c.id === id);
      
      if (existingCompany) {
        setCompany(existingCompany);
      } else {
        const fetchedCompany = await companyService.getCompanyById(id);
        setCompany(fetchedCompany);
      }
      
      if (id) {
        fetchCompanyNews(id);
      }
    } catch (error) {
      console.error('Error fetching company by ID:', error);
      setError('Failed to load company details');
      toast.error('Failed to load company details');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new company
  const createCompany = async (companyData: Omit<Company, 'id'>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await companyService.createCompany(companyData);
      setCompany(response);
      
      // Also add to userCompanies list
      setUserCompanies(prev => [...prev, response]);
      
      toast.success('Company created successfully');
      
      // Return more data, including functions to update state
      return { 
        success: true,
        companyId: response.id,
        company: response,
        updateCompanyState: setCompany, // Pass the function to update state
        refreshCompanyData: fetchCompany // Pass the function to update data
      };
    } catch (error) {
      setError('Failed to create company');
      console.error('Error creating company:', error);
      toast.error(error.response?.data?.message || 'Failed to create company');
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create company' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Update company data
  const updateCompany = async (companyData: Partial<Company>) => {
    if (!company?.id) {
      return { success: false, message: 'No company to update' };
    }

    try {
      setIsLoading(true);
      setError(null);
      const updatedCompany = await companyService.updateCompany(company.id, companyData);
      setCompany(updatedCompany);
      
      // Also update in userCompanies list if it exists there
      setUserCompanies(prev => 
        prev.map(c => c.id === updatedCompany.id ? updatedCompany : c)
      );
      
      //toast.success('Company updated successfully');
      return { success: true };
    } catch (error) {
      setError('Failed to update company');
      console.error('Error updating company:', error);
      toast.error(error.response?.data?.message || 'Failed to update company');
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update company' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Upload company logo - updated version
  const uploadLogo = async (file: File, companyId?: string) => {
    // Use provided company ID or fall back to the current company's ID
    const targetCompanyId = companyId || company?.id;
    
    if (!targetCompanyId) {
      return { success: false, message: 'No company ID available for logo upload' };
    }

    try {
      setIsLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await companyService.uploadLogo(targetCompanyId, formData);
      console.log('Logo upload response:', response);
      
      // Always update company state regardless of whether it's new or not
      if (response && response.logoName) {
        // Update current company with new logo
        setCompany(prev => {
          // If it's the same company, update it
          if (prev && (!companyId || prev.id === targetCompanyId)) {
            return { ...prev, logoName: response.logoName };
          }
          // If it's a new company and we don't have a company yet, 
          // or if it's the same company by ID, update it
          else if (!prev || (prev.id === targetCompanyId)) {
            // Get latest company data from server
            fetchCompany();
          }
          return prev;
        });
        
        // Also update in userCompanies list if it exists there
        setUserCompanies(prev => 
          prev.map(c => c.id === targetCompanyId ? {...c, logoName: response.logoName} : c)
        );
      }
      
      return { 
        success: true,
        logoName: response.logoName, // Return logoName for use in component
        message: 'Logo uploaded successfully'
      };
    } catch (error) {
      setError('Failed to upload logo');
      console.error('Error uploading logo:', error);
      toast.error(error.response?.data?.message || 'Failed to upload logo');
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to upload logo' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset company state
  const resetCompanyState = () => {
    resetViewingSpecificCompany();
    setCompany(null);
    setError(null);
  };

  // Fetch company news
  const fetchCompanyNews = async (companyId?: string) => {
    const targetCompanyId = companyId || company?.id;
    
    if (!targetCompanyId) {
      setNewsError('No company ID available for fetching news');
      return;
    }
  
    try {
      setIsLoadingNews(true);
      setNewsError(null);
      const newsData = await companyService.getCompanyNews(targetCompanyId);
      setCompanyNews(newsData);
    } catch (error) {
      setNewsError('Failed to fetch company news');
      console.error('Error fetching company news:', error);
      toast.error('Failed to load company news');
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Create company news
  const createCompanyNews = async (
    newsData: Omit<CompanyNews, 'id' | 'authorId' | 'companyId' | 'createdAt'>,
    companyId?: string
  ) => {
    resetViewingSpecificCompany();
    const targetCompanyId = companyId || company?.id;
    
    if (!targetCompanyId) {
      return { success: false, message: 'No company ID available for creating news' };
    }

    try {
      setIsLoadingNews(true);
      setNewsError(null);
      const response = await companyService.createCompanyNews(targetCompanyId, newsData);
      
      // Update news list with new item
      setCompanyNews(prev => [...prev, response]);
      
      toast.success('News created successfully');
      return { 
        success: true,
        newsItem: response
      };
    } catch (error) {
      setNewsError('Failed to create news item');
      console.error('Error creating news item:', error);
      toast.error(error.response?.data?.message || 'Failed to create news item');
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to create news item' 
      };
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Delete company news
  const deleteCompanyNews = async (newsId: string, companyId?: string) => {
    const targetCompanyId = companyId || company?.id;
    
    if (!targetCompanyId) {
      return { success: false, message: 'No company ID available for deleting news' };
    }

    try {
      setIsLoadingNews(true);
      setNewsError(null);
      await companyService.deleteCompanyNews(targetCompanyId, newsId);
      
      // Remove deleted item from state
      setCompanyNews(prev => prev.filter(news => news.id !== newsId));
      
      toast.success('News deleted successfully');
      return { success: true };
    } catch (error) {
      setNewsError('Failed to delete news item');
      console.error('Error deleting news item:', error);
      toast.error(error.response?.data?.message || 'Failed to delete news item');
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to delete news item' 
      };
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Update company news
  const updateCompanyNews = async (
    newsId: string, 
    newsData: Partial<CompanyNews>,
    companyId?: string
  ) => {
    const targetCompanyId = companyId || company?.id;
    
    if (!targetCompanyId) {
      return { success: false, message: 'No company ID available for updating news' };
    }

    try {
      setIsLoadingNews(true);
      setNewsError(null);
      const response = await companyService.updateCompanyNews(targetCompanyId, newsId, newsData);
      
      // Update the specific news item in state
      setCompanyNews(prev => 
        prev.map(news => news.id === newsId ? response : news)
      );
      
      toast.success('News updated successfully');
      return { 
        success: true,
        newsItem: response
      };
    } catch (error) {
      setNewsError('Failed to update news item');
      console.error('Error updating news item:', error);
      toast.error(error.response?.data?.message || 'Failed to update news item');
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update news item' 
      };
    } finally {
      setIsLoadingNews(false);
    }
  };
  const resetViewingSpecificCompany = () => {
    setViewingSpecificCompany(false);
  };
  // Load user data when user changes
  // В существующем useEffect
  useEffect(() => {
    if (user && !viewingSpecificCompany) { 
      fetchCompany(); // Just call this single function
    } else if (!user) {
      resetCompanyState();
      setUserCompanies([]);
    }
  }, [user, viewingSpecificCompany]);
  // Load company news when company changes
  useEffect(() => {
    if (company?.id) {
      fetchCompanyNews(company.id);
    } else {
      setCompanyNews([]);
    }
  }, [company?.id]);

  const value = {
    company,
    userCompanies, // Add userCompanies to the context value
    isLoading,
    error,
    fetchCompany,
    fetchCompanyById, // Add new method to context value
    getUserCompanies, // Add new method to context value
    createCompany,
    updateCompany,
    uploadLogo,
    resetCompanyState,
    
    // News related values
    companyNews,
    isLoadingNews,
    newsError,
    fetchCompanyNews,
    createCompanyNews,
    deleteCompanyNews,
    updateCompanyNews,
    viewingSpecificCompany,
  resetViewingSpecificCompany
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
};

// Custom hook to use the company context
export const useCompany = () => useContext(CompanyContext);