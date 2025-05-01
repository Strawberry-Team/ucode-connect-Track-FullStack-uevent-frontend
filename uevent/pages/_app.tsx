// pages/_app.tsx
import { useEffect } from 'react';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import axios from 'axios';
import { AuthProvider } from '../contexts/AuthContext';
import { CompanyProvider } from '../contexts/CompanyContext';
import authService from '../services/authService';
import csrfService from '../services/csrfService';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ErrorBoundary from '../components/ErrorBoundary';
import '../styles/themes.css';
import { ThemeProvider } from '../contexts/ThemeContext';
import { EventProvider } from '../contexts/EventContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { PromoCodeProvider } from '../contexts/PromoCodeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { OrderProvider } from '../contexts/OrderContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Список публичных путей, которые не требуют аутентификации
const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Проверяем, является ли текущий путь публичным
  const isPublicPath = publicPaths.some(path => 
    router.pathname === path || router.pathname.startsWith('/reset-password/')
  );

  useEffect(() => {
    // Инициализация интерсепторов при загрузке приложения
    authService.setupInterceptors();
    
    //Попытка получить CSRF-токен для защиты от CSRF-атак
    const fetchCsrfToken = async () => {
      try {
        await csrfService.fetchCsrfToken();
        csrfService.setupAxiosInterceptors();
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };
    
    // Установить токен из сессии, если он есть
    const accessToken = sessionStorage.getItem('accessToken');
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    }
    
    fetchCsrfToken();
  }, []);
  
  // Проверка темы при загрузке на стороне клиента
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'system';
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme === 'dark' || (savedTheme === 'system' && prefersDarkMode)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
      <NotificationProvider>
      <SubscriptionProvider>
        <CompanyProvider>
        <EventProvider>
        <PromoCodeProvider>
        <OrderProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-grow">
              <Component {...pageProps} />
            </main>
            <Footer />
            {/* Add ToastContainer here */}
            <ToastContainer 
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </div>
          </OrderProvider>
          </PromoCodeProvider>
          </EventProvider>
        </CompanyProvider>
        </SubscriptionProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;