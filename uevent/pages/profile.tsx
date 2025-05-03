import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingProfile from '../components/LoadingProfile';
import dynamic from 'next/dynamic';

const ProfileContent = dynamic(
  () => import('../components/ProfileContent'),
  {
    loading: () => <LoadingProfile />,
    ssr: false,
  }
);

export default function Profile() {
  const router = useRouter();
  const { user, loading, initialLoading } = useAuth();
  const [minLoadingTime, setMinLoadingTime] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (!initialLoading && !loading && !user) {
      const returnUrl = router.asPath;
      sessionStorage.setItem('returnUrl', returnUrl);
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [user, loading, initialLoading, router]);

  if (initialLoading || loading || minLoadingTime) {
    return (
      <>
        <Head>
          <title>Loading Profile | TripUp</title>
        </Head>
        <LoadingProfile />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Head>
          <title>Loading Profile | TripUp</title>
        </Head>
        <LoadingProfile />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Your Profile | TripUp</title>
        <meta name="description" content="Manage your TripUp profile" />
      </Head>

      <ToastContainer position="bottom-right" autoClose={3000} />
      <ProfileContent user={user} />
    </>
  );
}

