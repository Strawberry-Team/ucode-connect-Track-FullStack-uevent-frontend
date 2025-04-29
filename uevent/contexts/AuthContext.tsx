import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import authService from '../services/authService';
import userService from '../services/userService';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
  profilePictureName?: string;
  countryCode?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<any>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<any>;
  sendPasswordResetLink: (email: string) => Promise<any>;
  resetPassword: (token: string, newPassword: string) => Promise<any>;
  clearError: () => void;
  updateUserProfile: (userData: any) => Promise<any>;
  uploadUserAvatar: (formData: FormData, userId: string) => Promise<any>;
  updateUserState: (updatedUserData: Partial<User>) => void;
  refreshUser: () => void;
  updateUserPassword: (userData: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Инициализация интерсепторов для автоматического обновления токенов
  useEffect(() => {
    // Установка существующего токена при загрузке
    const accessToken = sessionStorage.getItem('accessToken');
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }

    // Настройка интерсептора для ответов
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // FIX: Better check for auth endpoints
        const isAuthEndpoint = originalRequest.url && (
          originalRequest.url.includes('/auth/login') ||
          originalRequest.url.includes('/auth/register') ||
          originalRequest.url.includes('/login') ||
          originalRequest.url.includes('/register')
        );
        
        // FIX: Only try to refresh token if we have one and it's not an auth endpoint
        const hasRefreshToken = localStorage.getItem('refreshToken') !== null;
        
        if (
          error.response &&
          (error.response.status === 401 || error.response.status === 403) &&
          !originalRequest._retry &&
          !isAuthEndpoint &&
          hasRefreshToken
        ) {
          originalRequest._retry = true;
          try {
            const refreshedTokenData = await authService.refreshToken();
            if (refreshedTokenData.newRefreshToken) {
              localStorage.setItem("refreshToken", refreshedTokenData.newRefreshToken);
            }
            originalRequest.headers['Authorization'] = `Bearer ${refreshedTokenData.accessToken}`;
            sessionStorage.setItem('accessToken', refreshedTokenData.accessToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${refreshedTokenData.accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Сброс данных пользователя при неудачном обновлении токена
            setUser(null);
            localStorage.removeItem('user');
            sessionStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            router.push('/login');
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    // Загрузка пользователя из localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse user from localStorage', err);
        localStorage.removeItem('user');
      } finally {
        // Всегда устанавливаем initialLoading в false после завершения проверки
        setInitialLoading(false);
      }
    }

    // Очистка интерсептора при размонтировании
    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [router]);
  // Обновите этот метод в вашем файле AuthContext.tsx
// Обновленный метод register в AuthContext.tsx
const register = async (firstName: string, lastName: string, email: string, password: string) => {
  try {
    setLoading(true);
    setError(null);
    
    const userData = { 
      firstName, 
      lastName, 
      email, 
      password
    };
    
    try {
      const response = await authService.register(userData);
      // В случае успеха, просто возвращаем ответ
      return response;
    } catch (apiError: any) {
      // Обрабатываем ошибку API без повторной генерации исключения
      console.error('API registration error handled in AuthContext:', apiError.message);
      
      // Устанавливаем сообщение об ошибке из ответа API
      const errorMessage = apiError.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      
      // Важно: Вместо Promise.reject возвращаем объект с информацией об ошибке
      return {
        error: true,
        message: errorMessage,
        details: apiError.response?.data || {}
      };
    }
  } catch (err: any) {
    // Это перехватит любые другие непредвиденные ошибки
    console.error('Unexpected registration error in AuthContext:', err);
    
    const errorMessage = 'An unexpected error occurred. Please try again.';
    setError(errorMessage);
    
    // Возвращаем объект с информацией об ошибке вместо Promise.reject
    return {
      error: true,
      message: errorMessage
    };
  } finally {
    setLoading(false);
  }
};

const login = async (email: string, password: string) => {
  try {
    setLoading(true);
    setError(null);
    
    // Реальный запрос для других пользователей
    try {
      const response = await authService.login({ email, password });
      if (response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Установка заголовка Authorization
        if (response.accessToken) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.accessToken}`;
        }
      }
      return response;
    } catch (apiError: any) {
      // Обработка ошибки API без повторной генерации исключения
      console.error('Login error handled in AuthContext:', apiError.message);
      
      // Устанавливаем сообщение об ошибке
      setError(apiError.message || 'Login failed. Try test@example.com / Test@1234');
      
      // Важно: Возвращаем объект с ошибкой, а не выбрасываем исключение
      return {
        error: true,
        message: apiError.message || 'Login failed'
      };
    }
  } catch (err: any) {
    // Перехватываем любые непредвиденные ошибки
    console.error('Unexpected login error in AuthContext:', err);
    setError('An unexpected error occurred. Please try again.');
    
    // Возвращаем объект с информацией об ошибке вместо Promise.reject
    return {
      error: true,
      message: 'An unexpected error occurred'
    };
  } finally {
    setLoading(false);
  }
};

  const logout = async () => {
    try {
      setLoading(true);
      const refreshToken = localStorage.getItem('refreshToken');
      
      // FIX: Only attempt to call logout API if we have a refresh token
      if (refreshToken) {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout API error:', error);
          // Continue with local cleanup even if API call fails
        }
      }
      
      // Always clean up local storage and state
      setUser(null);
      localStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete axios.defaults.headers.common['Authorization'];
      router.push('/login');
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.response?.data?.message || 'Logout failed');
      
      // Even if there's an error, clean up
      setUser(null);
      localStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete axios.defaults.headers.common['Authorization'];
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  // Rest of the code remains the same...
  const verifyEmail = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.verifyEmail(token);
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email verification failed');
      setLoading(false);
      throw err;
    }
  };

  const sendPasswordResetLink = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('tyt1');
      const data = await authService.sendPasswordResetLink(email);
      console.log('tyt2', data);
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset link');
      setLoading(false);
      throw err;
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await authService.resetPassword(token, newPassword);
      setLoading(false);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Password reset failed');
      setLoading(false);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  // НОВЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С ПРОФИЛЕМ ПОЛЬЗОВАТЕЛЯ

  // Общий метод для обновления состояния пользователя
  const updateUserState = (updatedUserData: Partial<User>) => {
    if (user) {
      const newUserData = { ...user, ...updatedUserData };
      setUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
    }
  };

  // Метод для обновления профиля пользователя
  // Обновленный метод updateUserProfile
const updateUserProfile = async (userData: any) => {
  try {
    setLoading(true);
    setError(null);

    if (!user) {
      return {
        error: true,
        message: 'User not authenticated'
      };
    }

    try {
      const updatedUserData = await userService.updateCurrentUser(userData, user.id);
      
      // Обновляем локальное состояние пользователя
      updateUserState(updatedUserData);
      
      return {
        success: true,
        message: 'Profile successfully updated',
        data: updatedUserData
      };
    } catch (apiError: any) {
      // Обрабатываем ошибку API, извлекаем сообщение
      console.error('API profile update error:', apiError.response?.status, apiError.response?.data);
      
      // Формируем понятное сообщение об ошибке
      const errorMessage = apiError.response?.data?.message || 
                         (apiError.response?.status === 403 ? 'Permission denied' : 
                          'Failed to update profile. Please try again.');
      
      // Устанавливаем сообщение об ошибке в состояние
      setError(errorMessage);
      
      // Возвращаем объект с информацией об ошибке вместо Promise.reject
      return {
        error: true,
        message: errorMessage,
        details: apiError.response?.data
      };
    }
  } catch (err: any) {
    console.error('Unexpected error updating profile:', err);
    const errorMessage = 'An unexpected error occurred. Please try again.';
    setError(errorMessage);
    
    return {
      error: true,
      message: errorMessage
    };
  } finally {
    setLoading(false);
  }
};

  // Обновленный метод updateUserPassword
const updateUserPassword = async (userData: any) => {
  try {
    setLoading(true);
    setError(null);

    if (!user) {
      return {
        error: true,
        message: 'User not authenticated'
      };
    }

    try {
      const response = await userService.updatePasswordUser(userData, user.id);
      
      return {
        success: true,
        message: 'Password successfully updated',
        data: response
      };
    } catch (apiError: any) {
      // Обрабатываем ошибку API, извлекаем сообщение
      console.error('API password update error:', apiError.response?.status, apiError.response?.data);
      
      // Формируем понятное сообщение об ошибке с учетом разных типов ошибок
      let errorMessage = 'Failed to update password. Please try again.';
      
      if (apiError.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else if (apiError.response?.status === 400) {
        errorMessage = 'Current password is incorrect';
      } else if (apiError.response?.status === 403) {
        errorMessage = 'Permission denied';
      }
      
      // Устанавливаем сообщение об ошибке в состояние
      setError(errorMessage);
      
      // Возвращаем объект с информацией об ошибке вместо Promise.reject
      return {
        error: true,
        message: errorMessage,
        details: apiError.response?.data
      };
    }
  } catch (err: any) {
    console.error('Unexpected error updating password:', err);
    const errorMessage = 'An unexpected error occurred. Please try again.';
    setError(errorMessage);
    
    return {
      error: true,
      message: errorMessage
    };
  } finally {
    setLoading(false);
  }
};

 // Обновленный метод uploadUserAvatar
const uploadUserAvatar = async (formData: FormData, userId: string) => {
  try {
    setLoading(true);
    setError(null);
    
    if (!user) {
      return {
        error: true,
        message: 'User not authenticated'
      };
    }
    
    try {
      // Загружаем аватар
      const response = await userService.uploadAvatar(formData, userId);
      
      // Если получили имя файла с сервера
      if (response.server_filename) {
        // Формируем URL на основе имени файла
        const baseUrl = 'http://localhost:8080/uploads/user-avatars/';
        const profilePictureUrl = `${baseUrl}${response.server_filename}`;
        
        // Обновляем локальное состояние пользователя
        setUser(prevUser => {
          if (!prevUser) return prevUser;
          return { 
            ...prevUser, 
            profilePictureName: response.server_filename,
            profilePictureUrl: profilePictureUrl 
          };
        });
        
        // Обновляем localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            const mergedUser = { 
              ...parsedUser, 
              profilePictureName: response.server_filename,
              profilePictureUrl: profilePictureUrl
            };
            localStorage.setItem('user', JSON.stringify(mergedUser));
            
            // Вызываем событие storage для обновления UI в других компонентах
            window.dispatchEvent(new Event('storage'));
          } catch (err) {
            console.error('Failed to update user in localStorage', err);
          }
        }
        
        return {
          success: true,
          message: 'Avatar successfully uploaded',
          data: response,
          profilePictureUrl: profilePictureUrl
        };
      } else {
        return {
          error: true,
          message: 'Failed to process uploaded avatar'
        };
      }
    } catch (apiError: any) {
      // Обрабатываем ошибку API
      console.error('API avatar upload error:', apiError.response?.status, apiError.response?.data);
      
      // Формируем сообщение об ошибке
      const errorMessage = apiError.response?.data?.message || 
                         (apiError.response?.status === 413 ? 'Image is too large' : 
                          'Failed to upload avatar. Please try again.');
      
      // Устанавливаем сообщение об ошибке
      setError(errorMessage);
      
      return {
        error: true,
        message: errorMessage,
        details: apiError.response?.data
      };
    }
  } catch (err: any) {
    console.error('Unexpected error uploading avatar:', err);
    const errorMessage = 'An unexpected error occurred. Please try again.';
    setError(errorMessage);
    
    return {
      error: true,
      message: errorMessage
    };
  } finally {
    setLoading(false);
  }
};


const refreshUser = () => {
  // Получаем пользователя из localStorage
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      setUser(JSON.parse(storedUser));
    } catch (err) {
      console.error('Failed to parse user from localStorage', err);
    }
  }
};
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      initialLoading,
      register, 
      logout, 
      verifyEmail,
      sendPasswordResetLink,
      resetPassword,
      clearError,
      updateUserProfile,
      uploadUserAvatar,
      updateUserState,
      refreshUser,
      updateUserPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};