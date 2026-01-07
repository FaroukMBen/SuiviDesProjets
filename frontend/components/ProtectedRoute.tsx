'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tant que le composant n'est pas monté côté client, on n'affiche rien
  // (Cela évite le conflit avec le rendu serveur qui ne connait pas le token)
  if (!mounted) {
    return null;
  }

  // Si pas de token, on redirige
  if (!token) {
    router.push('/login');
    return null;
  }

  // Si tout est bon, on affiche le contenu protégé
  return <>{children}</>;
}