import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const { login, error: authError, loading, user, clearError } = useAuth();
  const router = useRouter();
  const { returnUrl } = router.query;
  // Combined error handling from context and local state
  const error = localError || authError;

  useEffect(() => {
    // Clear errors only when component mounts, not on every render
    if (authError) {
      clearError();
    }
    
    // Redirect to returnUrl or home page if user is logged in
    if (user) {
      // Если есть returnUrl, декодируем и используем его
      if (returnUrl && typeof returnUrl === 'string') {
        router.push(decodeURIComponent(returnUrl));
      } else {
        // Иначе, проверяем есть ли сохраненный URL в sessionStorage
        const savedReturnUrl = sessionStorage.getItem('returnUrl');
        if (savedReturnUrl) {
          sessionStorage.removeItem('returnUrl');
          router.push(savedReturnUrl);
        } else {
          // В крайнем случае, перенаправляем на главную
          router.push('/');
        }
      }
    }
  }, [user, router, returnUrl, authError, clearError]);  // Removed clearError dependency to prevent unnecessary rerenders

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setLocalError('');
    clearError();
    
    try {
      // Attempt login
      const response = await login(email, password);
      if (response && response.error) {
        // Если login вернул объект с ошибкой, обрабатываем его здесь
        setLocalError(response.message || 'Failed to login');
        return; // Прекращаем выполнение функции
      }
      // На успех будет редирект через useEffect
    } catch (err: any) {
      // Обрабатываем локально и не даем ошибке "всплыть" выше
      setLocalError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      console.log('Login error handled:', err.message);
      // Критически важно - не делаем throw err или return Promise.reject
    }
  };

  return (
    <>
      <Head>
        <title>Sign In | UEvent</title>
        <meta name="description" content="Sign in to your UEvent account" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-dark-bg">
        <div className="grid grid-cols-1 lg:grid-cols-5 w-full max-w-screen-xl shadow-2xl rounded-xl overflow-hidden">
          {/* Левая панель с формой */}
          <div className="col-span-3 p-8 md:p-12 lg:p-16 bg-white dark:bg-black dark:bg-black">
            <div className="mb-10">
              <Link href="/" className="inline-flex items-center space-x-2">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 text-emerald-600 dark:text-emerald-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
  </svg>
</div>
                <span className="text-xl font-semibold text-gray-800 dark:text-white dark:text-white">UEvent</span>
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white mb-2">Welcome back</h1>
              <p className="text-gray-600 dark:text-gray-200 dark:text-gray-200">Sign in to continue to your account</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-200 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white dark:bg-black dark:bg-dark-input dark:text-white"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-200">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-500">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white dark:bg-black dark:bg-dark-input dark:text-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200 dark:hover:text-gray-300"
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
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-600 rounded dark:border-gray-600 dark:bg-dark-input"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-200 dark:text-gray-200">
                  Remember me
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${
                    loading
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
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-200 dark:text-gray-200">
                Don't have an account?{' '}
                <Link href="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Правая панель с иллюстрацией */}
          <div className="col-span-2 hidden lg:block relative bg-emerald-700">
            <div className="absolute inset-0 bg-opacity-70 bg-emerald-700 flex flex-col justify-center p-12">
              <div className="text-white space-y-6">
                <div className="mb-12">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-emerald-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>

                <h2 className="text-3xl font-bold mb-4">Find your next experience</h2>
                <p className="text-emerald-100 mb-6">
                  Discover events that match your interests and connect with like-minded people
                </p>

                <div className="space-y-4">
                  {[
                    "Discover local and online events",
                    "Connect with people who share your interests",
                    "Create and manage your own events",
                    "Get personalized recommendations"
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
              <p>&copy; {new Date().getFullYear()} UEvent. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}