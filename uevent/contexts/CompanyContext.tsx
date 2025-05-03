import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { companyService, CompanyNews } from '../services/companyService';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

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

type CompanyContextType = {
  company: Company | null;
  isLoading: boolean;
  error: string | null;
  userCompanies: Company[];
  fetchCompany: () => Promise<void>;
  fetchCompanyById: (id: string) => Promise<void>;
  getUserCompanies: () => Promise<void>;
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
  
  companyNews: CompanyNews[];
  isLoadingNews: boolean;
  newsError: string | null;
  fetchCompanyNews: (companyId?: string) => Promise<void>;
  createCompanyNews: (newsData: Omit<CompanyNews, 'id' | 'authorId' | 'companyId' | 'createdAt'>, companyId?: string) => 
    Promise<{ success: boolean; message?: string; newsItem?: CompanyNews }>;
  deleteCompanyNews: (newsId: string, companyId?: string) => Promise<{ success: boolean; message?: string }>;
  updateCompanyNews: (newsId: string, newsData: Partial<CompanyNews>, companyId?: string) => 
    Promise<{ success: boolean; message?: string; newsItem?: CompanyNews }>;
  viewingSpecificCompany: boolean;
  resetViewingSpecificCompany: () => void;
};

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  isLoading: false,
  error: null,
  userCompanies: [],
  fetchCompany: async () => {},
  fetchCompanyById: async () => {},
  getUserCompanies: async () => {},
  createCompany: async () => ({ success: false }),
  updateCompany: async () => ({ success: false }),
  uploadLogo: async () => ({ success: false }),
  resetCompanyState: () => {},
  
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


export const CompanyProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [userCompanies, setUserCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const [companyNews, setCompanyNews] = useState<CompanyNews[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [viewingSpecificCompany, setViewingSpecificCompany] = useState<boolean>(false);

  const getUserCompanies = async () => {
    await fetchCompany();
  };

  const fetchCompany = async () => {
    if (viewingSpecificCompany) {
      resetViewingSpecificCompany();
    }
  
    if (!user) {
      setCompany(null);
      setUserCompanies([]);
      return;
    }
  
    try {
      setError(null);
      const companyData = await companyService.getCompany();
      
      if (Array.isArray(companyData) && companyData.length > 0) {
        setCompany(companyData[0]);
        setUserCompanies(companyData);
      } else if (companyData) {
        setCompany(companyData);
        setUserCompanies([companyData]);
      } else {
        setCompany(null);
        setUserCompanies([]);
      }
    } catch (error) {
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

  const fetchCompanyById = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setViewingSpecificCompany(true);
      
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

  const createCompany = async (companyData: Omit<Company, 'id'>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await companyService.createCompany(companyData);
      setCompany(response);
      
      setUserCompanies(prev => [...prev, response]);
      
      toast.success('Company created successfully');
      
      return { 
        success: true,
        companyId: response.id,
        company: response,
        updateCompanyState: setCompany,
        refreshCompanyData: fetchCompany 
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

  const updateCompany = async (companyData: Partial<Company>) => {
    if (!company?.id) {
      return { success: false, message: 'No company to update' };
    }

    try {
      setIsLoading(true);
      setError(null);
      const updatedCompany = await companyService.updateCompany(company.id, companyData);
      setCompany(updatedCompany);
      
      setUserCompanies(prev => 
        prev.map(c => c.id === updatedCompany.id ? updatedCompany : c)
      );
      
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

  const uploadLogo = async (file: File, companyId?: string) => {
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
      
      if (response && response.logoName) {
        setCompany(prev => {
          if (prev && (!companyId || prev.id === targetCompanyId)) {
            return { ...prev, logoName: response.logoName };
          }
          else if (!prev || (prev.id === targetCompanyId)) {
            fetchCompany();
          }
          return prev;
        });
        
        setUserCompanies(prev => 
          prev.map(c => c.id === targetCompanyId ? {...c, logoName: response.logoName} : c)
        );
      }
      
      return { 
        success: true,
        logoName: response.logoName,
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

  const resetCompanyState = () => {
    resetViewingSpecificCompany();
    setCompany(null);
    setError(null);
  };

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

  const deleteCompanyNews = async (newsId: string, companyId?: string) => {
    const targetCompanyId = companyId || company?.id;
    
    if (!targetCompanyId) {
      return { success: false, message: 'No company ID available for deleting news' };
    }

    try {
      setIsLoadingNews(true);
      setNewsError(null);
      await companyService.deleteCompanyNews(targetCompanyId, newsId);
      
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

  useEffect(() => {
    if (user && !viewingSpecificCompany) { 
      fetchCompany();
    } else if (!user) {
      resetCompanyState();
      setUserCompanies([]);
    }
  }, [user, viewingSpecificCompany]);
  useEffect(() => {
    if (company?.id) {
      fetchCompanyNews(company.id);
    } else {
      setCompanyNews([]);
    }
  }, [company?.id]);

  const value = {
    company,
    userCompanies,
    isLoading,
    error,
    fetchCompany,
    fetchCompanyById,
    getUserCompanies,
    createCompany,
    updateCompany,
    uploadLogo,
    resetCompanyState,
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

export const useCompany = () => useContext(CompanyContext);

