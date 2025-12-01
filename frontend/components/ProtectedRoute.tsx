'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authService } from '@/lib/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, setToken, setUser, isLoading, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    if (!token) {
      router.push('/login');
      setLoading(false);
      return;
    }

    // Validate token by fetching profile
    authService.getProfile()
      .then(user => {
        setUser(user);
        setLoading(false);
      })
      .catch(() => {
        setToken(null);
        router.push('/login');
        setLoading(false);
      });
  }, [token, router, setToken, setUser, setLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return <>{children}</>;
}
