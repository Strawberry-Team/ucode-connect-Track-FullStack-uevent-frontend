import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { register, loading, error: contextError, user, clearError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Очищаем ошибки при монтировании компонента
    clearError();
    
    // Редиректим залогиненного пользователя
    if (user) {
      router.push('/');
    }
  }, [user, router]);  // Removed clearError dependency to prevent unnecessary rerenders

  // Больше не реагируем на ошибки контекста, обрабатываем их локально
  // вместо этого используем localError в handleSubmit

  const validatePassword = (password: string): boolean => {
    // Минимум 8 символов, содержит заглавные, строчные, цифру и спецсимвол
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
    return regex.test(password);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    if (newPassword && !validatePassword(newPassword)) {
      setPasswordError('Password must be at least 8 characters and include uppercase, lowercase, number and special character');
    } else if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    
    if (password && newConfirmPassword && password !== newConfirmPassword) {
      setPasswordError('Passwords do not match');
    } else if (password && !validatePassword(password)) {
      setPasswordError('Password must be at least 8 characters and include uppercase, lowercase, number and special character');
    } else {
      setPasswordError('');
    }
  };

  // Функция для обработки ошибок API регистрации
  const handleApiError = (errorMessage) => {
    if (errorMessage.includes('email already') || errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
      setStatusMessage({
        type: 'error',
        message: 'This email is already registered. Please use a different email or try to login.'
      });
    } else if (errorMessage.includes('validation') || errorMessage.includes('valid email')) {
      setStatusMessage({
        type: 'error',
        message: 'Please enter a valid email address.'
      });
    } else if (errorMessage.includes('connection') || errorMessage.includes('network')) {
      setStatusMessage({
        type: 'error',
        message: 'Network connection issue. Please check your internet connection and try again.'
      });
    } else {
      setStatusMessage({
        type: 'error',
        message: errorMessage || 'Registration failed. Please try again.'
      });
    }
  };

  // Обновленный метод handleSubmit в компоненте Register
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Очищаем предыдущие сообщения об ошибках
  setStatusMessage({ type: '', message: '' });
  
  // Валидация
  if (!firstName || !lastName || !email || !password) {
    setStatusMessage({
      type: 'error',
      message: 'All fields are required'
    });
    return;
  }
  
  if (password !== confirmPassword) {
    setPasswordError('Passwords do not match');
    return;
  }
  
  if (!validatePassword(password)) {
    setPasswordError('Password must be at least 8 characters and include uppercase, lowercase, number and special character');
    return;
  }
  
  try {
    // Вызываем метод регистрации из контекста
    const response = await register(firstName, lastName, email, password);
    
    // Проверяем, вернулась ли ошибка из метода register
    if (response && response.error) {
      // Если register вернул объект с ошибкой, обрабатываем его здесь
      handleApiError(response.message || 'Registration failed');
      return; // Прекращаем выполнение функции
    }
    
    // Если мы дошли до этой точки без ошибок, значит регистрация прошла успешно
    setRegistrationSuccess(true);
    setStatusMessage({
      type: 'success',
      message: 'Registration successful! Please check your email to verify your account.'
    });
    
    // Очищаем форму
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    
    // Редирект на страницу входа произойдет через несколько секунд
    setTimeout(() => {
      router.push('/login?registered=true');
    }, 5000);
    
  } catch (err: any) {
    // Этот блок больше не должен выполняться, так как register не выбрасывает исключения
    // Но на всякий случай оставляем, чтобы перехватить любые непредвиденные ошибки
    console.error('Unexpected error in Register handleSubmit:', err);
    handleApiError(err.message || 'An unexpected error occurred');
  }
};

  return (
    <>
      <Head>
        <title>Sign Up | TripUp</title>
        <meta name="description" content="Create your TripUp account and start connecting with events and people" />
      </Head>

      <div className="min-h-screen flex items-center justify-center dark:bg-dark-bg">
        <div className="grid grid-cols-1 lg:grid-cols-5 w-full max-w-screen-xl shadow-2xl rounded-xl overflow-hidden">
          {/* Левая панель с иллюстрацией */}
          <div className="col-span-2 hidden lg:block relative bg-emerald-700">
            <div className="absolute inset-0 bg-opacity-70 bg-emerald-700 flex flex-col justify-center p-12">
              <div className="text-white space-y-6">
                <div className="mb-12">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-emerald-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>

                <h2 className="text-3xl font-bold mb-4">Join our community</h2>
                <p className="text-emerald-100 mb-6">
                  Connect with events and people who share your passions
                </p>

                <div className="space-y-4">
                  {[
                    "Discover events in your area",
                    "Meet like-minded people",
                    "Create and manage your own events",
                    "Build meaningful connections"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <svg className="h-5 w-5 mr-2 text-emerald-300 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 text-center text-emerald-200 text-sm">
              <p>&copy; {new Date().getFullYear()} TripUp. All rights reserved.</p>
            </div>
          </div>

          {/* Правая панель с формой */}
          <div className="col-span-3 p-8 md:p-12 lg:p-16 bg-white dark:bg-black">
            <div className="mb-10">
              <Link href="/" className="inline-flex items-center space-x-2">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 text-emerald-600 dark:text-emerald-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
  </svg>
</div>
                <span className="text-xl font-semibold text-gray-800 dark:text-white">TripUp</span>
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create your account</h1>
              <p className="text-gray-600 dark:text-gray-200">Join TripUp to discover events and meet new people</p>
            </div>

            {registrationSuccess ? (
              <div className="text-center py-8 px-4">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <svg className="h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Registration Successful!</h2>
                <p className="text-gray-600 dark:text-gray-200 mb-6">
                  We've sent a verification email to <span className="font-medium">{email}</span>. 
                  Please check your inbox and click the verification link to activate your account.
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                  You will be redirected to the login page in a few seconds...
                </p>
                <Link 
                  href="/login" 
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm dark:shadow-none text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Go to Login Page
                </Link>
              </div>
            ) : (
              <>
                {statusMessage.message && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    statusMessage.type === 'error' 
                      ? 'bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-300' 
                      : statusMessage.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 text-green-600 dark:text-green-300'
                        : 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-800 text-yellow-600 dark:text-yellow-300'
                  }`}>
                    <div className="flex items-start">
                      {statusMessage.type === 'error' && (
                        <svg className="h-5 w-5 mr-2 text-red-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      {statusMessage.type === 'success' && (
                        <svg className="h-5 w-5 mr-2 text-green-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {statusMessage.type === 'warning' && (
                        <svg className="h-5 w-5 mr-2 text-yellow-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                      <p className="text-sm">{statusMessage.message}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        First name
                      </label>
                      <input
  id="first-name"
  name="first-name"
  type="text"
  required
  value={firstName}
  onChange={(e) => setFirstName(e.target.value)}
  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors dark:bg-gray-900 dark:text-white"
  placeholder="John"
/>
                    </div>

                    <div>
                      <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Last name
                      </label>
                      <input
                        id="last-name"
                        name="last-name"
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors dark:bg-gray-900 dark:text-white"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors dark:bg-gray-900 dark:text-white"
                      placeholder="you@example.com"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      We'll send a verification email to this address
                    </p>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Password
                    </label>
                    <div className="relative">
                    <input
  id="password"
  name="password"
  type={showPassword ? "text" : "password"}
  autoComplete="new-password"
  required
  value={password}
  onChange={handlePasswordChange}
  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors dark:bg-gray-900 dark:text-white"
  placeholder="••••••••"
/>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200"
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span className={password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}>
                        <span className={password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>✓</span> 8+ characters
                      </span>
                      <span className={/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                        <span className={/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>✓</span> Uppercase
                      </span>
                      <span className={/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                        <span className={/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>✓</span> Lowercase
                      </span>
                      <span className={/\d/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                        <span className={/\d/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>✓</span> Number
                      </span>
                      <span className={/[^\da-zA-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                        <span className={/[^\da-zA-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>✓</span> Special character
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password"
                        name="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors dark:bg-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200"
                      >
                        {showConfirmPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {passwordError && (
  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800">
    <p className="text-sm text-red-600 dark:text-red-300">{passwordError}</p>
  </div>
)}

                  <div>
                    <button
                      type="submit"
                      disabled={loading || !!passwordError}
                      className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${
                        loading || !!passwordError
                          ? 'bg-emerald-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Creating account...</span>
                        </div>
                      ) : (
                        'Create account'
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-200">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                      Sign in
                    </Link>
                  </p>
                </div>

                <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
                  <p>By creating an account, you agree to our</p>
                  <div className="mt-1 space-x-1">
                    <a href="#" className="text-emerald-600 hover:text-emerald-500">Terms of Service</a>
                    <span>&middot;</span>
                    <a href="#" className="text-emerald-600 hover:text-emerald-500">Privacy Policy</a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}