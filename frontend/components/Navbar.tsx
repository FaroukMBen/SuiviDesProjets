
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Folder,
  CheckSquare,
  FileText,
  Settings,
  LogOut,
  Bell,
  LayoutTemplate,
  ClipboardCheck,
  Users,
  MessageSquare
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { authService } from '@/lib/auth';
import api from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/api/notifications');
      const count = data.filter((n: any) => n.status === 'unread').length;
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    authService.logout();
    logout();
    router.push('/login');
  };

  const isInstructor = user?.role === 'instructor'
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  // --- MENU ÉTUDIANT ---
  const studentItems = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Mes Projets', href: '/projects', icon: Folder },
    { name: 'Tâches', href: '/tasks', icon: CheckSquare },
    { name: 'Évaluations', href: '/evaluations', icon: FileText },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  // --- MENU ENSEIGNANT ---
  const instructorItems = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Mes Campagnes', href: '/campaigns', icon: LayoutTemplate },
    { name: 'Validations', href: '/validations', icon: ClipboardCheck },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare },
    { name: 'Étudiants', href: '/students', icon: Users },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  const adminItems = [
    { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Utilisateurs', href: '/admin/users', icon: Users },
    { name: 'Campagnes', href: '/admin/campaigns', icon: LayoutTemplate },
    { name: 'Projets', href: '/admin/projects', icon: Folder },
    { name: 'Messagerie', href: '/messagerie', icon: MessageSquare }
  ];


  let navItems;
  if (isInstructor) {
    navItems = instructorItems
  } else if (isStudent) {
    navItems = studentItems;
  } else {
    navItems = adminItems
  }

  return (
    <div className="w-64 bg-[#1e293b] text-white flex flex-col h-screen fixed left-0 top-0 z-50">
      {/* Logo Area */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-wider">NEXUS <span className="text-blue-400 font-light">Portal</span></h1>
        <p className="text-xs text-slate-400 mt-1">
          {isInstructor ? 'Espace Enseignant' : isAdmin ? 'Espace Administrateur' : 'Espace Étudiant'}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium relative
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon size={20} />
              {item.name}

              {/* Badge de notifications */}
              {item.name === 'Notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        {/* Info utilisateur rapide */}
        <Link
          href="/settings"
          className="mb-4 px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-slate-800 transition-all cursor-pointer group border border-transparent hover:border-slate-700"
        >
          <div className="w-9 h-9 min-w-[36px] rounded-full bg-slate-700 group-hover:bg-blue-600 transition-colors flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-slate-800 group-hover:ring-blue-500/30">
            {user?.firstName ? user.firstName[0] : (user?.name ? user.name[0] : 'U')}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate text-slate-200 group-hover:text-white transition-colors">
              {user ? `${user.firstName} ${user.lastName || user.name}` : ''}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 group-hover:text-blue-400 font-semibold transition-colors">
              {user?.role === 'instructor' ? 'Enseignant' : (user?.role === 'admin' ? 'Admin' : 'Étudiant')}
            </p>
          </div>
          <Settings size={14} className="text-slate-600 group-hover:text-slate-400 transform group-hover:rotate-45 transition-all" />
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-red-400 w-full transition-colors text-sm font-medium rounded-lg hover:bg-slate-800"
        >
          <LogOut size={20} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}