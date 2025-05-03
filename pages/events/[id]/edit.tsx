import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { useEvents } from '../../../contexts/EventContext';
import { eventService } from '../../../services/eventService';
import { EventBasicInfoSchema } from '../../../components/eventValidation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { usePromoCodes, PromoCode } from '../../../contexts/PromoCodeContext';
import LocationPicker from '../../../components/LocationPicker';

interface Format {
  id: number;
  title: string;
}

interface Theme {
  id: number;
  title: string;
}

const EditEventPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { currentEvent, getEventById, updateEvent, isLoading, syncThemes } = useEvents();
const { getPromoCodesByEventId, createPromoCode, updatePromoCode } = usePromoCodes();
  const [eventData, setEventData] = useState<any>(null);
  const [formats, setFormats] = useState<Format[]>([]);
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const posterInputRef = useRef<HTMLInputElement>(null);
  
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
const [promoCodesList, setPromoCodesList] = useState<PromoCode[]>([]);
const [isAddingPromoCode, setIsAddingPromoCode] = useState(false);
const [isEditingPromoCode, setIsEditingPromoCode] = useState<number | null>(null);
const [newPromoCode, setNewPromoCode] = useState<Partial<PromoCode>>({
  title: '',
  code: '',
  discountPercent: 0,
  isActive: true,
  eventId: 0
});
const [eventTickets, setEventTickets] = useState<Array<any>>([]);
const [newTicket, setNewTicket] = useState({
  title: '',
  price: 0,
  status: 'AVAILABLE',
  quantity: 1
});
const { createTickets, getEventTickets } = useEvents();

useEffect(() => {
  const fetchTickets = async () => {
    if (id && typeof id === 'string') {
      try {
        const ticketsData = await getEventTickets(Number(id));
        setEventTickets(ticketsData);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        toast.error('Failed to fetch tickets');
      }
    }
  };
  
  fetchTickets();
}, [id, getEventTickets]);

const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  setNewTicket(prev => ({
    ...prev,
    [name]: name === 'price' || name === 'quantity' ? parseFloat(value) : value
  }));
};

const formatDateForInput = (dateString) => {
  const date = new Date(dateString);
  const localISOTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  return localISOTime;
};

const handleAddTicket = async () => {
  if (!newTicket.title) {
    toast.warning('Please enter a ticket title', {
      position: 'bottom-right',
      autoClose: 3000,
    });
    return;
  }

  try {
    const existingTicket = eventTickets.find(ticket => 
      ticket.title === newTicket.title && 
      ticket.status === newTicket.status
    );

    if (existingTicket) {
      const updatedTicket = {
        ...existingTicket,
        quantity: existingTicket.quantity + newTicket.quantity
      };
      
      const result = await eventService.updateTicket(existingTicket.id, updatedTicket);
      
      if (result.success) {
        const updatedTickets = await getEventTickets(Number(id));
        setEventTickets(updatedTickets);
        
        toast.success('Ticket quantity updated successfully!', {
          icon: '🎟️',
          position: 'bottom-right',
          autoClose: 2000,
        });
      } else {
        toast.error(result.message || 'Failed to update ticket');
      }
    } else {
      const result = await createTickets(Number(id), [newTicket]);

      if (result.success) {
        const updatedTickets = await getEventTickets(Number(id));
        setEventTickets(updatedTickets);
        
        toast.success('Ticket added successfully!', {
          icon: '🎟️',
          position: 'bottom-right',
          autoClose: 2000,
        });
      } else {
        toast.error(result.message || 'Failed to add ticket');
      }
    }
    
    setNewTicket({
      title: '',
      price: 0,
      status: 'AVAILABLE',
      quantity: 1
    });
    
  } catch (error) {
    console.error('Error adding/updating ticket:', error);
    toast.error('Failed to add/update ticket');
  }
};

