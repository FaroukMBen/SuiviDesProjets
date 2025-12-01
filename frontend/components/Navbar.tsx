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
    <nav className="bg-white border-b border-[--color-border] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[--color-primary] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="font-bold text-lg text-[--color-foreground]">Nexus</span>
            </Link>
            {user && (
              <div className="hidden md:flex gap-6">
                <Link href="/dashboard" className="text-[--color-muted] hover:text-[--color-foreground] transition">
                  Dashboard
                </Link>
                <Link href="/projects" className="text-[--color-muted] hover:text-[--color-foreground] transition">
                  Projects
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-[--color-foreground]">{user.name}</p>
                  <p className="text-xs text-[--color-muted]">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-[--color-primary] rounded-lg hover:bg-blue-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-[--color-foreground] hover:text-[--color-primary] transition">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-[--color-primary] text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
