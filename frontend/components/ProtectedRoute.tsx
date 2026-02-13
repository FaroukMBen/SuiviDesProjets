'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

// On définit les props acceptées par le composant
interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, requireAdmin = false, allowedRoles }: Props) {
  // On récupère le token ET l'utilisateur (pour voir son rôle)
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // 1. Vérification de base : Est-il connecté ?
  if (!token) {
    router.push('/login');
    return null;
  }

  // 2. Vérification Admin : Si la page demande 'requireAdmin' et que l'user n'est pas admin
  if (requireAdmin && user?.role !== 'admin') {
    // On le redirige vers le dashboard standard (ou une page 403)
    router.push('/dashboard');
    return null;
  }

  // 3. Vérification Rôles Spécifiques
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    router.push('/dashboard');
    return null;
  }

  return <>{children}</>;
}