const handleRemoveTicket = async (ticketId: number) => {
  try {
    const result = await eventService.deleteTicket(ticketId);
    
    if (result.success) {
      setEventTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
      
      toast.info('Ticket removed', {
        position: 'bottom-right',
        autoClose: 2000,
      });
    } else {
      toast.error(result.message || 'Failed to remove ticket');
    }
    
  } catch (error) {
    console.error('Error removing ticket:', error);
    toast.error('Failed to remove ticket');
  }
};
  useEffect(() => {
    const fetchEventData = async () => {
      if (id && typeof id === 'string') {
        try {
          const eventData = await getEventById(Number(id));
          console.log("red",eventData);
          setEventData(eventData);
          
          if (eventData?.themes?.length > 0) {
            setSelectedThemes(eventData.themes.map((theme: any) => theme.id));
          }
        } catch (error) {
          console.error('Error fetching event data:', error);
          toast.error('Failed to fetch event data');
        }
      }
    };
    
    fetchEventData();
  }, [id, getEventById]);

useEffect(() => {
  const fetchPromoCodes = async () => {
    if (id && typeof id === 'string') {
      try {
        const promoCodesData = await getPromoCodesByEventId(Number(id));
        setPromoCodesList(promoCodesData);
      } catch (error) {
        console.error('Error fetching promo codes:', error);
        toast.error('Failed to fetch promo codes');
      }
    }
  };
  
  fetchPromoCodes();
}, [id, getPromoCodesByEventId]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [formatsData, themesData] = await Promise.all([
          eventService.getFormats(),
          eventService.getThemes()
        ]);
        
        setFormats(formatsData);
        setAvailableThemes(themesData);
      } catch (error) {
        console.error('Error fetching form options:', error);
        toast.error('Failed to load form options');
      }
    };
    
    fetchOptions();
  }, []);
  
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value } = e.target;
  
  if (name === 'startedAt' || name === 'endedAt' || name === 'publishedAt' || name === 'ticketsAvailableFrom') {
    if (value) {
      const localDate = new Date(value);
      const utcDate = new Date(
        Date.UTC(
          localDate.getFullYear(),
          localDate.getMonth(),
          localDate.getDate(),
          localDate.getHours(),
          localDate.getMinutes()
        )
      ).toISOString();
      
      setEventData(prev => ({
        ...prev,
        [name]: utcDate
      }));
    } else {
      setEventData(prev => ({
        ...prev,
        [name]: null
      }));
    }
  } else if (name === 'formatId') {
    setEventData(prev => ({
      ...prev,
      [name]: value ? parseInt(value, 10) : 0
    }));
  } else {
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  }
};
  
  const handleThemeChange = (themeId: number) => {
    setSelectedThemes(prev => {
      if (prev.includes(themeId)) {
        return prev.filter(id => id !== themeId);
      } else {
        return [...prev, themeId];
      }
    });
  };
  
  const validatePosterFile = (file: File): boolean => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should not exceed 5MB');
      return false;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, GIF, and SVG files are allowed');
      return false;
    }
    
    return true;
  };
  
  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validatePosterFile(file)) {
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      setPosterFile(file);
      
      toast.success('Poster uploaded successfully!', {
        icon: '🖼️',
        position: 'bottom-right',
        autoClose: 2000,
      });
    }
  };
  
  const handlePosterButtonClick = () => {
    posterInputRef.current?.click();
  };

  const handlePosterUpload = async () => {
    if (!posterFile || !eventData?.id) return false;
    
    setIsUploading(true);
    try {
      console.log('Uploading poster for event:', eventData.id);
      const result = await eventService.uploadEventPoster(posterFile, eventData.id);
      
      if (result.success) {
        if (result.posterName) {
          setEventData(prev => ({
            ...prev,
            posterName: result.posterName
          }));
        }
        toast.success('Poster uploaded successfully');
        return true;
      } else {
        toast.error(result.message || 'Failed to upload poster');
        return false;
      }
    } catch (error) {
      console.error('Error uploading poster:', error);
      toast.error('Failed to upload poster');
      return false;
    } finally {
      setIsUploading(false);
    }
  };
  
  const validateForm = () => {
    try {
      EventBasicInfoSchema.parse(eventData);
      setErrors({});
      return true;
    } catch (error: any) {
      const formattedErrors: Record<string, string> = {};
      error.errors.forEach((err: any) => {
        formattedErrors[err.path[0]] = err.message;
      });
      setErrors(formattedErrors);
      return false;
    }
  };

const handlePromoCodeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value, type } = e.target as HTMLInputElement;
  
  if (name === 'discountPercent') {
    setNewPromoCode(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  } 
  else if (type === 'checkbox') {
    setNewPromoCode(prev => ({
      ...prev,
      [name]: (e.target as HTMLInputElement).checked
    }));
  } 
  else {
    setNewPromoCode(prev => ({
      ...prev,
      [name]: value
    }));
  }
};

const handleCreatePromoCode = async (e: React.MouseEvent | React.FormEvent) => {
  e.preventDefault();
  e.stopPropagation();

  if (!eventData?.id) {
    toast.error('Event ID is required');
    return;
  }
  
  try {
    const promoCodeData = {
      ...newPromoCode,
      discountPercent: newPromoCode.discountPercent / 100,
      eventId: eventData.id
    };
    
    const result = await createPromoCode(eventData.id, promoCodeData);
    
    if (result.success && result.promoCode) {
      setPromoCodesList(prev => [...prev, result.promoCode!]);

      setNewPromoCode({
        title: '',
        code: '',
        discountPercent: 0,
        isActive: true,
        eventId: eventData.id
      });

      setIsAddingPromoCode(false);
      
      toast.success('Promo code created successfully');
    } else {
      toast.error(result.message || 'Failed to create promo code');
    }
  } catch (error) {
    console.error('Error creating promo code:', error);
    toast.error('Failed to create promo code');
  }
};


const handleEditPromoCode = (promoCode: PromoCode) => {
  setIsEditingPromoCode(promoCode.id || null);
  setNewPromoCode({
    title: promoCode.title,
    code: promoCode.code,
    discountPercent: promoCode.discountPercent * 100,
    isActive: promoCode.isActive,
    eventId: promoCode.eventId
  });
};

const handleUpdatePromoCode = async (id: number) => {
  if (!id) {
    toast.error('Promo code ID is required');
    return;
  }
  
  try {
    const updatePayload = {
      title: newPromoCode.title,
      isActive: newPromoCode.isActive
    };
    
    const result = await updatePromoCode(id, updatePayload);
    
    if (result.success && result.promoCode) {
      setPromoCodesList(prev => 
        prev.map(promoCode => promoCode.id === id ? { ...promoCode, ...result.promoCode } : promoCode)
      );
      setNewPromoCode({
        title: '',
        code: '',
        discountPercent: 0,
        isActive: true,
        eventId: eventData.id
      });
      setIsEditingPromoCode(null);
      
      toast.success('Promo code updated successfully');
    } else {
      toast.error(result.message || 'Failed to update promo code');
    }
  } catch (error) {
    console.error('Error updating promo code:', error);
    toast.error('Failed to update promo code');
  }
};

const handleTogglePromoCodeStatus = async (promoCode: PromoCode) => {
  if (!promoCode.id) {
    toast.error('Promo code ID is required');
    return;
  }
  
  try {
    const updatedData = {
      isActive: !promoCode.isActive
    };
    
    const result = await updatePromoCode(promoCode.id, updatedData);
    
    if (result.success && result.promoCode) {
      setPromoCodesList(prev => 
        prev.map(pc => pc.id === promoCode.id ? { ...pc, isActive: !pc.isActive } : pc)
      );
      
      toast.success(`Promo code ${result.promoCode.isActive ? 'activated' : 'deactivated'} successfully`);
    } else {
      toast.error(result.message || 'Failed to update promo code status');
    }
  } catch (error) {
    console.error('Error updating promo code status:', error);
    toast.error('Failed to update promo code status');
  }
};

