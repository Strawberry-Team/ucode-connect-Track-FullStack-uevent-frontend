import { useCompany } from '../contexts/CompanyContext';
import { useState, useRef, useEffect } from 'react';
import { useEvents } from '../contexts/EventContext';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { z } from 'zod';
import { CompanyNewsSection } from './CompanyNewsSection';
import { CompactEventCard } from './CompactEventCard';
import { companyService } from '../services/companyService'; 
const CompanySchema = z.object({
  title: z
    .string()
    .min(1, { message: "Company name is required" })
    .max(100, { message: "Company name is too long (max 100 characters)" }),
  
  email: z
    .string()
    .min(1, { message: "Company email is required" })
    .email({ message: "Invalid email format" }),
  
  description: z
    .string()
    .min(1, { message: "Description must be at least 1 character" })
    .max(1000, { message: "Description is too long (max 1000 characters)" }),
});

type CompanyInput = z.infer<typeof CompanySchema>;

export const CompanySection = () => {
  const { company, isLoading, createCompany, updateCompany, uploadLogo } = useCompany();
  const { resetViewingSpecificCompany } = useCompany();
  const { events, isLoading: eventsLoading, getEvents } = useEvents();
  const [companyEvents, setCompanyEvents] = useState<any[]>([]);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [newCompany, setNewCompany] = useState({
    title: '',
    email: '',
    description: ''
  });
  
  const [editCompany, setEditCompany] = useState({
    title: '',
    email: '',
    description: ''
  });
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const newLogoInputRef = useRef<HTMLInputElement>(null);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null);
  
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);

  const handleStartEdit = () => {
    if (company) {
      setEditCompany({
        title: company.title || '',
        email: company.email || '',
        description: company.description || ''
      });
      setIsEditingCompany(true);
    }
  };
  useEffect(() => {
    resetViewingSpecificCompany();
  }, []);
  useEffect(() => {
    if (company) {
      setEditCompany({
        title: company.title || '',
        email: company.email || '',
        description: company.description || ''
      });
    }
  }, [company]);

  useEffect(() => {
    if (company) {
      console.log("Current company data:", company);
    }
  }, [company]);

 useEffect(() => {
  const fetchCompanyEvents = async () => {
    if (company?.id) {
      try {
        setIsLoadingEvents(true);
        const eventsData = await companyService.getCompanyEvents(company.id.toString());
        setCompanyEvents(eventsData);
        console.log('Company events:', eventsData);
      } catch (error) {
        console.error('Error fetching company events:', error);
        toast.error('Failed to load company events');
      } finally {
        setIsLoadingEvents(false);
      }
    } else {
      setCompanyEvents([]);
    }
  };
  
  fetchCompanyEvents();
}, [company?.id]);

