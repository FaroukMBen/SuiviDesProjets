'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Folder, CheckSquare, FileText, Settings, LogOut } from 'lucide-react'; // Installe lucide-react si besoin
import { useAuthStore } from '@/lib/store';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    authService.logout();
    logout();
    router.push('/login');
  };

  const navItems = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Mes Projets', href: '/projects', icon: Folder },
    { name: 'Tâches', href: '/tasks', icon: CheckSquare },
    { name: 'Évaluations', href: '/evaluations', icon: FileText },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#1e293b] text-white flex flex-col h-screen fixed left-0 top-0 z-50">
      {/* Logo Area */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-wider">NEXUS <span className="text-blue-400 font-light">Portal</span></h1>
        <p className="text-xs text-slate-400 mt-1">Suivi de projets</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Area */}
      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-red-400 w-full transition-colors text-sm font-medium"
        >
          <LogOut size={20} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}