const handleCancelPromoCodeForm = () => {
  setNewPromoCode({
    title: '',
    code: '',
    discountPercent: 0,
    isActive: true,
    eventId: eventData?.id || 0
  });
  setIsAddingPromoCode(false);
  setIsEditingPromoCode(null);
};
  
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    toast.error('Please fix the errors before submitting');
    return;
  }
  
  setIsSaving(true);
  
  try {
    const updatePayload = {
      id: eventData.id,
      title: eventData.title,
      description: eventData.description,
      venue: eventData.venue,
      locationCoordinates: eventData.locationCoordinates,
      startedAt: eventData.startedAt,
      endedAt: eventData.endedAt,
      publishedAt: eventData.publishedAt,
      ticketsAvailableFrom: eventData.ticketsAvailableFrom,
      posterName: eventData.posterName,
      attendeeVisibility: eventData.attendeeVisibility,
      status: eventData.status,
      companyId: eventData.companyId,
      formatId: eventData.formatId
    };
    
    console.log('Updating event with payload:', updatePayload);
    
    const updateResult = await updateEvent(updatePayload);
    
    if (!updateResult.success) {
      throw new Error(updateResult.message || 'Failed to update event');
    }
  
    if (posterFile) {
      const posterResult = await handlePosterUpload();
      if (!posterResult) {
        toast.warning('Event updated, but poster upload failed');
      }
    }
    
    const themesResult = await syncThemes(eventData.id, selectedThemes);
    
    if (!themesResult.success) {
      toast.warning('Event updated, but themes update failed');
    }
    
    toast.success('Event updated successfully');
    router.push(`/events/${eventData.id}`);
  } catch (error) {
    console.error('Error updating event:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to update event');
  } finally {
    setIsSaving(false);
  }
};
  
  const getImageUrl = (path: string | undefined) => {
    if (!path) return null;
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}/uploads/event-posters/${path.startsWith('/') ? path.substring(1) : path}`;
  };
  
  const getFieldError = (field: string) => {
    return errors[field] || '';
  };
  
  if (isLoading || !eventData) {
    return (
      <>
        <Header />
        <main className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
              <div className="p-8 flex flex-col items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
                <p className="mt-4 text-emerald-600 font-medium">Loading event data...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <Head>
        <title>Edit Event | EventMaster</title>
        <meta name="description" content="Edit your event" />
      </Head>
      
      <main className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Event</h1>
              <div className="flex space-x-2">
                <Link
                  href={`/events/${eventData.id}`}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 font-medium rounded-lg transition-colors shadow-sm dark:shadow-none"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
          
          {/* Main Form Container with Enhanced Design */}
          <div className="bg-white dark:bg-gray-900 shadow-xl dark:shadow-emerald-900/10 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
            {/* Form Header with animated gradient */}
            <div className="relative overflow-hidden bg-emerald-600 py-8 px-8">
              <div className="absolute top-0 left-0 right-0 bottom-0 bg-grid-white/[0.2] bg-[length:16px_16px]"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-1">Edit Event</h2>
                <p className="text-emerald-50">Update the details of your event</p>
              </div>
              {/* Animated blobs in the background */}
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/20 rounded-full filter blur-3xl animate-blob"></div>
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-400/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-8">
                {/* Basic Info Section */}
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Basic Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Event Title */}
                    <div className="md:col-span-2">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Event Title <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2 1a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7zm0 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={eventData.title || ''}
                          onChange={handleInputChange}
                          className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('title') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white`}
                          placeholder="Enter event title"
                        />
                      </div>
                      {getFieldError('title') && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('title')}
                        </motion.p>
                      )}
                    </div>
                    
                    {/* Event Description */}
                    <div className="md:col-span-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Event Description <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute top-3 left-3 flex items-start pointer-events-none text-gray-400 dark:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <textarea
                          id="description"
                          name="description"
                          value={eventData.description || ''}
                          onChange={handleInputChange}
                          rows={4}
                          className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('description') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white resize-none`}
                          placeholder="Describe your event in detail. What makes it special? What can attendees expect?"
                        />
                      </div>
                      {getFieldError('description') && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('description')}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Location and Timing Section */}
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Location & Timing</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Venue */}
                    <div>
                      <label htmlFor="venue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Venue <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          id="venue"
                          name="venue"
                          value={eventData.venue || ''}
                          onChange={handleInputChange}
                          className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('venue') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white`}
                          placeholder="Enter venue name"
                        />
                      </div>
                      {getFieldError('venue') && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('venue')}
                        </motion.p>
                      )}
                    </div>
                    
                    {/* Location Coordinates */}