useEffect(() => {
  if (company?.id && events.length > 0) {
    const filteredEvents = events.filter(event => event.companyId === company.id);
    setCompanyEvents(filteredEvents);
    console.log('Company events:', filteredEvents);
  } else {
    setCompanyEvents([]);
  }
}, [company?.id, events]);


  const validateLogoFile = (file: File): boolean => {

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should not exceed 2MB');
      return false;
    }
    

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, GIF, and SVG files are allowed');
      return false;
    }
    
    return true;
  };

  const handleCreateCompany = async () => {
    try {
      const validationResult = CompanySchema.safeParse(newCompany);
      
      if (!validationResult.success) {
        validationResult.error.errors.forEach(error => {
          toast.error(error.message);
        });
        return;
      }
      
      setIsSaving(true);
      
      const result = await createCompany(newCompany);
      
      if (result.success && result.companyId) {
        if (newLogoFile) {
          try {
            setIsUploading(true);
            const logoResult = await uploadLogo(newLogoFile, result.companyId);
            
            if (logoResult.success) {
              toast.success('Company created with logo successfully');
              
              if (logoResult.logoName && result.updateCompanyState) {
                result.updateCompanyState(prevCompany => {
                  if (prevCompany) {
                    return {
                      ...prevCompany,
                      logoName: logoResult.logoName
                    };
                  }
                  return result.company ? {
                    ...result.company,
                    logoName: logoResult.logoName
                  } : null;
                });
              }
            } else {
              console.error('Error uploading company logo:', logoResult.message);
              toast.warning('Company created, but logo upload failed');
            }
          } catch (logoError) {
            console.error('Error uploading company logo:', logoError);
            toast.warning('Company created, but logo upload failed');
          } finally {
            setIsUploading(false);
          }
        } else {
          toast.success('Company created successfully');
        }
        
        setIsCreatingCompany(false);
        setNewCompany({
          title: '',
          email: '',
          description: ''
        });
        setNewLogoFile(null);
        setNewLogoPreview(null);
        
        if (result.refreshCompanyData) {
          await result.refreshCompanyData();
        }
      } else {
        toast.error(result.message || 'Failed to create company');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCompany = async () => {
    try {
      const validationResult = CompanySchema.safeParse(editCompany);
      
      if (!validationResult.success) {
        validationResult.error.errors.forEach(error => {
          toast.error(error.message);
        });
        return;
      }
      
      setIsSaving(true);
      const result = await updateCompany(editCompany);
      
      if (result.success) {
        setIsEditingCompany(false);
        toast.success('Company updated successfully');
      } else {
        toast.error(result.message || 'Failed to update company');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Failed to update company');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoButtonClick = () => {
    logoInputRef.current?.click();
  };

  const handleNewLogoButtonClick = () => {
    newLogoInputRef.current?.click();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateLogoFile(file)) {
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      handleLogoUpload(file);
    }
  };

  const handleNewLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateLogoFile(file)) {
        e.target.value = ''; 
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setNewLogoFile(file);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!company?.id) {
      console.error('Cannot upload logo: company ID not found');
      setLogoPreview(null);
      toast.error('Cannot upload logo: Company ID not found');
      return;
    }

    try {
      setIsUploading(true);
      const result = await uploadLogo(file, company.id);
      
      if (result.success) {
        toast.success('Logo uploaded successfully');
      } else {
        setLogoPreview(null);
        toast.error(result.message || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setLogoPreview(null);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingCompany(false);
    if (company) {
      setEditCompany({
        title: company.title || '',
        email: company.email || '',
        description: company.description || ''
      });
    }
    setLogoPreview(null);
  };

  const getImageUrl = (path: string | undefined) => {
    if (!path) return null;
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}/uploads/company-logos/${path.startsWith('/') ? path.substring(1) : path}`;
  };

  const getImageUrlEventPosters = (path: string | undefined) => {
    if (!path) return null;
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}/uploads/event-posters/${path.startsWith('/') ? path.substring(1) : path}`;
  };

  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="p-8 flex flex-col items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-emerald-600 font-medium">Loading company information...</p>
        </div>
      </div>
    );
  }
  const hasValidCompany = () => {
    console.log("Checking company validity:", company);
    

    if (!company) {
      console.log("Company is falsy");
      return false;
    }
    
    if (company.length === 0) {
      console.log("Company array is empty");
      return false;
    }
    
    console.log("Company is valid");
    return true;
  };
  if (hasValidCompany()) {
    console.log("Rendering company:", company);
    const logoUrl = getImageUrl(company?.logoName);
    
    return (
      <div className="space-y-8">
        <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center px-6 py-5 bg-gray-50 dark:bg-black border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Company Information</h2>
            {!isEditingCompany ? (
              <button
                onClick={handleStartEdit}
                className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
                Edit
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateCompany}
                  disabled={isSaving}
                  className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-0.5 mr-1.5 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      Save
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          
          {isEditingCompany ? (
            // Edit company form
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    value={editCompany.title}
                    onChange={(e) => setEditCompany({...editCompany, title: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-900 dark:text-white"
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                    Company Email *
                  </label>
                  <input
                    type="email"
                    id="companyEmail"
                    name="companyEmail"
                    value={editCompany.email}
                    onChange={(e) => setEditCompany({...editCompany, email: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-900 dark:text-white"
                    placeholder="Enter company email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="companyLogo" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                    Company Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {(logoPreview || logoUrl) ? (
                        <img 
                          src={logoPreview || logoUrl || ''} 
                          alt={company?.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"></path>
                            <path d="M1 21h22"></path>
                            <path d="M7 9h10"></path>
                            <path d="M7 13h10"></path>
                            <path d="M7 17h10"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleLogoButtonClick}
                      disabled={isUploading}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-medium rounded-lg transition-colors"
                    >
                      {isUploading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </span>
                      ) : 'Change Logo'}
                    </button>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Recommended: Square image, up to 2MB.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                    Company Description *
                  </label>
                  <textarea
                    id="companyDescription"
                    name="companyDescription"
                    value={editCompany.description}
                    onChange={(e) => setEditCompany({...editCompany, description: e.target.value})}
                    rows={4}
                    
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-900 dark:text-white"
                    placeholder="Enter company description"
                  />
                </div>
              </div>
            </div>
          ) : (
            // View company info
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt={company?.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"></path>
                          <path d="M1 21h22"></path>
                          <path d="M7 9h10"></path>
                          <path d="M7 13h10"></path>
                          <path d="M7 17h10"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                  <Link href={`/companies/${company?.id}`}>
  <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
    {company?.title}
  </h3>
</Link>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">{company?.description || 'No description provided'}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      <span className="text-gray-700 dark:text-gray-200">{company?.email}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      <span className="text-gray-700 dark:text-gray-200">
                        Created: {new Date(company?.createdAt || '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Company News Section */}
        <CompanyNewsSection />
        
        <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
  <div className="px-6 py-5 bg-gray-50 dark:bg-black border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Events</h2>
    <Link href="/events/create" className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
      Create Event
    </Link>
  </div>
  
  {eventsLoading ? (
    <div className="p-8 flex flex-col items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      <p className="mt-4 text-emerald-600 font-medium">Loading events...</p>
    </div>
  ) : companyEvents.length > 0 ? (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {companyEvents.map(event => (
  <CompactEventCard 
    key={event.id} 
    event={event} 
    getImageUrlEventPosters={getImageUrlEventPosters} 
  />
))}
      </div>
    </div>
  ) : (
    <div className="p-8 flex flex-col items-center justify-center">
      <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Events Yet</h3>
      <p className="text-gray-600 dark:text-gray-200 text-center max-w-md mb-6">You don't have any created events yet. Start organizing your own event today!</p>
      
      <Link href="/events/create" className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm dark:shadow-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        Create Your First Event
      </Link>
    </div>
  )}
</div>
      </div>
    );
  }

  if (isCreatingCompany) {
    return (
      <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
        <div className="px-6 py-5 bg-gray-50 dark:bg-black border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Your Company</h2>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-200 mb-8">
            Create a company to be able to organize your own events and manage tickets
          </p>
          
          <div className="space-y-6 max-w-2xl">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Company Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"></path>
                    <path d="M1 21h22"></path>
                    <path d="M7 9h10"></path>
                    <path d="M7 13h10"></path>
                    <path d="M7 17h10"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={newCompany.title}
                  onChange={(e) => setNewCompany({...newCompany, title: e.target.value})}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-900 dark:text-white"
                  placeholder="Enter company name"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Company Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <input
                  type="email"
                  id="companyEmail"
                  name="companyEmail"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-900 dark:text-white"
                  placeholder="Enter company email"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="newCompanyLogo" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Company Logo
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                  {newLogoPreview ? (
                    <img 
                      src={newLogoPreview} 
                      alt="Company logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"></path>
                        <path d="M1 21h22"></path>
                        <path d="M7 9h10"></path>
                        <path d="M7 13h10"></path>
                        <path d="M7 17h10"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleNewLogoButtonClick}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-medium rounded-lg transition-colors"
                >
                  {newLogoPreview ? 'Change Logo' : 'Upload Logo'}
                </button>
                <input
                  ref={newLogoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleNewLogoChange}
                  id="newCompanyLogo"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Recommended: Square image, at least 256x256 pixels. Max 2MB.
              </p>
            </div>

            <div>
              <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Company Description *
              </label>
              <textarea
                id="companyDescription"
                name="companyDescription"
                value={newCompany.description}
                onChange={(e) => setNewCompany({...newCompany, description: e.target.value})}
                rows={4}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-900 dark:text-white"
                placeholder="Tell us about your company"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCompany(false);
                  setNewLogoPreview(null);
                  setNewLogoFile(null);
                  setNewCompany({
                    title: '',
                    email: '',
                    description: ''
                  });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 font-medium rounded-lg transition-colors shadow-sm dark:shadow-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCompany}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-sm dark:shadow-none"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Create Company
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
      <div className="p-8 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Company Yet</h3>
        <p className="text-gray-600 dark:text-gray-200 max-w-md mx-auto mb-8">You don't have a company yet. Create one to start organizing your own events!</p>
        
        <div className="space-y-5">
          <button 
            onClick={() => setIsCreatingCompany(true)}
            className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-md dark:shadow-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create Company
          </button>
          
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            <h4 className="font-medium mb-2">With a company account, you can:</h4>
            <ul className="space-y-2">
              <li className="flex items-center">
                <svg className="h-4 w-4 mr-2 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Create and manage events
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 mr-2 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Sell tickets online
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 mr-2 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Access analytics and reports
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 mr-2 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Publish company news and updates
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

