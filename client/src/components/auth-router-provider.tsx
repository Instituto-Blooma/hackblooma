import { useEffect } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { useConvexAuth } from 'convex/react';
import { AuthLoadingScreen } from '@/components/auth-loading-screen';
import { router } from '@/lib/router';

export function AuthRouterProvider() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  useEffect(() => {
    if (!isLoading) {
      void router.invalidate();
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return <RouterProvider router={router} context={{ auth: { isAuthenticated } }} />;
}
