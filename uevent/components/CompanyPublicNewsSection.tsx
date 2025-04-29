import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { companyService, CompanyNews } from '../services/companyService';

interface CompanyPublicNewsSectionProps {
  companyId: string;
}

export const CompanyPublicNewsSection: React.FC<CompanyPublicNewsSectionProps> = ({ companyId }) => {
  const [news, setNews] = useState<CompanyNews[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Function to fetch news for the public company page
  useEffect(() => {
    const fetchCompanyNews = async () => {
      if (!companyId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const newsData = await companyService.getCompanyNews(companyId);
        setNews(newsData);
      } catch (error) {
        console.error('Error fetching company news:', error);
        setError('Failed to load company news');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompanyNews();
  }, [companyId]);
  
  // Format date function
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // If less than 7 days, show as "X days ago"
    if (diffDays < 7) {
      if (diffDays === 0) {
        // Check if it's today
        const hours = Math.floor(diffTime / (1000 * 60 * 60));
        if (hours < 24) {
          if (hours === 0) {
            const minutes = Math.floor(diffTime / (1000 * 60));
            return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
          }
          return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        }
        return 'Today';
      }
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    }
    
    // Otherwise, format the date
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Truncate text function
  const truncateText = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };
  
  if (isLoading) {
    return (
      <div className="py-8 flex justify-center items-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mr-3"></div>
        <p className="text-gray-600 dark:text-gray-300 font-medium">Loading company news...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="py-8 flex justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 max-w-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error Loading News</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (news.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Company News</h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          This company hasn't published any news updates yet. Check back later for announcements and event information.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {news.map((item) => (
        <Link key={item.id} href={`/companies/${companyId}/news/${item.id}`}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer group">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {item.title}
              </h3>
              
              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-2 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {formatDate(item.createdAt)}
                
                {item.eventId && (
                  <span className="ml-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Event Update
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300">
                {truncateText(item.description || '', 250)}
              </p>
              
              <div className="mt-4 text-emerald-600 dark:text-emerald-400 font-medium text-sm flex items-center group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                Read more
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};