import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ThemeSwitch from '../components/ThemeSwitch';
import { useTheme } from '../contexts/ThemeContext';
import { CompanySection } from '../components/CompanySection';
import SubscriptionsSection from '../components/SubscriptionsSection';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import MyTicketsSection from '../components/MyTicketsSection';
// Types for tabs
type TabType = 'profile' | 'tickets' | 'subscriptions' | 'company';

// Constants for empty states
const EMPTY_TICKETS_MESSAGE = "You don't have any purchased tickets yet. Start exploring available events!";
const EMPTY_SUBSCRIPTIONS_MESSAGE = "You're not subscribed to any organizers yet. Subscribe to organizers you're interested in to stay updated on their new events!";
const EMPTY_COMPANY_MESSAGE = "You don't have a company yet. Create one to start organizing your own events!";

const ProfileContent = ({ user }) => {
  const { error, updateUserProfile, uploadUserAvatar, updateUserPassword } = useAuth();
  const { isDarkMode } = useTheme(); 
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logout} = useAuth();
  // States
  const [activeSection, setActiveSection] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Initialize profile data on load
  useEffect(() => {
    if (!user) {
      //router.push('/login');
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
  }, [user]);

  // Handle section change
  const handleSectionChange = (section: TabType) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false); // Close mobile menu when changing sections
  };

  // Handle profile save
  // Обновленный метод handleSaveProfile в компоненте Profile
