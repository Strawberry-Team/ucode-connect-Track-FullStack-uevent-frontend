import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

const publicRoutes = ['/', '/login', '/register'];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const isAuthenticated = !!user;

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated && !publicRoutes.includes(router.pathname)) {
      router.push({
        pathname: '/login',
        query: { redirect: router.asPath },
      });
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (publicRoutes.includes(router.pathname) || isAuthenticated) {
    return <>{children}</>;
  }

  return <div className="flex h-screen items-center justify-center">Redirecting...</div>;
}

