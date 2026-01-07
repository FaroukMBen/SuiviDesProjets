'use client';

import { useEffect, useState } from 'react'; // Ajout de useState
import { useAuthStore } from '@/lib/store';
import { authService } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, user, setUser, setToken } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  // NOUVEAU : On gère l'état "monté" pour éviter l'erreur d'hydratation
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // On confirme qu'on est bien côté client
  }, []);

  useEffect(() => {
    // On ne lance la logique que si le composant est monté
    if (!mounted) return;

    const initAuth = async () => {
      if (token && !user) {
        try {
          const userData = await authService.getProfile();
          setUser(userData);
        } catch (err) {
          console.error("Session expirée");
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          router.push('/login');
        }
      } else if (!token && !['/login', '/register', '/'].includes(pathname)) {
         router.push('/login');
      }
    };

    initAuth();
  }, [token, user, pathname, setUser, setToken, router, mounted]);

  // CORRECTION HYDRATION :
  // Tant que ce n'est pas monté, on renvoie les enfants (comme le serveur)
  // Cela évite le conflit HTML.
  if (!mounted) {
    return <>{children}</>;
  }

  // Une fois monté, si on a un token mais pas d'user, on affiche le loader
  if (token && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}