import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import Head from 'next/head';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { sendPasswordResetLink, loading, error, clearError } = useAuth();

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setMessage('');
    clearError();
    
    try {
      await sendPasswordResetLink(email);
      setIsSuccess(true);
      setMessage('Password reset link has been sent to your email');
    } catch (err: any) {
      setIsSuccess(false);
      setMessage(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password | TripUp</title>
        <meta name="description" content="Reset your TripUp account password" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-dark-bg">
        <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-black rounded-xl shadow-lg dark:shadow-none">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 text-emerald-600 dark:text-emerald-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-800 dark:text-white">TripUp</span>
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Forgot your password?</h1>
            <p className="text-gray-600 dark:text-gray-200">Enter your email address and we'll send you a link to reset your password.</p>
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${isSuccess 
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800'}`}>
              <p className={`text-sm ${isSuccess 
                ? 'text-green-600 dark:text-green-300' 
                : 'text-red-600 dark:text-red-300'}`}>{message}</p>
            </div>
          )}

          {!isSuccess && (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                      <span>Sending link...</span>
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
          )}

          <div className="text-center">
            <Link href="/login" className="text-emerald-600 hover:text-emerald-500 font-medium">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