<div className="md:col-span-2">
  <label htmlFor="locationCoordinates" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
    Location <span className="text-red-500">*</span>
  </label>
  <LocationPicker 
    initialCoordinates={eventData.locationCoordinates} 
    onLocationSelect={(coordinates) => {
      setEventData(prev => ({
        ...prev,
        locationCoordinates: coordinates
      }));
    }} 
  />
</div>
                    
                    {/* Start Date */}
                    <div>
                      <label htmlFor="startedAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Start Date and Time <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
  type="datetime-local"
  id="startedAt"
  name="startedAt"
  value={eventData.startedAt ? formatDateForInput(eventData.startedAt) : ''}
  onChange={handleInputChange}
  className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('startedAt') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white`}
/>
                      </div>
                      {getFieldError('startedAt') && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('startedAt')}
                        </motion.p>
                      )}
                    </div>
                    
                    {/* End Date */}
                    <div>
                      <label htmlFor="endedAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        End Date and Time <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
  type="datetime-local"
  id="endedAt"
  name="endedAt"
  value={eventData.endedAt ? formatDateForInput(eventData.endedAt) : ''}
  onChange={handleInputChange}
  className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('endedAt') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white`}
/>
                      </div>
                      {getFieldError('endedAt') && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('endedAt')}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Event Settings Section */}
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Event Settings</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Published Date */}
                    <div>
                      <label htmlFor="publishedAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Publication Date <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        
                        <input
  type="datetime-local"
  id="publishedAt"
  name="publishedAt"
  value={eventData.publishedAt ? formatDateForInput(eventData.publishedAt) : ''}
  onChange={handleInputChange}
  className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('publishedAt') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white`}
/>
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        When the event should become visible to attendees
                      </p>
                    </div>
                    
                    {/* Tickets Available From */}
                    <div>
                      <label htmlFor="ticketsAvailableFrom" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Tickets Available From <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                          </svg>
                        </div>
                        
                        <input
  type="datetime-local"
  id="ticketsAvailableFrom"
  name="ticketsAvailableFrom"
  value={eventData.ticketsAvailableFrom ? formatDateForInput(eventData.ticketsAvailableFrom) : ''}
  onChange={handleInputChange}
  className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('ticketsAvailableFrom') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white`}
