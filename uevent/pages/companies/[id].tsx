
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useCompany } from '../../contexts/CompanyContext';
import { CompanyPublicNewsSection } from '../../components/CompanyPublicNewsSection';
import { companyService, CompanyEvent } from '../../services/companyService';
import { SubscribeButton } from '../../components/SubscribeButton';

type Event = CompanyEvent;

const CompanyPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { 
    company, 
    isLoading, 
    error, 
    companyNews, 
    isLoadingNews,
    fetchCompanyById 
  } = useCompany();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'about' | 'events' | 'testimonials' | 'news'>('about');
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  
  const previousIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string' && id !== previousIdRef.current) {
      previousIdRef.current = id;
      fetchCompanyById(id);
    }
    
  }, [id, fetchCompanyById]);

  const fetchEvents = async () => {
    if (!company?.id) return;
    
    setIsLoadingEvents(true);
    try {

      const fetchedEvents = await companyService.getCompanyEvents(company.id);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching company events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (company?.id) {
      fetchEvents();
    }
  }, [company?.id]);

  const getEventImageUrl = (path: string | undefined) => {
    if (!path) return null;
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}/uploads/event-posters/${path}`;
  };

  const getImageUrl = (path: string | undefined) => {
    if (!path) return null;
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}/uploads/company-logos/${path.startsWith('/') ? path.substring(1) : path}`;
  };

  const openGmailCompose = () => {
    if (company?.email) {
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${company.email}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <div className="w-12 h-12 rounded-full border-2 border-t-emerald-500 animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-200 font-medium">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white dark:bg-black rounded-lg shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Error Loading Company</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white dark:bg-black rounded-lg shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">Company Not Found</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">We couldn't find the company you're looking for.</p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center px-4 py-2 rounded-md bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const logoUrl = getImageUrl(company.logoName);

  return (
    <div className="bg-white dark:bg-black">
      
      <header className="relative bg-emerald-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-800 to-teal-700 opacity-90"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-white dark:bg-gray-800 p-1 shadow-lg dark:shadow-none">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={company.title}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-400 rounded-md">
                    <span className="text-2xl font-bold text-white">{company.title.charAt(0)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {company.title}
              </h1>
              
              <p className="mt-3 text-lg text-emerald-50">
                {company.description || 'An innovative event organization company.'}
              </p>
              
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-800/40 text-emerald-100 backdrop-blur-sm">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
    {company.email}
  </span>
  
  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-800/40 text-emerald-100 backdrop-blur-sm">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    Founded {new Date(company.createdAt || '').getFullYear()}
  </span>

  
  <SubscribeButton 
    entityId={company.id || ''} 
    entityType="company"
    className="ml-auto sm:ml-0"
  />
</div>
            </div>
          </div>
        </div>
      </header>
      
      
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center sm:justify-start -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('about')}
              className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                activeTab === 'about'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                activeTab === 'news'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              News
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                activeTab === 'events'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              Events
            </button>
            
          </div>
        </div>
      </div>
      
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-black rounded-lg shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    About {company.title}
                  </h2>
                  
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {company.description || 
                        `${company.title} is a premier event organization company dedicated to creating memorable experiences. 
                        With our expertise and attention to detail, we specialize in organizing a wide range of events, 
                        from corporate seminars to large-scale festivals.`}
                    </p>
                    
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                      Our mission is to deliver exceptional event experiences that exceed expectations. 
                      We work closely with clients to understand their vision and bring it to life with our creative approach 
                      and meticulous planning.
                    </p>
                  </div>
                </div>
              </div>
              
              
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-black rounded-lg shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {new Date(company?.createdAt || '').getFullYear()}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Founded</p>
                    </div>
                  </div>
                </div>
                
<div className="bg-white dark:bg-black rounded-lg shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 p-6">
  <div className="flex items-start">
    <div className="flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    </div>
    <div className="ml-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        
        {events.length}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">Events Hosted</p>
    </div>
  </div>
</div>
              </div>
            </div>
            
            <div>
              <div className="bg-white dark:bg-black rounded-lg shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Contact Information
                  </h2>
                  
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Email</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{company.email}</p>
                      </div>
                    </li>
                    
                    {company.owner && (
                      <li className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Owner</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {company.owner.firstName} {company.owner.lastName}
                          </p>
                        </div>
                      </li>
                    )}
                    
                    <li className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Established</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(company.createdAt || '').toLocaleDateString(undefined, { 
                            year: 'numeric', 
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </li>
                  </ul>
                  
                  <div className="mt-6">
                    <button 
                      onClick={openGmailCompose}
                      className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm rounded-md transition-colors shadow-sm dark:shadow-none flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Contact Us
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        
        {activeTab === 'news' && (
          <div>
            {company?.id && (
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Latest News</h2>
                
              </div>
            )}
            <CompanyPublicNewsSection companyId={company.id || ''} />
          </div>
        )}
        
        
        {activeTab === 'events' && (
          <div>
            {isLoadingEvents ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-t-emerald-500 animate-spin mr-3"></div>
                <p className="text-gray-600 dark:text-gray-300 font-medium">Loading events...</p>
              </div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
  <div key={event.id} className="bg-white dark:bg-black rounded-lg shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800 overflow-hidden">
    <div className="h-40 bg-gray-100 dark:bg-gray-800 relative">
      {event.posterName ? (
        <img 
          src={getEventImageUrl(event.posterName)} 
          alt={event.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      
      <div className="absolute top-3 right-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          event.status === 'PUBLISHED' 
            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300' 
            : event.status === 'DRAFT'
            ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
            : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
        }`}>
          {event.status.charAt(0).toUpperCase() + event.status.slice(1).toLowerCase()}
        </span>
      </div>
    </div>
    
    <div className="p-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{event.title}</h3>
      
      <div className="mt-3 space-y-2">
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm">{new Date(event.startedAt).toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
          })}</span>
        </div>
        
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm truncate">{event.venue}</span>
        </div>
        
        {event.format && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span className="text-sm">{event.format.title}</span>
          </div>
        )}
      </div>
      
      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
        {event.description}
      </div>
      
      <div className="mt-4">
        <Link href={`/events/${event.id}`} className="inline-flex items-center justify-center w-full px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium text-sm rounded transition-colors">
          View Details
        </Link>
      </div>
    </div>
  </div>
))}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Events Yet</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center max-w-md mb-6">
                  {company.title} hasn't organized any events yet. Check back later for upcoming events.
                </p>
                
                <Link href="/events" className="px-4 py-2 rounded-md bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 transition-colors shadow-sm dark:shadow-none">
                  Browse All Events
                </Link>
              </div>
            )}
          </div>
        )}
        
        
        {activeTab === 'testimonials' && (
          <div>
            <div className="py-16 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Testimonials Yet</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center max-w-md">
                There are no testimonials for {company.title} yet. Check back later as more clients share their experiences.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyPage;

