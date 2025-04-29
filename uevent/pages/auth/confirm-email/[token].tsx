import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import Head from 'next/head';

export default function ConfirmEmail() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('Verifying your email...');
  const router = useRouter();
  const { token } = router.query;
  const { verifyEmail } = useAuth();

  useEffect(() => {
    // Only run verification once we have the token from the URL
    if (token && typeof token === 'string') {
      verifyEmailToken(token);
    }
  }, [token]);

  const verifyEmailToken = async (token: string) => {
    try {
      await verifyEmail(token);
      setIsSuccess(true);
      setMessage('Your email has been successfully verified! You can now log in.');
    } catch (err: any) {
      setIsSuccess(false);
      setMessage(err.response?.data?.message || 'Email verification failed. This link may be invalid or expired.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <Head>
        <title>Confirm Email | UEvent</title>
        <meta name="description" content="Confirm your email address for UEvent" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-black rounded-xl shadow-lg dark:shadow-none">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/300 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-800 dark:text-white">UEvent</span>
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Email Verification</h1>
          </div>

          {isVerifying ? (
            <div className="flex flex-col items-center justify-center py-4">
              <svg className="animate-spin h-10 w-10 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 dark:text-gray-200">{message}</p>
            </div>
          ) : (
            <div className={`p-6 rounded-lg text-center ${isSuccess ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex justify-center mb-4">
                {isSuccess ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <p className={`text-lg font-medium ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>{message}</p>
              
              <div className="mt-6">
                {isSuccess ? (
                  <Link href="/login" className="inline-block bg-emerald-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                    Log in now
                  </Link>
                ) : (
                  <Link href="/" className="inline-block bg-emerald-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                    Return to Home
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}