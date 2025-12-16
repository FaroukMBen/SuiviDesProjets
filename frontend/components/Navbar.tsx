'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    authService.logout();
    logout();
    router.push('/login');
  };

  return (
    // Ajout de sticky top-0 pour que la barre reste visible au scroll
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Section Gauche : Logo + Liens */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              {/* Logo "N" avec le Bleu Primary Nexus */}
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-primary-700 transition-colors">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">Nexus</span>
            </Link>

            {/* Navigation Desktop */}
            {user && (
              <div className="hidden md:flex gap-1">
                <Link 
                  href="/dashboard" 
                  className="px-3 py-2 text-sm font-medium text-gray-500 rounded-md hover:text-gray-900 hover:bg-gray-50 transition-all"
                >
                  Tableau de bord
                </Link>
                <Link 
                  href="/projects" 
                  className="px-3 py-2 text-sm font-medium text-gray-500 rounded-md hover:text-gray-900 hover:bg-gray-50 transition-all"
                >
                  Mes Projets
                </Link>
              </div>
            )}
          </div>

          {/* Section Droite : Profil / Auth */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 font-medium capitalize">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  // Bouton discret (Outline) pour la déconnexion
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-gray-600 hover:text-primary-600 transition"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-sm shadow-primary-500/30"
                >
                  S'inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}