/>
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        When tickets should become available for purchase
                      </p>
                    </div>
                    
                    {/* Event Visibility */}
                    <div>
                      <label htmlFor="attendeeVisibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Event Visibility <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <select
                          id="attendeeVisibility"
                          name="attendeeVisibility"
                          value={eventData.attendeeVisibility || 'EVERYONE'}
                          onChange={handleInputChange}
                          className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('attendeeVisibility') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white appearance-none`}
                        >
                          <option value="EVERYONE">Everyone (Public)</option>
                          <option value="ATTENDEES_ONLY">Attendees Only</option>
                          <option value="NOBODY">Nobody (Private)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      {getFieldError('attendeeVisibility') && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('attendeeVisibility')}
                        </motion.p>
                      )}
                    </div>
                    
                    {/* Event Status */}
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Event Status <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <select
                          id="status"
                          name="status"
                          value={eventData.status || 'DRAFT'}
                          onChange={handleInputChange}
                          className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('status') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white appearance-none`}
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="SALES_STARTED">Sales started</option>
                          <option value="ONGOING">Ongoing</option>
                          <option value="FINISHED">Finished</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      {getFieldError('status') && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('status')}
                        </motion.p>
                      )}
                    </div>
                    
                    {/* Format Selection */}
                    <div>
                      <label htmlFor="formatId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Event Format <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                        </div>
                        <select
                          id="formatId"
                          name="formatId"
                          value={eventData.formatId || ''}
                          onChange={handleInputChange}
                          className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('formatId') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white appearance-none`}
                        >
                          <option value="">Select a format</option>
                          {formats.map(format => (
                            <option key={format.id} value={format.id}>{format.title}</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      {getFieldError('formatId') && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {getFieldError('formatId')}
                        </motion.p>
                      )}
                    </div>
                    
                    {/* Event Poster */}
                    <div className="md:col-span-2">
                      <label htmlFor="posterFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Event Poster <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                      </label>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <div className={`w-40 h-40 rounded-xl overflow-hidden ${(posterPreview || eventData.posterName) ? '' : 'border-2 border-dashed border-gray-300 dark:border-gray-600'} relative group`}>
                          {posterPreview ? (
                            <>
                              <img 
                                src={posterPreview} 
                                alt="Event poster preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  type="button"
                                  onClick={handlePosterButtonClick}
                                  className="text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                >
                                  Change
                                </button>
                              </div>
                            </>
                          ) : eventData.posterName ? (
                            <>
                              <img 
                                src={getImageUrl(eventData.posterName)} 
                                alt="Event poster"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  type="button"
                                  onClick={handlePosterButtonClick}
                                  className="text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                >
                                  Change
                                </button>
                              </div>
                            </>
                          ) : (
                            <div 
                              onClick={handlePosterButtonClick} 
                              className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Add Poster</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <button
                            type="button"
                            onClick={handlePosterButtonClick}
                            className="inline-flex items-center px-4 py-2.5 border-2 border-emerald-500 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-gray-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 font-medium rounded-xl transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            {(posterPreview || eventData.posterName) ? 'Replace Poster' : 'Upload Poster'}
                          </button>
                          <input
                            ref={posterInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handlePosterChange}
                          />
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Recommended: 1200x628 pixels, up to 5MB. JPG, PNG, GIF, or SVG.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Themes Section */}
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Event Themes</h3>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      Choose themes that best describe your event. This will help potential attendees discover your event more easily.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {availableThemes.map(theme => {
                      const isSelected = selectedThemes.includes(theme.id);
                      
                      return (
                        <motion.div 
                          key={theme.id}
                          onClick={() => handleThemeChange(theme.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`px-5 py-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-800'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-5 h-5 rounded flex items-center justify-center ${
                              isSelected ? 'bg-emerald-500 text-white' : 'border-2 border-gray-300 dark:border-gray-600'
                            }`}>
                              {isSelected && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <label className={`ml-3 block text-base font-medium ${
                              isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-200'
                            } cursor-pointer`}>
                              {theme.title}
                            </label>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Tickets Section */}
<div>
  <div className="flex items-center mb-6">
    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mr-3">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
      </svg>
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Event Tickets</h3>
  </div>
  
  <div className="mb-4">
    <p className="text-gray-600 dark:text-gray-300">
      Manage tickets for your event with varying prices and quantities.
    </p>
  </div>
  
  {/* Current Tickets List - Fixed to properly count quantities */}
{eventTickets.length > 0 ? (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden mb-6">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ticket Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Price
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Quantity
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {(() => {
            const ticketGroups = {};
            
            eventTickets.forEach(ticket => {
              const key = `${ticket.title}`;
              if (!ticketGroups[key]) {
                ticketGroups[key] = {
                  title: ticket.title,
                  price: ticket.price,
                  statusGroups: {}
                };
              }
              
              if (!ticketGroups[key].statusGroups[ticket.status]) {
                ticketGroups[key].statusGroups[ticket.status] = {
                  status: ticket.status,
                  count: 0,
                  tickets: []
                };
              }
              
              const quantity = typeof ticket.quantity === 'number' ? ticket.quantity : 1;
              
              ticketGroups[key].statusGroups[ticket.status].count += quantity;
              
              ticketGroups[key].statusGroups[ticket.status].tickets.push(ticket);
            });

            return Object.values(ticketGroups).flatMap(group => {
              return Object.values(group.statusGroups).map(statusGroup => (
                <tr key={`${group.title}-${statusGroup.status}`} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{group.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 dark:text-gray-300">${group.price.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                      statusGroup.status === 'AVAILABLE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      statusGroup.status === 'SOLD' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      statusGroup.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      statusGroup.status === 'UNAVAILABLE' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        statusGroup.status === 'AVAILABLE' ? 'bg-green-500' :
                        statusGroup.status === 'SOLD' ? 'bg-red-500' :
                        statusGroup.status === 'RESERVED' ? 'bg-yellow-500' :
                        statusGroup.status === 'UNAVAILABLE' ? 'bg-gray-500' :
                        'bg-gray-500'
                      }`}></span>
                      {statusGroup.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{statusGroup.tickets.length}</div>
                  </td>
                </tr>
              ));
            });
          })()}
        </tbody>
      </table>
    </div>
  </div>
) : (
  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 flex flex-col items-center justify-center text-center border border-dashed border-gray-300 dark:border-gray-700 mb-6">
    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
      </svg>
    </div>
    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Tickets Yet</h4>
    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
      Add tickets to your event to allow attendees to register and participate.
    </p>
  </div>
)}
  
  {/* Add New Ticket Form */}
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
    <div className="px-6 py-4  bg-emerald-600  dark:bg-emerald-900/40 text-white">
      <h4 className="text-lg font-semibold">Add New Ticket</h4>
      <p className="text-sm text-purple-100 mt-1">Create a new ticket type for your event</p>
    </div>
    
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="ticketTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Ticket Title <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
              </svg>
            </div>
            <input
              type="text"
              id="ticketTitle"
              name="title"
              value={newTicket.title}
              onChange={handleTicketChange}
              className="w-full pl-12 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white"
              placeholder="e.g., VIP Ticket, Early Bird, etc."
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Price <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h1a1 1 0 011 1v1a1 1 0 01-1 1H6a1 1 0 110-2h1a1 1 0 001-1v-1a1 1 0 00-1-1H6a1 1 0 010-2h3a1 1 0 010 2h-1a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 110 2H7a1 1 0 01-1-1v-1a1 1 0 011-1h1a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none text-gray-700 dark:text-gray-300 font-medium">
              <span className="ml-2">$</span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              id="ticketPrice"
              name="price"
              value={newTicket.price}
              onChange={handleTicketChange}
              className="w-full pl-16 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="ticketStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Status <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <select
              id="ticketStatus"
              name="status"
              value={newTicket.status}
              onChange={handleTicketChange}
              className="w-full pl-12 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white appearance-none"
            >
              <option value="AVAILABLE">Available</option>
              <option value="SOLD">Sold Out</option>
              <option value="RESERVED">Reserved</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="ticketQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Quantity <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            </div>
            <input
              type="number"
              min="1"
              id="ticketQuantity"
              name="quantity"
              value={newTicket.quantity}
              onChange={handleTicketChange}
              className="w-full pl-12 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white"
              placeholder="1"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleAddTicket}
          disabled={!newTicket.title || newTicket.price < 0 || newTicket.quantity < 1}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 dark:disabled:bg-emerald-800/40 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          <span>Add Ticket</span>
        </button>
      </div>
    </div>
  </div>
