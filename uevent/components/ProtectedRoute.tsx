import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register'];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Use the 'user' property to determine authentication status
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Determine authentication status based on user object
  const isAuthenticated = !!user;

  useEffect(() => {
    // Skip route protection logic while auth state is loading
    if (loading) return;

    // If user is not authenticated and the route is not public
    if (!isAuthenticated && !publicRoutes.includes(router.pathname)) {
      router.push({
        pathname: '/login',
        query: { redirect: router.asPath },
      });
    }
  }, [isAuthenticated, loading, router]);

  // Show nothing while checking authentication
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // If the route is public or user is authenticated, render the children
  if (publicRoutes.includes(router.pathname) || isAuthenticated) {
    return <>{children}</>;
  }

  // This should not be visible because we're redirecting, but just in case
  return <div className="flex h-screen items-center justify-center">Redirecting...</div>;
}