import React, { useState, useEffect } from 'react';
import { useEvents, EventNews } from '../contexts/EventContext';
import { toast } from 'react-toastify';
import { z } from 'zod';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

// Validation schema for news
const NewsSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(150, { message: "Title is too long (max 150 characters)" }),
  
  description: z
    .string()
    .min(1, { message: "Description is required" })
    .max(5000, { message: "Description is too long (max 5000 characters)" }),
});

// Type for news input form
type NewsInput = z.infer<typeof NewsSchema>;

interface EventNewsSectionProps {
  eventId: number;
}

export const EventNewsSection: React.FC<EventNewsSectionProps> = ({ eventId }) => {
  const { getEventNews, createEventNews, updateEventNews, deleteEventNews } = useEvents();
  
  // Component states
  const [newsItems, setNewsItems] = useState<EventNews[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [isCreatingNews, setIsCreatingNews] = useState(false);
  const [isEditingNews, setIsEditingNews] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsBeingEdited, setNewsBeingEdited] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<string | null>(null);
  
  // Track if news have been loaded
  const [newsLoaded, setNewsLoaded] = useState(false);
  
  // Form for creating/editing news
  const [newsForm, setNewsForm] = useState<NewsInput>({
    title: '',
    description: '',
  });
  
  // Debug with useEffect to track state changes
  useEffect(() => {
    console.log("newsItems state updated:", newsItems);
  }, [newsItems]);

  useEffect(() => {
    console.log("newsLoaded state updated:", newsLoaded);
  }, [newsLoaded]);
  
  // Function to load news - with improved logging and error handling
  const loadNews = () => {
    if (isLoadingNews) return;
    
    console.log("loadNews function called for eventId:", eventId);
    setIsLoadingNews(true);
    
    getEventNews(eventId)
      .then(news => {
        console.log("News API response received:", news);
        
        // Check if news is undefined or null
        if (!news) {
          console.error("News data is undefined or null");
          setNewsItems([]);
          setNewsLoaded(true);
          return;
        }
        
        // Force news to be an array even if it's not
        const newsArray = Array.isArray(news) ? news : [];
        console.log("News array to be displayed:", newsArray);
        
        setNewsItems(newsArray);
        setNewsLoaded(true);
      })
      .catch(error => {
        console.error('Error fetching event news:', error);
        toast.error('Failed to load event news');
        setNewsItems([]);
        setNewsLoaded(true);
      })
      .finally(() => {
        setIsLoadingNews(false);
      });
  };
  
  // Function to refresh news list
  const refreshNews = () => {
    loadNews();
    toast.info('News list refreshed');
  };
  
  // Start creating news
  const handleStartCreateNews = () => {
    setNewsForm({
      title: '',
      description: '',
    });
    setIsCreatingNews(true);
    setIsEditingNews(false);
    setNewsBeingEdited(null);
  };

  // Start editing news
  const handleStartEditNews = (news: EventNews) => {
    setNewsForm({
      title: news.title || '',
      description: news.description || '',
    });
    setNewsBeingEdited(news.id || null);
    setIsEditingNews(true);
    setIsCreatingNews(false);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewsForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Create news
  const handleCreateNews = async () => {
    try {
      const validationResult = NewsSchema.safeParse(newsForm);
      
      if (!validationResult.success) {
        validationResult.error.errors.forEach(error => {
          toast.error(error.message);
        });
        return;
      }
      
      setIsSubmitting(true);
      
      const result = await createEventNews(eventId, newsForm);
      
      if (result.success) {
        setIsCreatingNews(false);
        setNewsForm({
          title: '',
          description: '',
        });
        toast.success('News item created successfully');
        loadNews();
      } else {
        toast.error(result.message || 'Failed to create news item');
      }
    } catch (error) {
      console.error('Error creating news item:', error);
      toast.error('Failed to create news item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update news
  const handleUpdateNews = async () => {
    if (!newsBeingEdited) return;
    
    try {
      const validationResult = NewsSchema.safeParse(newsForm);
      
      if (!validationResult.success) {
        validationResult.error.errors.forEach(error => {
          toast.error(error.message);
        });
        return;
      }
      
      setIsSubmitting(true);
      
      const result = await updateEventNews(eventId, newsBeingEdited, newsForm);
      
      if (result.success) {
        setIsEditingNews(false);
        setNewsBeingEdited(null);
        setNewsForm({
          title: '',
          description: '',
        });
        toast.success('News item updated successfully');
        loadNews();
      } else {
        toast.error(result.message || 'Failed to update news item');
      }
    } catch (error) {
      console.error('Error updating news item:', error);
      toast.error('Failed to update news item');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cancel form
  const handleCancelForm = () => {
    setIsCreatingNews(false);
    setIsEditingNews(false);
    setNewsBeingEdited(null);
    setNewsForm({
      title: '',
      description: '',
    });
  };

  // Open delete confirmation
  const openDeleteConfirmation = (newsId: string) => {
    setNewsToDelete(newsId);
    setIsDeleteModalOpen(true);
  };
  
  // Close delete confirmation
  const closeDeleteConfirmation = () => {
    setIsDeleteModalOpen(false);
    setNewsToDelete(null);
  };
  
  // Delete news
  const confirmDeleteNews = async () => {
    if (!newsToDelete) return;
    
    try {
      const result = await deleteEventNews(eventId, newsToDelete);
      
      if (result.success) {
        toast.success('News item deleted successfully');
        loadNews();
      } else {
        toast.error(result.message || 'Failed to delete news item');
      }
    } catch (error) {
      console.error('Error deleting news item:', error);
      toast.error('Failed to delete news item');
    } finally {
      closeDeleteConfirmation();
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Improved News List Rendering Function with better debugging
  const renderNewsList = () => {
    console.log("renderNewsList called with newsItems:", newsItems);
    
    // First ensure newsItems is initialized as an array
    if (!newsItems) {
      console.log('newsItems is null or undefined');
      return renderEmptyState();
    }
    
    // Then check if it's an array
    if (!Array.isArray(newsItems)) {
      console.log('newsItems is not an array:', typeof newsItems);
      return renderEmptyState();
    }
    
    // Then check if it's empty
    if (newsItems.length === 0) {
      console.log('newsItems is an empty array');
      return renderEmptyState();
    }

    console.log('Rendering newsItems list with', newsItems.length, 'items');
    
    return (
      <div className="space-y-6">
        {newsItems.map((news, index) => (
          <div 
            key={`news-${index}-${news.id || 'unknown'}`} 
            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {news.title || "Untitled"}
                </h3>
                <div className="flex">
                  <button
                    onClick={() => handleStartEditNews(news)}
                    className="text-gray-500 hover:text-blue-500 transition-colors"
                    title="Edit news"
                    disabled={isEditingNews || isCreatingNews}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => openDeleteConfirmation(news.id!)}
                    className="text-gray-500 hover:text-red-500 transition-colors ml-2"
                    title="Delete news"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {news.createdAt ? formatDate(news.createdAt) : "No date available"}
              </div>
              
              <div className="mt-4 text-gray-700 dark:text-gray-300 prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-line">{news.description || "No description"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Extracted the empty state into a separate function
  const renderEmptyState = () => {
    return (
      <div className="py-12 flex flex-col items-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No News Yet</h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
          This event hasn't published any news yet. Share updates, announcements, or changes with your audience.
        </p>
        {!isCreatingNews && !isEditingNews && (
          <button
            onClick={handleStartCreateNews}
            className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Create Your First News Item
          </button>
        )}
      </div>
    );
  };
  
  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Event News</h2>
          <div className="flex space-x-2">
            {!newsLoaded ? (
              <button
                onClick={loadNews}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4v6h6"></path>
                  <path d="M23 20v-6h-6"></path>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
                Load News
              </button>
            ) : (
              <>
                <button
                  onClick={refreshNews}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4v6h6"></path>
                    <path d="M23 20v-6h-6"></path>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                  </svg>
                  Refresh
                </button>
                <button
                  onClick={handleStartCreateNews}
                  className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  disabled={isCreatingNews || isEditingNews}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"></path>
                  </svg>
                  Add News
                </button>
              </>
            )}
          </div>
        </div>
        
        {!newsLoaded ? (
          <div className="p-6 text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Click "Load News" to view the latest updates for this event.
            </p>
          </div>
        ) : (
          <>
            {/* News creation form */}
            {isCreatingNews && (
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={newsForm.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-800 dark:text-white"
                      placeholder="Enter news title"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={newsForm.description}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-800 dark:text-white"
                      placeholder="Enter news description"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNews}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 dark:disabled:bg-emerald-800/40 text-white font-medium rounded-lg transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Publishing...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14"></path>
                          </svg>
                          Publish
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* News editing form */}
            {isEditingNews && (
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                {/* Editing form content */}
                <div className="space-y-4">
                  {/* Same form fields as creation */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={newsForm.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={newsForm.description}
                      onChange={handleInputChange}
                      rows={5}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={handleCancelForm} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateNews}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800/40 text-white font-medium rounded-lg transition-colors"
                    >
                      {isSubmitting ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* News list - using the improved rendering function */}
            <div className="p-6">
              {isLoadingNews ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                  <p className="ml-4 text-emerald-600 font-medium">Loading news...</p>
                </div>
              ) : (
                renderNewsList()
              )}
            </div>
          </>
        )}
      </div>
      
      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete News Item"
        message="Are you sure you want to delete this news item? This action cannot be undone."
        onConfirm={confirmDeleteNews}
        onCancel={closeDeleteConfirmation}
      />
    </>
  );
};