</div>
                {/* Promo Codes Section */}
<div>
  <div className="flex items-center mb-6">
    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mr-3">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
      </svg>
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Promo Codes</h3>
  </div>
  
  <div className="mb-4">
    <div className="flex items-center justify-between">
      <p className="text-gray-600 dark:text-gray-300">
        Create promotional codes for your event to offer discounts to attendees.
      </p>
      {!isAddingPromoCode && (
        <button
          type="button"
          onClick={() => setIsAddingPromoCode(true)}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Promo Code
        </button>
      )}
    </div>
  </div>
  
{/* Add/Edit Promo Code Form */}
{(isAddingPromoCode || isEditingPromoCode !== null) && (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 mb-6">
    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
      {isEditingPromoCode !== null ? 'Edit Promo Code' : 'Add New Promo Code'}
    </h4>
    
    <div>
      <div className="space-y-6">
        {/* Promo Code Title - Always visible */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={newPromoCode.title || ''}
            onChange={handlePromoCodeInputChange}
            className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white"
            placeholder="E.g., Early Bird, VIP Discount"
            required
          />
        </div>
        
        {/* Fields only visible when creating a new promo code */}
        {!isEditingPromoCode && (
          <>
            {/* Promo Code */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={newPromoCode.code || ''}
                onChange={handlePromoCodeInputChange}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white uppercase"
                placeholder="E.g., EARLYBIRD2025"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Code that attendees will enter during checkout
              </p>
            </div>
            
            {/* Discount Percent */}
            <div>
              <label htmlFor="discountPercent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Discount Percentage <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="discountPercent"
                  name="discountPercent"
                  value={newPromoCode.discountPercent || ''}
                  onChange={handlePromoCodeInputChange}
                  min="1"
                  max="100"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white"
                  placeholder="10"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 dark:text-gray-400">
                  %
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Active Status - Always visible */}
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <div className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Active</div>
            <div className="relative">
              <input
                type="checkbox"
                name="isActive"
                checked={newPromoCode.isActive}
                onChange={handlePromoCodeInputChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 dark:peer-focus:ring-emerald-600 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
            </div>
          </label>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={handleCancelPromoCodeForm}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 font-medium rounded-lg transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (isEditingPromoCode !== null) {
              handleUpdatePromoCode(isEditingPromoCode);
            } else {
              handleCreatePromoCode(e);
            }
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm shadow-sm"
        >
          {isEditingPromoCode !== null ? 'Update Promo Code' : 'Create Promo Code'}
        </button>
      </div>
    </div>
  </div>
)}
  
  {/* Promo Codes List */}
  {promoCodesList.length > 0 ? (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Code
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Discount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {promoCodesList.map(promoCode => (
              <tr key={promoCode.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {promoCode.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {promoCode.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {(promoCode.discountPercent * 100).toFixed(0)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    promoCode.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {promoCode.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePromoCodeStatus(promoCode)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        promoCode.isActive 
                          ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20'
                          : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                      }`}
                      title={promoCode.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {promoCode.isActive ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditPromoCode(promoCode)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ) : (
    !isAddingPromoCode && (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 flex flex-col items-center justify-center text-center border border-dashed border-gray-300 dark:border-gray-700">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
          </svg>
        </div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Promo Codes Yet</h4>
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          Create promotional codes to offer discounts to your attendees. These can help drive ticket sales and increase attendance.
        </p>
        <button
          type="button"
          onClick={() => setIsAddingPromoCode(true)}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Your First Promo Code
        </button>
      </div>
    )
  )}
</div>
                {/* Submit/Cancel Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <Link
                    href={`/events/${eventData.id}`}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 font-medium rounded-xl transition-colors shadow-sm dark:shadow-none"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSaving || isUploading}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {isSaving || isUploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
      
    </>
  );
};

export default EditEventPage;