const handleSaveProfile = async () => {
  try {
    setIsSaving(true);
    const response = await updateUserProfile({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
    });
    
    if (response.error) {
      // Если вернулась ошибка, показываем сообщение в toast
      toast.error(response.message, {
        position: "bottom-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else {
      // Если успех, показываем сообщение об успехе
      toast.success(response.message || 'Profile successfully updated', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setIsEditing(false);
    }
  } catch (error) {
    // На случай непредвиденной ошибки
    console.error('Error updating profile:', error);
    toast.error('Unable to update profile. Please try again.', {
      position: "bottom-right",
      autoClose: 4000,
    });
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
 // Обновленный метод handleAvatarUpload в компоненте Profile
const handleAvatarUpload = async (file: File) => {
  try {
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const userId = user?.id;
    if(userId) {
      const response = await uploadUserAvatar(formData, userId);
      
      if (response.error) {
        // Если вернулась ошибка, показываем сообщение в toast
        toast.error(response.message, {
          position: "bottom-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setAvatarPreview(null); // Сбрасываем превью при ошибке
      } else {
        // Если успех, показываем сообщение об успехе
        toast.success('Avatar successfully updated', {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } else {
      toast.error('User not authenticated', {
        position: "bottom-right",
        autoClose: 4000,
      });
      setAvatarPreview(null);
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
    toast.error('Unable to upload avatar. Please try again.', {
      position: "bottom-right",
      autoClose: 4000,
    });
    setAvatarPreview(null); // Сбрасываем превью при ошибке
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
  // Handle password change
// Handle password change
// Обновленный метод handleChangePassword в компоненте Profile
const handleChangePassword = async () => {
  try {
    setIsSaving(true);
    
    // Валидация
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match', {
        position: "bottom-right",
        autoClose: 4000,
      });
      setIsSaving(false);
      return;
    }
    
    if (!user?.id) {
      toast.error('User not authenticated', {
        position: "bottom-right",
        autoClose: 4000,
      });
      setIsSaving(false);
      return;
    }
    
    // Отправка запроса на изменение пароля через AuthContext
    const response = await updateUserPassword({
      oldPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
    
    if (response.error) {
      // Показываем ошибку от сервера
      toast.error(response.message, {
        position: "bottom-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else {
      // Очистка формы после успешного изменения
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setShowPasswordSection(false);
      toast.success('Password successfully changed', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  } catch (error) {
    // Более общая обработка ошибок
    console.error('Unexpected error:', error);
    toast.error('An unexpected error occurred. Please try again later.', {
      position: "bottom-right",
      autoClose: 4000,
    });
  } finally {
    setIsSaving(false);
  }
};

  // Handle logout
  const handleLogout = async () => {
    await logout();

    router.push('/login');
  };

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black dark:bg-black">
  //       <div className="flex flex-col items-center">
  //         <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
  //         <p className="mt-4 text-emerald-600 font-medium">Loading your profile...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      <Head>
        <title>Your Profile | TripUp</title>
        <meta name="description" content="Manage your TripUp profile" />
      </Head>

      <ToastContainer position="bottom-right" autoClose={3000} />

      {/* Removed the white gap by making the flex container fill the entire screen without gaps */}
      <div className="min-h-screen bg-white dark:bg-black flex overflow-hidden">
        {/* Side Navigation - Desktop - Removed border/margin causing white line */}
        <div className="hidden md:flex md:flex-col md:w-64 bg-gradient-to-b from-emerald-600 to-emerald-800 text-white flex-shrink-0">
          <div className="p-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white dark:bg-black rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 text-emerald-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-white">TripUp</span>
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="px-6 py-4 border-b border-emerald-500">
              <div className="flex flex-col items-center">
                <div className="relative group mb-3">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-emerald-400 border-4 border-white/20">
                    {avatarPreview || user?.profilePictureUrl ? (
                      <img 
                        src={avatarPreview || user?.profilePictureUrl} 
                        alt={`${user?.firstName} ${user?.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-300 text-emerald-700">
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
                    className="absolute bottom-0 right-0 bg-white dark:bg-black text-emerald-600 hover:text-emerald-700 rounded-full p-1.5 shadow-lg dark:shadow-none transition-all duration-200 transform group-hover:scale-110"
                  >
                    {isUploading ? (
                      <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
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
                <h2 className="text-lg font-bold">{user?.firstName} {user?.lastName}</h2>
                <p className="text-sm text-emerald-200 mt-1">{user?.email}</p>
              </div>
            </div>

            <nav className="flex-1 px-2 py-6">
              <div className="space-y-2">
                <button
                  onClick={() => handleSectionChange('profile')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                    activeSection === 'profile'
                      ? 'bg-white dark:bg-black text-emerald-700 shadow-md dark:shadow-none'
                      : 'hover:bg-emerald-700/50 text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Profile
                </button>
                
                <button
                  onClick={() => handleSectionChange('tickets')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                    activeSection === 'tickets'
                      ? 'bg-white dark:bg-black text-emerald-700 shadow-md dark:shadow-none'
                      : 'hover:bg-emerald-700/50 text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                  My Orders
                </button>
                
                <button
                  onClick={() => handleSectionChange('subscriptions')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                    activeSection === 'subscriptions'
                      ? 'bg-white dark:bg-black text-emerald-700 shadow-md dark:shadow-none'
                      : 'hover:bg-emerald-700/50 text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  Subscriptions
                </button>
                
                <button
                  onClick={() => handleSectionChange('company')}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                    activeSection === 'company'
                      ? 'bg-white dark:bg-black text-emerald-700 shadow-md dark:shadow-none'
                      : 'hover:bg-emerald-700/50 text-white'
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
            
            <div className="p-6 mt-auto">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2 border border-white/30 rounded-lg text-white hover:bg-emerald-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-black z-10 shadow-sm dark:shadow-none">
          <div className="flex justify-between items-center p-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-gray-800 dark:text-white">TripUp</span>
            </Link>
            
            <div className="flex items-center">
              <div className="mr-2 text-right">
                <h2 className="text-sm font-semibold">{user?.firstName} {user?.lastName}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activeSection}</p>
              </div>
              
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1 rounded-md text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 dark:bg-black"
              >
                {isMobileMenuOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
              <div className="p-4 flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/40">
                    {avatarPreview || user?.profilePictureUrl ? (
                      <img 
                        src={avatarPreview || user?.profilePictureUrl} 
                        alt={`${user?.firstName} ${user?.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h2 className="font-medium">{user?.firstName} {user?.lastName}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
              
              <nav className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSectionChange('profile')}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm transition-all ${
                      activeSection === 'profile'
                        ? 'bg-emerald-600 text-white shadow-sm dark:shadow-none'
                        : 'bg-gray-100 dark:bg-black text-gray-700 dark:text-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Profile
                  </button>
                  
                  <button
                    onClick={() => handleSectionChange('tickets')}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm transition-all ${
                      activeSection === 'tickets'
                        ? 'bg-emerald-600 text-white shadow-sm dark:shadow-none'
                        : 'bg-gray-100 dark:bg-black text-gray-700 dark:text-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    Tickets
                  </button>
                  
                  <button
                    onClick={() => handleSectionChange('subscriptions')}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm transition-all ${
                      activeSection === 'subscriptions'
                        ? 'bg-emerald-600 text-white shadow-sm dark:shadow-none'
                        : 'bg-gray-100 dark:bg-black text-gray-700 dark:text-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    Subscriptions
                  </button>
                  
                  <button
                    onClick={() => handleSectionChange('company')}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm transition-all ${
                      activeSection === 'company'
                        ? 'bg-emerald-600 text-white shadow-sm dark:shadow-none'
                        : 'bg-gray-100 dark:bg-black text-gray-700 dark:text-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    Company
                  </button>
                </div>
                {/* Добавляем переключатель темы */}
      <div className="mt-4 mb-4">
        <ThemeSwitch compact />
      </div>
      <hr className="my-4 border-gray-200 dark:border-gray-800 dark:border-gray-800" />
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-black hover:bg-gray-200 rounded-lg text-gray-700 dark:text-gray-200 text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Sign Out
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* Main Content - Removed margin/padding that was causing the gap */}
        <div className="flex-1 md:pl-0 bg-gray-50 dark:bg-black dark:bg-black">
          <div className="md:p-10 p-4 md:pt-10 pt-20">
            {/* Section heading */}
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {activeSection === 'profile' && 'Your Profile'}
                {activeSection === 'tickets' && 'Your Orders'}
                {activeSection === 'subscriptions' && 'Your Subscriptions'}
                {activeSection === 'company' && 'Your Company'}
              </h1>
              <p className="text-gray-600 dark:text-gray-200">
                {activeSection === 'profile' && 'Update your profile information and password'}
                {activeSection === 'tickets' && 'View and manage your purchased tickets'}
                {activeSection === 'subscriptions' && 'Manage your organization subscriptions'}
                {activeSection === 'company' && 'Manage your company details and events'}
              </p>
            </header>

            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-8">
                {/* Edit Profile Card */}
                <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center px-6 py-5 bg-gray-50 dark:bg-black dark:bg-black border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
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
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 dark:bg-black dark:bg-black text-sm font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
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
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                          First Name
                        </label>
                        {isEditing ? (
                          <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-900"
                          placeholder="Enter your first name"
                        />
                        ) : (
                          <div className="flex items-center px-4 py-3 bg-gray-50 dark:bg-black dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <p className="text-gray-900 dark:text-white flex-1">{profileData.firstName || 'Not specified'}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                          Last Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-900"
                            placeholder="Enter your last name"
                          />
                        ) : (
                          <div className="flex items-center px-4 py-3 bg-gray-50 dark:bg-black dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <p className="text-gray-900 dark:text-white flex-1">{profileData.lastName || 'Not specified'}</p>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                          Email Address
                        </label>
                        <div className="flex items-center px-4 py-3 bg-gray-50 dark:bg-black dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                          </svg>
                          <p className="text-gray-900 dark:text-white flex-1">{profileData.email}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 px-2 py-1 rounded">Cannot be changed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Card */}
                <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center px-6 py-5 bg-gray-50 dark:bg-black dark:bg-black border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Password & Security</h2>
                    {!showPasswordSection ? (
                      <button
                        onClick={() => setShowPasswordSection(true)}
                        className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0110 0v4"></path>
                        </svg>
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
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 dark:bg-black dark:bg-black text-sm font-medium rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  
                  <div className="p-6">
                  {showPasswordSection ? (
  <div className="space-y-6">
    <div>
      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
        Current Password
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0110 0v4"></path>
          </svg>
        </div>
        <input
  type={showCurrentPassword ? "text" : "password"}
  id="currentPassword"
  name="currentPassword"
  value={passwordData.currentPassword}
  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-900 dark:text-white"
  placeholder="Enter your current password"
/>
        <div 
          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 dark:text-gray-200"
          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
        >
          {showCurrentPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          )}
        </div>
      </div>
    </div>
    
    <div>
      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
        New Password
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0110 0v4"></path>
          </svg>
        </div>
        <input
  type={showNewPassword ? "text" : "password"}
  id="newPassword"
  name="newPassword"
  value={passwordData.newPassword}
  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-900 dark:text-white"
  placeholder="Enter your new password"
/>
        <div 
          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 dark:text-gray-200"
          onClick={() => setShowNewPassword(!showNewPassword)}
        >
          {showNewPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          )}
        </div>
      </div>
    </div>
    
    <div>
      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
        Confirm New Password
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0110 0v4"></path>
          </svg>
        </div>
        <input
  type={showConfirmPassword ? "text" : "password"}
  id="confirmPassword"
  name="confirmPassword"
  value={passwordData.confirmPassword}
  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors dark:bg-gray-900 dark:text-white"
  placeholder="Confirm your new password"
/>
        <div 
          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 dark:text-gray-200"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          )}
        </div>
      </div>
    </div>
                        
                        <div className="pt-2">
                          <button
                            onClick={handleChangePassword}
                            disabled={isSaving}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm dark:shadow-none"
                          >
                            {isSaving ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating Password...
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                  <path d="M7 11V7a5 5 0 0110 0v4"></path>
                                </svg>
                                Update Password
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-start mb-6">
                          <div className="flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">Your account is secure</h3>
                            <p className="mt-1 text-sm text-green-700">We recommend changing your password regularly to keep your account safe.</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {/* <div className="bg-gray-50 dark:bg-black dark:bg-black rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                  <path d="M7 11V7a5 5 0 0110 0v4"></path>
                                </svg>
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Password</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Last changed 30 days ago</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowPasswordSection(true)}
                              className="text-sm text-emerald-600 hover:text-emerald-700"
                            >
                              Change
                            </button>
                          </div> */}
                          
                          {/* <div className="bg-gray-50 dark:bg-black dark:bg-black rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
                                </svg>
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                              </div>
                            </div>
                            <button
                              className="text-sm text-emerald-600 hover:text-emerald-700"
                            >
                              Setup
                            </button>
                          </div> */}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
{/* Theme Settings Card */}
<ThemeSwitch />
                {/* Connected Accounts Card
                <div className="bg-white dark:bg-black rounded-2xl shadow-sm dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800">
                  <div className="px-6 py-5 bg-gray-50 dark:bg-black dark:bg-black border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Connected Accounts</h2>
                  </div>
                  
                  <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-200 mb-6">Connect your social accounts to enable quick login</p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full">
                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Facebook</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Not connected</p>
                          </div>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
                          Connect
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full">
                            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Twitter</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Not connected</p>
                          </div>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
                          Connect
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 flex items-center justify-center bg-red-100 rounded-full">
                            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">GitHub</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Connected</p>
                          </div>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-black rounded-lg hover:bg-gray-200">
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            )}

           {/* Tickets Section */}
{activeSection === 'tickets' && (
  <MyTicketsSection />
)}


           {/* Subscriptions Section */}
{activeSection === 'subscriptions' && (

    <SubscriptionsSection />

)}

            {/* Company Section */}
            {/* Company Section */}
            {activeSection === 'company' && <CompanySection />}
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfileContent;