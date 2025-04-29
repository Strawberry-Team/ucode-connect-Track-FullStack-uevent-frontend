import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useCompany } from '../../contexts/CompanyContext';
import EventCreationForm from '../../components/EventCreationForm';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const CreateEventPage: React.FC = () => {
  const { company, isLoading } = useCompany();
  
  return (
    <>
      <Head>
        <title>Create Event | EventMaster</title>
        <meta name="description" content="Create a new event on EventMaster" />
      </Head>
      
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Event</h1>
                <p className="mt-1 text-lg text-gray-500 dark:text-gray-400">
                  Fill in the details to create a new event
                </p>
              </div>
              <Link
                href="/events"
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg shadow-sm dark:shadow-none text-gray-700 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back to Events
              </Link>
            </div>
          </div>
          
          {/* Check if user has a company */}
          {isLoading ? (
            <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
              <div className="p-8 flex flex-col items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                <p className="mt-4 text-emerald-600 font-medium">Loading company information...</p>
              </div>
            </div>
          ) : !company ? (
            <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Company Required</h3>
                <p className="text-gray-600 dark:text-gray-200 max-w-md mx-auto mb-8">
                  You need to create a company before you can organize events. Creating a company allows you to manage events, sell tickets, and track attendees.
                </p>
                
                <Link
                  href="/companies"
                  className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-md dark:shadow-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"></path>
                  </svg>
                  Create Company
                </Link>
              </div>
            </div>
          ) : (
            <EventCreationForm />
          )}
        </div>
      </main>
      
    </>
  );
};

export default CreateEventPage;