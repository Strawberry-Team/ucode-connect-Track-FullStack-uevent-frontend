import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Types for tabs
type TabType = 'profile' | 'tickets' | 'subscriptions' | 'company';

// Constants for empty states
const EMPTY_TICKETS_MESSAGE = "You don't have any purchased tickets yet. Start exploring available events!";
const EMPTY_SUBSCRIPTIONS_MESSAGE = "You're not subscribed to any organizers yet. Subscribe to organizers you're interested in to stay updated on their new events!";
const EMPTY_COMPANY_MESSAGE = "You don't have a company yet. Create one to start organizing your own events!";

export default function Profile() {
  const { user, loading, error, updateUserProfile, uploadUserAvatar } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [hasCompany, setHasCompany] = useState(false);
  const [company, setCompany] = useState({
    name: '',
    email: '',
    location: ''
  });
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    email: '',
    location: ''
  });
  const [tickets, setTickets] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Initialize profile data on load
  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
      return;
    }

    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      });
      
      // Here you would add API requests to get data about tickets, subscriptions, and company
      // Using empty arrays for simplification
      
      // Check if user has a company
      // This would be replaced with a real API request
      setHasCompany(false);
    }
  }, [user, loading, router]);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      await updateUserProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });
      
      toast.success('Profile successfully updated');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Unable to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle avatar button click
  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload file
      handleAvatarUpload(file);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const userId = user?.id;
      if(userId) {
        await uploadUserAvatar(formData, userId);
      }
      
      toast.success('Avatar successfully updated');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Unable to upload avatar. Please try again.');
      setAvatarPreview(null); // Reset preview on error
    } finally {
      setIsUploading(false);
    }
  };

  // Handle company creation
  const handleCreateCompany = async () => {
    try {
      setIsSaving(true);
      // Here would be the API request to create a company
      
      // Simulating successful response
      setTimeout(() => {
        setHasCompany(true);
        setCompany({
          name: newCompany.name,
          email: newCompany.email,
          location: newCompany.location
        });
        
        setIsCreatingCompany(false);
        toast.success('Company successfully created');
        setIsSaving(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Unable to create company. Please try again.');
      setIsSaving(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    try {
      setIsSaving(true);
      
      // Validation
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('New passwords do not match');
        setIsSaving(false);
        return;
      }
      
      // Here would be the API request to change password
      
      // Simulating successful response
      setTimeout(() => {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setShowPasswordSection(false);
        toast.success('Password successfully changed');
        setIsSaving(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Unable to change password. Please check your current password.');
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-black">
        <div className="w-12 h-12 relative">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-black/5 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-l-black border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile | UEvent</title>
        <meta name="description" content="Manage your UEvent profile" />
      </Head>

      <ToastContainer 
        position="bottom-right" 
        autoClose={3000} 
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="min-h-screen bg-white dark:bg-black">
        <div className="mx-auto h-screen flex flex-col">
          {/* Main content container */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar */}
            <div className="w-72 border-r bg-white dark:bg-black hidden md:block shadow-sm dark:shadow-none flex-shrink-0">
              <div className="flex flex-col h-full">
                {/* User info section */}
                <div className="p-6 flex flex-col items-center">
                  <div className="relative group mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-black border border-gray-200 dark:border-gray-800 transition-all duration-300 group-hover:shadow-lg dark:shadow-none">
                      {avatarPreview || user?.profilePictureUrl ? (
                        <img 
                          src={avatarPreview || user?.profilePictureUrl} 
                          alt={`${user?.firstName} ${user?.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-black/5 text-black/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={handleAvatarButtonClick}
                      disabled={isUploading}
                      className="absolute -bottom-2 -right-2 bg-black text-white rounded-full p-2 shadow-lg dark:shadow-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    >
                      {isUploading ? (
                        <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
                          <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-9a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <h2 className="text-xl font-medium">{user?.firstName} {user?.lastName}</h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
                </div>
                
                {/* Navigation */}
                <nav className="flex-1 p-4">
                  <div className="space-y-2">
                    <button
                      onClick={() => handleTabChange('profile')}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === 'profile'
                          ? 'bg-black text-white'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 dark:bg-black'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Profile
                    </button>
                    <button
                      onClick={() => handleTabChange('tickets')}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === 'tickets'
                          ? 'bg-black text-white'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 dark:bg-black'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                      </svg>
                      My Orders
                    </button>
                    <button
                      onClick={() => handleTabChange('subscriptions')}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === 'subscriptions'
                          ? 'bg-black text-white'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 dark:bg-black'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                      Subscriptions
                    </button>
                    <button
                      onClick={() => handleTabChange('company')}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === 'company'
                          ? 'bg-black text-white'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 dark:bg-black'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                      Company
                    </button>
                  </div>
                </nav>
                
                {/* Logout button */}
                <div className="p-4 border-t">
                  <button
                    onClick={() => {
                      // Here would be the logout function
                    }}
                    className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 dark:bg-black rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </div>
            
            {/* Mobile navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-black border-t px-2 py-3 md:hidden">
              <div className="flex justify-around">
                <button
                  onClick={() => handleTabChange('profile')}
                  className={`flex flex-col items-center px-2 py-1 ${activeTab === 'profile' ? 'text-black' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span className="text-xs mt-1">Profile</span>
                </button>
                <button
                  onClick={() => handleTabChange('tickets')}
                  className={`flex flex-col items-center px-2 py-1 ${activeTab === 'tickets' ? 'text-black' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                  <span className="text-xs mt-1">Tickets</span>
                </button>
                <button
                  onClick={() => handleTabChange('subscriptions')}
                  className={`flex flex-col items-center px-2 py-1 ${activeTab === 'subscriptions' ? 'text-black' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  <span className="text-xs mt-1">Subs</span>
                </button>
                <button
                  onClick={() => handleTabChange('company')}
                  className={`flex flex-col items-center px-2 py-1 ${activeTab === 'company' ? 'text-black' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <span className="text-xs mt-1">Company</span>
                </button>
              </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 overflow-auto p-0 md:p-8">
              {/* Mobile header */}
              <div className="md:hidden bg-white dark:bg-black py-4 px-6 border-b flex items-center justify-between sticky top-0 z-10">
                <h1 className="text-xl font-medium">{
                  activeTab === 'profile' ? 'Profile' :
                  activeTab === 'tickets' ? 'My Tickets' :
                  activeTab === 'subscriptions' ? 'Subscriptions' :
                  'Company'
                }</h1>
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  {user?.profilePictureUrl ? (
                    <img 
                      src={user.profilePictureUrl} 
                      alt={`${user?.firstName} ${user?.lastName}`} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-black">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content sections */}
              <div className="max-w-4xl mx-auto">
                {/* Desktop section header */}
                <div className="hidden md:flex md:items-center md:justify-between mb-8">
                  <h1 className="text-2xl font-semibold">{
                    activeTab === 'profile' ? 'Profile' :
                    activeTab === 'tickets' ? 'My Tickets' :
                    activeTab === 'subscriptions' ? 'Subscriptions' :
                    'Company'
                  }</h1>
                  {activeTab === 'profile' && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 bg-black hover:bg-gray-900 dark:bg-black text-white text-sm font-medium rounded-lg transition-colors duration-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                      Edit Profile
                    </button>
                  )}
                </div>
                
                {/* Profile tab */}
                {activeTab === 'profile' && (
                  <div className="md:bg-white dark:bg-black md:rounded-lg md:shadow-sm dark:shadow-none md:border">
                    {/* Mobile edit button */}
                    <div className="md:hidden px-6 py-4 border-b flex justify-end">
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center px-4 py-2 bg-black hover:bg-gray-900 dark:bg-black text-white text-sm font-medium rounded-lg transition-colors duration-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                          </svg>
                          Edit Profile
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border text-gray-600 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 dark:bg-black dark:bg-black text-sm font-medium rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveProfile}
                            disabled={isSaving}
                            className="inline-flex items-center px-4 py-2 bg-black hover:bg-gray-900 dark:bg-black text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            {isSaving ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                              </>
                            ) : 'Save Changes'}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 md:p-8">
                      {isEditing ? (
                        <div className="space-y-6">
                          <div className="grid gap-6 grid-cols-2">
                            <div>
                              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                First Name
                              </label>
                              <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={profileData.firstName}
                                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                                placeholder="Enter your first name"
                              />
                            </div>
                            <div>
                              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                Last Name
                              </label>
                              <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={profileData.lastName}
                                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                                placeholder="Enter your last name"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Email Address
                            </label>
                            <div className="px-3 py-2 bg-gray-50 dark:bg-black dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
                              <p className="text-gray-700 dark:text-gray-200">{profileData.email}</p>
                            </div>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                          </div>
                          
                          {/* Desktop save/cancel buttons */}
                          <div className="hidden md:flex md:justify-end md:space-x-3 md:pt-4">
                            <button
                              onClick={() => setIsEditing(false)}
                              className="px-4 py-2 border text-gray-600 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 dark:bg-black dark:bg-black text-sm font-medium rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveProfile}
                              disabled={isSaving}
                              className="inline-flex items-center px-4 py-2 bg-black hover:bg-gray-900 dark:bg-black text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              {isSaving ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                  </svg>
                                  Save Changes
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                              <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  First Name
                                </label>
                                <div className="bg-gray-50 dark:bg-black dark:bg-black px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800">
                                  <p className="text-gray-800 dark:text-white">{profileData.firstName || 'Not specified'}</p>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Last Name
                                </label>
                                <div className="bg-gray-50 dark:bg-black dark:bg-black px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800">
                                  <p className="text-gray-800 dark:text-white">{profileData.lastName || 'Not specified'}</p>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Email Address
                                </label>
                                <div className="bg-gray-50 dark:bg-black dark:bg-black px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800">
                                  <p className="text-gray-800 dark:text-white">{profileData.email}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Password section */}
                          <div className="mt-12">
                            <div className="flex justify-between items-center mb-6">
                              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Password Settings</h2>
                              {!showPasswordSection ? (
                                <button
                                  onClick={() => setShowPasswordSection(true)}
                                  className="text-sm font-medium text-black hover:text-gray-700 dark:text-gray-200 transition-colors"
                                >
                                  Change Password
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setShowPasswordSection(false);
                                    setPasswordData({
                                      currentPassword: '',
                                      newPassword: '',
                                      confirmPassword: ''
                                    });
                                  }}
                                  className="text-sm font-medium text-gray-600 dark:text-gray-200 hover:text-gray-500 dark:text-gray-400 transition-colors"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>

                            {showPasswordSection && (
                              <div className="space-y-4 p-4 bg-gray-50 dark:bg-black dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
                                <div>
                                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Current Password
                                  </label>
                                  <input
                                    type="password"
                                    id="currentPassword"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                                    placeholder="Enter your current password"
                                  />
                                </div>
                                <div>
                                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    New Password
                                  </label>
                                  <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                                    placeholder="Enter your new password"
                                  />
                                </div>
                                <div>
                                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                                    Confirm New Password
                                  </label>
                                  <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                                    placeholder="Confirm your new password"
                                  />
                                </div>
                                <div className="pt-4">
                                  <button
                                    onClick={handleChangePassword}
                                    disabled={isSaving}
                                    className="inline-flex items-center px-4 py-2 bg-black hover:bg-gray-900 dark:bg-black text-white text-sm font-medium rounded-lg transition-colors"
                                  >
                                    {isSaving ? (
                                      <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Updating...
                                      </>
                                    ) : (
                                      <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                          <path d="M7 11V7a5 5 0 0110 0v4"></path>
                                        </svg>
                                        Update Password
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Tickets tab */}
                {activeTab === 'tickets' && (
                  <div className="md:bg-white dark:bg-black md:rounded-lg md:shadow-sm dark:shadow-none md:border p-6 md:p-8">
                    {tickets.length > 0 ? (
                      <div className="space-y-4">
                        {/* Here would be the code for displaying tickets when they exist */}
                        <p>List of your tickets</p>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                        </svg>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Tickets Yet</h3>
                        <p className="text-gray-600 dark:text-gray-200 max-w-md mx-auto mb-8">{EMPTY_TICKETS_MESSAGE}</p>
                        <Link href="/events" className="inline-flex items-center px-5 py-3 bg-black hover:bg-gray-900 dark:bg-black text-white font-medium rounded-lg transition-colors shadow-sm dark:shadow-none">
                          Explore Events
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Subscriptions tab */}
                {activeTab === 'subscriptions' && (
                  <div className="md:bg-white dark:bg-black md:rounded-lg md:shadow-sm dark:shadow-none md:border p-6 md:p-8">
                    {subscriptions.length > 0 ? (
                      <div className="space-y-4">
                        {/* Here would be the code for displaying subscriptions when they exist */}
                        <p>List of your subscriptions</p>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Subscriptions Yet</h3>
                        <p className="text-gray-600 dark:text-gray-200 max-w-md mx-auto mb-8">{EMPTY_SUBSCRIPTIONS_MESSAGE}</p>
                        <Link href="/organizers" className="inline-flex items-center px-5 py-3 bg-black hover:bg-gray-900 dark:bg-black text-white font-medium rounded-lg transition-colors shadow-sm dark:shadow-none">
                          Find Organizers
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Company tab */}
                {activeTab === 'company' && (
                  <div className="md:bg-white dark:bg-black md:rounded-lg md:shadow-sm dark:shadow-none md:border p-6 md:p-8">
                    {hasCompany ? (
                      <div className="space-y-8">
                        <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-800">
                          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-6">Company Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Company Name</p>
                              <p className="text-lg text-gray-900 dark:text-white">{company.name}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</p>
                              <p className="text-lg text-gray-900 dark:text-white">{company.email}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Location</p>
                              <p className="text-lg text-gray-900 dark:text-white">{company.location}</p>
                            </div>
                          </div>
                          <div className="mt-8 flex flex-wrap gap-3">
                            <Link href="/events/create" className="inline-flex items-center px-5 py-3 bg-black hover:bg-gray-900 dark:bg-black text-white font-medium rounded-lg transition-colors shadow-sm dark:shadow-none">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                              </svg>
                              Create Event
                            </Link>
                            <button className="inline-flex items-center px-5 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 dark:bg-black dark:bg-black font-medium rounded-lg transition-colors shadow-sm dark:shadow-none">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                              </svg>
                              Edit Company
                            </button>
                          </div>
                        </div>
                        
                        <div className="px-6 py-8 rounded-lg border border-gray-200 dark:border-gray-800">
                          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-6">My Events</h3>
                          <div className="text-center py-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <p className="text-gray-600 dark:text-gray-200 mb-6">You don't have any created events yet</p>
                            <Link href="/events/create" className="inline-flex items-center px-5 py-3 bg-black hover:bg-gray-900 dark:bg-black text-white font-medium rounded-lg transition-colors shadow-sm dark:shadow-none">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                                <line x1="8" y1="12" x2="16" y2="12"></line>
                              </svg>
                              Create Your First Event
                            </Link>
                          </div>
                        </div>
                      </div>
                    ) : isCreatingCompany ? (
                      <div>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">Create Your Company</h3>
                        <p className="text-gray-600 dark:text-gray-200 mb-6">
                          Create a company to be able to organize your own events
                        </p>
                        
                        <div className="space-y-6 max-w-2xl">
                          <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Company Name *
                            </label>
                            <input
                              type="text"
                              id="companyName"
                              name="companyName"
                              value={newCompany.name}
                              onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                              required
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                              placeholder="Enter company name"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Company Email *
                            </label>
                            <input
                              type="email"
                              id="companyEmail"
                              name="companyEmail"
                              value={newCompany.email}
                              onChange={(e) => setNewCompany({...newCompany, email: e.target.value})}
                              required
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                              placeholder="Enter company email"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="companyLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                              Company Location *
                            </label>
                            <input
                              type="text"
                              id="companyLocation"
                              name="companyLocation"
                              value={newCompany.location}
                              onChange={(e) => setNewCompany({...newCompany, location: e.target.value})}
                              required
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-black focus:border-black transition-colors"
                              placeholder="Enter company location"
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setIsCreatingCompany(false)}
                              className="px-5 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 dark:bg-black dark:bg-black font-medium rounded-lg transition-colors shadow-sm dark:shadow-none"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleCreateCompany}
                              disabled={isSaving}
                              className="inline-flex items-center px-5 py-3 bg-black hover:bg-gray-900 dark:bg-black text-white font-medium rounded-lg transition-colors shadow-sm dark:shadow-none"
                            >
                              {isSaving ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 5v14M5 12h14" />
                                  </svg>
                                  Create Company
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Company Yet</h3>
                        <p className="text-gray-600 dark:text-gray-200 max-w-md mx-auto mb-8">{EMPTY_COMPANY_MESSAGE}</p>
                        <button 
                          onClick={() => setIsCreatingCompany(true)}
                          className="inline-flex items-center px-5 py-3 bg-black hover:bg-gray-900 dark:bg-black text-white font-medium rounded-lg transition-colors shadow-sm dark:shadow-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          Create Company
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}