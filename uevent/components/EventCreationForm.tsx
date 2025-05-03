import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompany } from '../contexts/CompanyContext';
import { useEvents } from '../contexts/EventContext';
import { eventService } from '../services/eventService';
import {
  EventBasicInfoSchema,
  EventThemesSchema,
  EventTicketsSchema,
  EventFormData,
  EventBasicInfo,
  EventThemes,
  EventTickets,
  EventTicket
} from './eventValidation';
import { usePromoCodes } from '../contexts/PromoCodeContext';
import LocationPicker from '../components/LocationPicker';
import  {useCallback } from 'react';

type Step = 'basicInfo' | 'themes' | 'tickets' | 'promoCodes' | 'review';

interface Format {
  id: number;
  title: string;
}

interface Theme {
  id: number;
  title: string;
}

const EventCreationForm: React.FC<{}> = () => {
  const router = useRouter();
  const { company } = useCompany();
  const { createEvent, syncThemes, createTickets, uploadPoster } = useEvents();
  
  const { createPromoCode } = usePromoCodes();
  
  const [currentStep, setCurrentStep] = useState<Step>('basicInfo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');

  const [formData, setFormData] = useState<EventFormData>(() => ({
  basicInfo: {
    title: '',
    description: '',
    venue: '',
    locationCoordinates: '',
    startedAt: '',
    endedAt: '',
    publishedAt: '',
    ticketsAvailableFrom: '',
    attendeeVisibility: 'EVERYONE',
    status: 'DRAFT',
    companyId: company?.id || 0,
    formatId: 0
  },
  themes: {
    themes: []
  },
  tickets: {
    tickets: []
  },
  promoCodes: {
    promoCodes: []
  }
}));
  
  const [errors, setErrors] = useState<{
    basicInfo: Record<string, string> | null;
    themes: Record<string, string> | null;
    tickets: Record<string, string> | null;
    promoCodes: Record<string, string> | null;
  }>({
    basicInfo: null,
    themes: null,
    tickets: null,
    promoCodes: null
  });

  const [formats, setFormats] = useState<Format[]>([]);
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);
  
  const posterInputRef = useRef<HTMLInputElement>(null);
  
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  
  const [newTicket, setNewTicket] = useState<EventTicket>({
    title: '',
    price: 0,
    status: 'AVAILABLE',
    quantity: 1
  });
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  
  try {

    const date = new Date(dateString);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const loadingToast = toast.loading('Loading options...');
        
        const [formatsData, themesData] = await Promise.all([
          eventService.getFormats(),
          eventService.getThemes()
        ]);
        
        setFormats(formatsData);
        setAvailableThemes(themesData);
        
        toast.update(loadingToast, { 
          render: 'Form options loaded successfully', 
          type: 'success',
          isLoading: false,
          autoClose: 2000,
          closeButton: true
        });
      } catch (error) {
        console.error('Error fetching form options:', error);
        toast.error('Failed to load form options. Please try refreshing the page.', {
          position: 'top-right',
          closeOnClick: true,
          hideProgressBar: false,
        });
      }
    };
    
    fetchData();
  }, []);
  
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
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date for display:', error);
      return dateString;
    }
  };
  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'startedAt' || name === 'endedAt' || name === 'publishedAt' || name === 'ticketsAvailableFrom') {
      if (value) {

        const localDate = new Date(value);
        const utcString = localDate.toISOString();
        
        setFormData(prev => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            [name]: utcString
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            [name]: ''
          }
        }));
      }
    }
    else if (name === 'formatId') {
      setFormData(prev => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          [name]: value ? parseInt(value, 10) : 0
        }
      }));
    } 
    else {
      setFormData(prev => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          [name]: value
        }
      }));
    }
  };
  const onLocationSelect = useCallback((newCoordinates) => {
    setFormData(prevFormData => {
      if (prevFormData.basicInfo.locationCoordinates === newCoordinates) {
        return prevFormData;
      }
      
      return {
        ...prevFormData,
        basicInfo: {
          ...prevFormData.basicInfo,
          locationCoordinates: newCoordinates
        }
      };
    });
  }, []);
  const onAddressFound = useCallback((address) => {
    setFormData(prevFormData => {
      if (prevFormData.basicInfo.venue && prevFormData.basicInfo.venue !== address) {
        return {
          ...prevFormData,
          basicInfo: {
            ...prevFormData.basicInfo,
            venue: address
          }
        };
      }
      return prevFormData;
    });
  }, []);
  const handleThemeChange = (themeId: number) => {
    setFormData(prev => {
      const themes = prev.themes.themes.includes(themeId)
        ? prev.themes.themes.filter(id => id !== themeId)
        : [...prev.themes.themes, themeId];
        
      return {
        ...prev,
        themes: { themes }
      };
    });
  };
  
  const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTicket(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' ? parseFloat(value) : value
    }));
  };
  
  const handleAddTicket = () => {
    if (!newTicket.title) {
      toast.warning('Please enter a ticket title', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      tickets: {
        tickets: [...prev.tickets.tickets, newTicket]
      }
    }));
    
    setNewTicket({
      title: '',
      price: 0,
      status: 'AVAILABLE',
      quantity: 1
    });

    toast.success('Ticket added successfully!', {
      icon: '🎟️',
      position: 'bottom-right',
      autoClose: 2000,
    });
  };

  const handleRemoveTicket = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tickets: {
        tickets: prev.tickets.tickets.filter((_, i) => i !== index)
      }
    }));

    toast.info('Ticket removed', {
      position: 'bottom-right',
      autoClose: 2000,
    });
  };

  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPromoCode(prev => ({
      ...prev,
      [name]: name === 'discountPercent' ? parseFloat(value) : 
              name === 'isActive' ? value === 'true' : value
    }));
  };

const handleAddPromoCode = () => {
  if (!newPromoCode.title || !newPromoCode.code) {
    toast.warning('Please enter a title and code for the promo code', {
      position: 'bottom-right',
      autoClose: 3000,
    });
    return;
  }

  setFormData(prev => ({
    ...prev,
    promoCodes: {
      promoCodes: [...prev.promoCodes.promoCodes, newPromoCode]
    }
  }));

  setNewPromoCode({
    title: '',
    code: '',
    discountPercent: 0,
    isActive: true
  });

  toast.success('Promo code added successfully!', {
    icon: '🏷️',
    position: 'bottom-right',
    autoClose: 2000,
  });
};

const handleRemovePromoCode = (index: number) => {
  setFormData(prev => ({
    ...prev,
    promoCodes: {
      promoCodes: prev.promoCodes.promoCodes.filter((_, i) => i !== index)
    }
  }));

  toast.info('Promo code removed', {
    position: 'bottom-right',
    autoClose: 2000,
  });
};

  const validateStep = (step: Step): boolean => {
    let isValid = true;
    
    if (step === 'basicInfo') {
      try {
        EventBasicInfoSchema.parse(formData.basicInfo);
        setErrors(prev => ({ ...prev, basicInfo: null }));
      } catch (error: any) {
        isValid = false;
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          formattedErrors[err.path[0]] = err.message;
        });
        setErrors(prev => ({ ...prev, basicInfo: formattedErrors }));
      }
    } else if (step === 'themes') {
      try {
        EventThemesSchema.parse(formData.themes);
        setErrors(prev => ({ ...prev, themes: null }));
      } catch (error: any) {
        isValid = false;
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          formattedErrors[err.path[0]] = err.message;
        });
        setErrors(prev => ({ ...prev, themes: formattedErrors }));
      }
    } else if (step === 'tickets') {
      try {
        EventTicketsSchema.parse(formData.tickets);
        setErrors(prev => ({ ...prev, tickets: null }));
      } catch (error: any) {
        isValid = false;
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          formattedErrors[err.path[0]] = err.message;
        });
        setErrors(prev => ({ ...prev, tickets: formattedErrors }));
      }
    }
    
    return isValid;
  };
  
  const handleNextStep = () => {
    if (currentStep === 'basicInfo' && validateStep('basicInfo')) {
      setAnimationDirection('forward');
      setCurrentStep('themes');
    } else if (currentStep === 'themes' && validateStep('themes')) {
      setAnimationDirection('forward');
      setCurrentStep('tickets');
    } else if (currentStep === 'tickets' && validateStep('tickets')) {
      setAnimationDirection('forward');
      setCurrentStep('promoCodes');
    } else if (currentStep === 'promoCodes') {
      setAnimationDirection('forward');
      setCurrentStep('review');
    }
  };
  
  const handlePrevStep = () => {
    setAnimationDirection('backward');
    if (currentStep === 'themes') {
      setCurrentStep('basicInfo');
    } else if (currentStep === 'tickets') {
      setCurrentStep('themes');
    } else if (currentStep === 'promoCodes') {
      setCurrentStep('tickets');
    } else if (currentStep === 'review') {
      setCurrentStep('promoCodes');
    }
  };

  const handleSubmit = async () => {
    const basicInfoValid = validateStep('basicInfo');
    const themesValid = validateStep('themes');
    const ticketsValid = validateStep('tickets');
    
    if (!basicInfoValid || !themesValid || !ticketsValid) {
      toast.error('Please fix all errors before submitting', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submitToast = toast.loading('Creating your event...', {
        position: 'top-center',
      });
      
      const eventResult = await createEvent(formData.basicInfo);
      
      if (!eventResult.success || !eventResult.eventId) {
        throw new Error(eventResult.message || 'Failed to create event');
      }
      
      const eventId = eventResult.eventId;
      
      const themesResult = await syncThemes(eventId, formData.themes.themes);
      
      if (!themesResult.success) {
        throw new Error(themesResult.message || 'Failed to sync event themes');
      }
      const ticketsResult = await createTickets(eventId, formData.tickets.tickets);
      
      if (!ticketsResult.success) {
        throw new Error(ticketsResult.message || 'Failed to create event tickets');
      }
      
if (formData.promoCodes.promoCodes.length > 0) {
  try {

    const failedPromoCodes = [];
    for (const promoCode of formData.promoCodes.promoCodes) {
      try {
        const result = await createPromoCode(eventId, {
          eventId,
          title: promoCode.title,
          code: promoCode.code.toUpperCase(),
          discountPercent: promoCode.discountPercent / 100, 
          isActive: promoCode.isActive
        });
        
        if (!result.success) {
          failedPromoCodes.push(promoCode);
          console.warn(`Failed to create promo code: ${promoCode.code}`, result);
        }
      } catch (error) {
        failedPromoCodes.push(promoCode);
        console.error(`Error creating promo code ${promoCode.code}:`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    if (failedPromoCodes.length > 0) {
      console.warn(`${failedPromoCodes.length} promo code(s) failed to create`);
      toast.warning(`${failedPromoCodes.length} promo code(s) failed to create`, {
        position: 'top-right',
        autoClose: 4000,
      });
    }
  } catch (error) {
    console.error('Error creating promo codes:', error);
    toast.warning('Event created, but some promo codes may not have been created', {
      position: 'top-right',
      autoClose: 4000,
    });
  }
}
      
      if (posterFile) {
        const posterResult = await uploadPoster(posterFile, eventId);
        
        if (!posterResult.success) {
          toast.warning('Event created, but poster upload failed', {
            position: 'top-right',
          });
        }
      }
      
      toast.update(submitToast, {
        render: '🎉 Event created successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
        closeButton: true
      });
      
      setTimeout(() => {
        console.log('Redirecting to event page:', eventId);
        router.push(`/events/${eventId}`);
      }, 1500);
      
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create event', {
        position: 'top-center',
        autoClose: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
useEffect(() => {
  const handleKeyDown = (e) => {
    if (
      e.target.tagName === 'INPUT' || 
      e.target.tagName === 'TEXTAREA' || 
      e.target.tagName === 'SELECT' ||
      document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA' ||
      document.activeElement.tagName === 'SELECT'
    ) {
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
    }

    if (e.key === 'ArrowLeft') {
      if (currentStep === 'themes') {
        setAnimationDirection('backward');
        setCurrentStep('basicInfo');
      } else if (currentStep === 'tickets') {
        setAnimationDirection('backward');
        setCurrentStep('themes');
      } else if (currentStep === 'review') {
        setAnimationDirection('backward');
        setCurrentStep('tickets');
      }
    }
    else if (e.key === 'ArrowRight') {
  if (currentStep === 'basicInfo' && validateStep('basicInfo')) {
    setAnimationDirection('forward');
    setCurrentStep('themes');
  } else if (currentStep === 'themes' && validateStep('themes')) {
    setAnimationDirection('forward');
    setCurrentStep('tickets');
  } else if (currentStep === 'tickets' && validateStep('tickets')) {
    setAnimationDirection('forward');
    setCurrentStep('promoCodes');
  } else if (currentStep === 'promoCodes') {
    setAnimationDirection('forward');
    setCurrentStep('review');
  } else if (currentStep === 'review' && !isSubmitting) {
    handleSubmit();
  }
}
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [currentStep, isSubmitting]);

const [keyFeedback, setKeyFeedback] = useState({
  left: false,
  right: false
});

useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      setKeyFeedback(prev => ({ ...prev, left: true }));
    } else if (e.key === 'ArrowRight') {
      setKeyFeedback(prev => ({ ...prev, right: true }));
    }
  };
  
  const handleKeyUp = (e) => {
    if (e.key === 'ArrowLeft') {
      setKeyFeedback(prev => ({ ...prev, left: false }));
    } else if (e.key === 'ArrowRight') {
      setKeyFeedback(prev => ({ ...prev, right: false }));
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, []);
  const getFieldError = (step: Step, field: string) => {
    return errors[step]?.[field] || '';
  };
  
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (error) {
    return dateString;
  }
};
  
  const getThemeName = (themeId: number) => {
    const theme = availableThemes.find(t => t.id === themeId);
    return theme?.title || `Theme ${themeId}`;
  };
  
  const getFormatName = (formatId: number) => {
    const format = formats.find(f => f.id === formatId);
    return format?.title || `Format ${formatId}`;
  };

  const steps: { key: Step; label: string }[] = [
    { key: 'basicInfo', label: 'Basic Info' },
    { key: 'themes', label: 'Themes' },
    { key: 'tickets', label: 'Tickets' },
    { key: 'promoCodes', label: 'Promo Codes' },
    { key: 'review', label: 'Review' }
  ];

  const [newPromoCode, setNewPromoCode] = useState<{
    title: string;
    code: string;
    discountPercent: number;
    isActive: boolean;
  }>({
    title: '',
    code: '',
    discountPercent: 0,
    isActive: true
  });

  const progressPercentage = (() => {
    const stepIndex = steps.findIndex(s => s.key === currentStep);
    return ((stepIndex + 1) / steps.length) * 100;
  })();

  const pageVariants = {
    initial: (direction: string) => ({
      x: direction === 'forward' ? 20 : -20,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: string) => ({
      x: direction === 'forward' ? -20 : 20,
      opacity: 0,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  const labelVariants = {
    inactive: { color: 'var(--color-gray-400)' },
    active: { 
      color: 'var(--color-emerald-600)',
      transition: { duration: 0.3 }
    }
  };

  const circleVariants = {
    inactive: { 
      backgroundColor: 'var(--color-gray-100)',
      borderColor: 'var(--color-gray-300)',
      transition: { duration: 0.3 }
    },
    active: { 
      backgroundColor: 'var(--color-emerald-50)',
      borderColor: 'var(--color-emerald-500)',
      transition: { duration: 0.3 }
    },
    completed: {
      backgroundColor: 'var(--color-emerald-500)',
      borderColor: 'var(--color-emerald-500)',
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 shadow-xl dark:shadow-emerald-900/10 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800">
      <div className="relative overflow-hidden bg-emerald-600 py-8 px-8">
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-grid-white/[0.2] bg-[length:16px_16px]"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-1">Create New Event</h2>
          <p className="text-emerald-50">Create an unforgettable experience for your audience</p>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/20 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-400/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="relative px-8 py-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="absolute top-0 left-0 h-1 bg-emerald-100 dark:bg-gray-800 w-full">
          <motion.div 
            className="h-full bg-emerald-500" 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>

        <div className="flex justify-between items-center pt-3">
          {steps.map((step, index) => {
            const isActive = currentStep === step.key;
            const isCompleted = steps.findIndex(s => s.key === currentStep) > index;
            
            return (
              <div key={step.key} className="flex flex-col items-center relative">
                
                {index > 0 && (
                  <div className="absolute top-5 -left-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
                    {isCompleted || (index === steps.findIndex(s => s.key === currentStep) && index > 0) ? (
                      <motion.div 
                        className="h-full bg-emerald-500" 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      />
                    ) : null}
                  </div>
                )}
                
                <motion.div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : isActive 
                        ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                  } mb-2 transition-all duration-300`}
                  variants={circleVariants}
                  animate={isCompleted ? 'completed' : isActive ? 'active' : 'inactive'}
                >
                  {isCompleted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </motion.div>
                
 
                <motion.span 
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'
                  }`}
                  variants={labelVariants}
                  animate={isActive ? 'active' : 'inactive'}
                >
                  {step.label}
                </motion.span>
              </div>
            );
          })}
        </div>
      </div>
      
      
      <div className="p-8">
        <AnimatePresence mode="wait" custom={animationDirection}>
          
          {currentStep === 'basicInfo' && (
            <motion.div
              key="basicInfo"
              custom={animationDirection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="md:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.basicInfo.title}
                      onChange={handleBasicInfoChange}
                      className={`w-full px-4 py-3 rounded-xl border-2 ${getFieldError('basicInfo', 'title') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white`}
                      placeholder="Enter an engaging title for your event"
                    />
                    {/* <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2 1a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7zm0 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div> */}
                    {/* <input
                      type="text"
                      className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('basicInfo', 'title') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white`}
                      placeholder="Enter an engaging title for your event"
                      value={formData.basicInfo.title}
                      onChange={handleBasicInfoChange}
                      name="title"
                    /> */}
                  </div>
                  {getFieldError('basicInfo', 'title') && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {getFieldError('basicInfo', 'title')}
                    </motion.p>
                  )}
                </div>
                
                
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
                      value={formData.basicInfo.description}
                      onChange={handleBasicInfoChange}
                      rows={5}
                      className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('basicInfo', 'description') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white resize-none`}
                      placeholder="Describe your event in detail. What makes it special? What can attendees expect?"
                    />
                  </div>
                  {getFieldError('basicInfo', 'description') && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {getFieldError('basicInfo', 'description')}
                    </motion.p>
                  )}
                </div>

                
                <div className="md:col-span-2 pt-4 pb-2">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Location & Timing
                  </h4>
                </div>
                
                
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
                      value={formData.basicInfo.venue}
                      onChange={handleBasicInfoChange}
                      className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('basicInfo', 'venue') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white`}
                      placeholder="Enter venue name"
                    />
                  </div>
                  {getFieldError('basicInfo', 'venue') && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {getFieldError('basicInfo', 'venue')}
                    </motion.p>
                  )}
                </div>
                
                
                <div className="md:col-span-2">
  <label htmlFor="locationCoordinates" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
    Location Map <span className="text-red-500">*</span>
  </label>
  <LocationPicker
    initialCoordinates={formData.basicInfo.locationCoordinates}
    onLocationSelect={onLocationSelect}
  />
</div>
                
                
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
  value={formData.basicInfo.startedAt ? formatDateForInput(formData.basicInfo.startedAt) : ''}
  onChange={handleBasicInfoChange}
  className="w-full pl-12 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white"
/>
                  </div>
                  {getFieldError('basicInfo', 'startedAt') && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {getFieldError('basicInfo', 'startedAt')}
                    </motion.p>
                  )}
                </div>
                
                
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
      value={formData.basicInfo.endedAt ? formatDateForInput(formData.basicInfo.endedAt) : ''}
      onChange={handleBasicInfoChange}
      className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('basicInfo', 'endedAt') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white`}
    />
                  </div>
                  {getFieldError('basicInfo', 'endedAt') && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {getFieldError('basicInfo', 'endedAt')}
                    </motion.p>
                  )}
                </div>
                
                
                <div className="md:col-span-2 pt-4 pb-2">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Event Settings
                  </h4>
                </div>
                
                
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
      value={formData.basicInfo.publishedAt ? formatDateForInput(formData.basicInfo.publishedAt) : ''}
      onChange={handleBasicInfoChange}
      className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('basicInfo', 'publishedAt') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white`}
    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    When the event should become visible to attendees
                  </p>
                </div>
                
                
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
      value={formData.basicInfo.ticketsAvailableFrom ? formatDateForInput(formData.basicInfo.ticketsAvailableFrom) : ''}
      onChange={handleBasicInfoChange}
      className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('basicInfo', 'ticketsAvailableFrom') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white`}
    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    When tickets should become available for purchase
                  </p>
                </div>
                
                
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
                      value={formData.basicInfo.attendeeVisibility}
                      onChange={handleBasicInfoChange}
                      className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('basicInfo', 'attendeeVisibility') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white appearance-none`}
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
                  {getFieldError('basicInfo', 'attendeeVisibility') && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {getFieldError('basicInfo', 'attendeeVisibility')}
                    </motion.p>
                  )}
                </div>
                
                
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
                      value={formData.basicInfo.status}
                      onChange={handleBasicInfoChange}
                      className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('basicInfo', 'status') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white appearance-none`}
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
                  {getFieldError('basicInfo', 'status') && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {getFieldError('basicInfo', 'status')}
                    </motion.p>
                  )}
                </div>
                
                
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
                      value={formData.basicInfo.formatId || ''}
                      onChange={handleBasicInfoChange}
                      className={`w-full pl-12 px-4 py-3 rounded-xl border-2 ${getFieldError('basicInfo', 'formatId') ? 'border-red-300 dark:border-red-600' : 'border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700'} focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white appearance-none`}
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
                  {getFieldError('basicInfo', 'formatId') && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {getFieldError('basicInfo', 'formatId')}
                    </motion.p>
                  )}
                </div>
                
                
                <div className="md:col-span-2">
                  <label htmlFor="posterFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Event Poster <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className={`w-40 h-40 rounded-xl overflow-hidden ${posterPreview ? '' : 'border-2 border-dashed border-gray-300 dark:border-gray-600'} relative group`}>
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
                        {posterPreview ? 'Replace Poster' : 'Upload Poster'}
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
            </motion.div>
          )}
          
          
          {currentStep === 'themes' && (
            <motion.div
              key="themes"
              custom={animationDirection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Select Event Themes</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Choose themes that best describe your event. This will help potential attendees discover your event more easily.
                </p>
              </div>
              
              {getFieldError('themes', 'themes') && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-md"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 dark:text-red-400">{getFieldError('themes', 'themes')}</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableThemes.map(theme => {
                  const isSelected = formData.themes.themes.includes(theme.id);
                  
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
              
              {availableThemes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No themes available</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    No event themes are currently available. You can continue to the next step and add themes later.
                  </p>
                </div>
              )}
            </motion.div>
          )}
          
          
          {currentStep === 'tickets' && (
            <motion.div
              key="tickets"
              custom={animationDirection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Event Tickets</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Create different ticket types for your event with varying prices and quantities.
                </p>
              </div>
              
              {getFieldError('tickets', 'tickets') && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-md"
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700 dark:text-red-400">{getFieldError('tickets', 'tickets')}</p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              
              {formData.tickets.tickets.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-md border border-gray-100 dark:border-gray-700 mb-8"
                >
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Current Tickets</h4>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
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
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {formData.tickets.tickets.map((ticket, index) => (
                          <motion.tr 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{ticket.title}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700 dark:text-gray-300">${ticket.price.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                                ticket.status === 'AVAILABLE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                ticket.status === 'SOLD' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  ticket.status === 'AVAILABLE' ? 'bg-green-500' :
                                  ticket.status === 'SOLD' ? 'bg-red-500' :
                                  'bg-yellow-500'
                                }`}></span>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700 dark:text-gray-300">{ticket.quantity}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                type="button"
                                onClick={() => handleRemoveTicket(index)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Remove
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
              
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-md border border-gray-100 dark:border-gray-700"
              >
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white">
                  <h4 className="text-lg font-semibold">Add New Ticket</h4>
                  <p className="text-sm text-emerald-100 mt-1">Create a new ticket type for your event</p>
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
              </motion.div>
            </motion.div>
          )}
          
{currentStep === 'promoCodes' && (
  <motion.div
    key="promoCodes"
    custom={animationDirection}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="space-y-8"
  >
    <div className="flex items-center mb-2">
      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mr-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Promo Codes</h3>
    </div>
    
    <div className="mb-4">
      <p className="text-gray-600 dark:text-gray-300">
        Create promotional codes for discounts on your event tickets.
      </p>
    </div>
    
    
    {formData.promoCodes.promoCodes.length > 0 && (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-md border border-gray-100 dark:border-gray-700 mb-8"
      >
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Current Promo Codes</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Discount %
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {formData.promoCodes.promoCodes.map((promoCode, index) => (
                <motion.tr 
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{promoCode.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded inline-block">{promoCode.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700 dark:text-gray-300">{promoCode.discountPercent}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                      promoCode.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        promoCode.isActive ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      {promoCode.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => handleRemovePromoCode(index)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Remove
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    )}
    
    
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-md border border-gray-100 dark:border-gray-700"
    >
      <div className="px-6 py-4 bg-emerald-600 text-white">
        <h4 className="text-lg font-semibold">Add New Promo Code</h4>
        <p className="text-sm text-blue-100 mt-1">Create discount codes your attendees can use</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="promoTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
              </div>
              <input
                type="text"
                id="promoTitle"
                name="title"
                value={newPromoCode.title}
                onChange={handlePromoCodeChange}
                className="w-full pl-12 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white"
                placeholder="e.g., Early Bird, Friends & Family"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Code <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                id="promoCode"
                name="code"
                value={newPromoCode.code}
                onChange={handlePromoCodeChange}
                className="w-full pl-12 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white uppercase"
                placeholder="e.g., EARLYBIRD25"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Code must be unique and will be displayed in uppercase
            </p>
          </div>
          
          <div>
            <label htmlFor="discountPercent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Discount Percentage <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="absolute inset-y-0 right-12 flex items-center pointer-events-none text-gray-700 dark:text-gray-300 font-medium">
                <span>%</span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                id="discountPercent"
                name="discountPercent"
                value={newPromoCode.discountPercent}
                onChange={handlePromoCodeChange}
                className="w-full pl-12 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white"
                placeholder="15"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <select
                id="isActive"
                name="isActive"
                value={newPromoCode.isActive.toString()}
                onChange={handlePromoCodeChange}
                className="w-full pl-12 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 dark:bg-gray-800 dark:text-white appearance-none"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleAddPromoCode}
            disabled={!newPromoCode.title || !newPromoCode.code}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-100 dark:disabled:bg-emerald-900 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Add Promo Code</span>
          </button>
        </div>
      </div>
    </motion.div>
    
    
    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
      <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Tips for Effective Promo Codes
      </h5>
      <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
        <li className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Create codes that are easy to remember but hard to guess (e.g., EVENT2023)
        </li>
        <li className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Include a discount percentage in the code for clarity (e.g., SAVE20)
        </li>
        <li className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Use an inactive status if you want to set up codes now but activate them later
        </li>
      </ul>
    </div>
  </motion.div>
)}
          
          {currentStep === 'review' && (
            <motion.div
              key="review"
              custom={animationDirection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-8"
            >
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Review & Submit</h3>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Review your event details before finalizing. Check that all information is correct.
                </p>
              </div>
              
              <div className="space-y-8">
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-md border border-gray-100 dark:border-gray-700"
                >
                  <div className="px-6 py-4 bg-emerald-600 text-white flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-semibold">Basic Information</h4>
                      <p className="text-sm text-emerald-100 mt-0.5">Event details and location</p>
                    </div>
                    <button 
                      onClick={() => setCurrentStep('basicInfo')}
                      className="text-white hover:text-emerald-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Event Title</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{formData.basicInfo.title}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Venue</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">{formData.basicInfo.venue}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date & Time</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
  {formatDateForDisplay(formData.basicInfo.startedAt)}
</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">End Date & Time</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {formatDate(formData.basicInfo.endedAt)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Event Format</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white">
                          {getFormatName(Number(formData.basicInfo.formatId))}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</p>
                        <p className="text-base">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center ${
                            formData.basicInfo.status === 'PUBLISHED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            formData.basicInfo.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            <span className={`w-2 h-2 rounded-full mr-1.5 ${
                              formData.basicInfo.status === 'PUBLISHED' ? 'bg-green-500' :
                              formData.basicInfo.status === 'CANCELLED' ? 'bg-red-500' :
                              'bg-yellow-500'
                            }`}></span>
                            {formData.basicInfo.status}
                          </span>
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Visibility</p>
                        <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          {formData.basicInfo.attendeeVisibility}
                        </p>
                      </div>
                      
                      {formData.basicInfo.locationCoordinates && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Location Coordinates</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {formData.basicInfo.locationCoordinates}
                          </p>
                        </div>
                      )}
                      
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</p>
                        <p className="text-base text-gray-900 dark:text-white">{formData.basicInfo.description}</p>
                      </div>
                      
                      {posterPreview && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Event Poster</p>
                          <div className="mt-1 w-40 h-40 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img 
                              src={posterPreview} 
                              alt="Event poster"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
                
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-md border border-gray-100 dark:border-gray-700"
                >
                  <div className="px-6 py-4 bg-emerald-600 text-white flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-semibold">Event Themes</h4>
                      <p className="text-sm text-blue-100 mt-0.5">Categories that describe your event</p>
                    </div>
                    <button 
                      onClick={() => setCurrentStep('themes')}
                      className="text-white hover:text-blue-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-6">
                    {formData.themes.themes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.themes.themes.map(themeId => (
                          <span 
                            key={themeId}
                            className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium inline-flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            {getThemeName(themeId)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">No themes selected</p>
                    )}
                  </div>
                </motion.div>
                
                
<motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: 0.15 }}
  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-md border border-gray-100 dark:border-gray-700"
>
  <div className="px-6 py-4 bg-emerald-600 text-white flex justify-between items-center">
    <div>
      <h4 className="text-lg font-semibold">Promo Codes</h4>
      <p className="text-sm text-blue-100 mt-0.5">Discount codes for your event</p>
    </div>
    <button 
      onClick={() => setCurrentStep('promoCodes')}
      className="text-white hover:text-blue-100 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
      </svg>
    </button>
  </div>
  
  <div className="p-6">
    {formData.promoCodes.promoCodes.length > 0 ? (
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Code
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Discount %
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {formData.promoCodes.promoCodes.map((promoCode, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{promoCode.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded inline-block">{promoCode.code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700 dark:text-gray-300">{promoCode.discountPercent}%</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                    promoCode.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      promoCode.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    {promoCode.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p className="text-gray-500 dark:text-gray-400 italic">No promo codes added for this event</p>
    )}
  </div>
</motion.div>

                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-md border border-gray-100 dark:border-gray-700"
                >
                  <div className="px-6 py-4 bg-emerald-600 text-white flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-semibold">Event Tickets</h4>
                      <p className="text-sm text-purple-100 mt-0.5">Ticket types available for purchase</p>
                    </div>
                    <button 
                      onClick={() => setCurrentStep('tickets')}
                      className="text-white hover:text-purple-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-6">
                    {formData.tickets.tickets.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-900">
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
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {formData.tickets.tickets.map((ticket, index) => (
                              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{ticket.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-700 dark:text-gray-300">${ticket.price.toFixed(2)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                                    ticket.status === 'AVAILABLE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    ticket.status === 'SOLD' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                      ticket.status === 'AVAILABLE' ? 'bg-green-500' :
                                      ticket.status === 'SOLD' ? 'bg-red-500' :
                                      'bg-yellow-500'
                                    }`}></span>
                                    {ticket.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-700 dark:text-gray-300">{ticket.quantity}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                              No tickets added yet. Return to the tickets step to add tickets for your event.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
          {currentStep !== 'basicInfo' ? (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              type="button"
              onClick={handlePrevStep}
              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-xl transition-colors shadow-sm dark:shadow-none inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </motion.button>
          ) : (
            <div></div>
          )}
          
          {currentStep !== 'review' ? (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              type="button"
              onClick={handleNextStep}
              className="px-6 py-3 bg-emerald-600 hover:from-emerald-700 hover:to-teal-600 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg dark:shadow-emerald-700/20 inline-flex items-center"
            >
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </motion.button>
          ) : (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-emerald-600 hover:from-emerald-700 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg dark:shadow-emerald-700/20 inline-flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Event...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Create Event
                </>
              )}
            </motion.button>
          )}
        </div>

        
        <div className="mt-8 text-center">
  <p className="text-xs text-gray-500 dark:text-gray-400">
    Keyboard shortcuts: 
    <span className={`px-1.5 py-0.5 mx-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300 font-mono ${
      keyFeedback.left ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : ''
    } transition-colors`}>←</span> 
    Previous step, 
    <span className={`px-1.5 py-0.5 mx-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300 font-mono ${
      keyFeedback.right ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : ''
    } transition-colors`}>→</span> 
    Next step
  </p>
</div>
      </div>
    </div>
  );
};


export default EventCreationForm;

