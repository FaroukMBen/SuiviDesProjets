'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/Badge'; // Le composant qu'on a créé au début

import { useAuthStore, useThemeStore } from '@/lib/store';
import api from '@/lib/auth';
import { NotificationBell } from '@/components/NotificationBell';
import { Sparkles, Layout } from 'lucide-react';

interface ProjectHeaderProps {
  project: {
    _id: string;
    title: string;
    owner: { name: string };
    tags: string[];
  };
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();
  const { setTheme } = useThemeStore(); // Keep for store sync if needed elsewhere
  const baseUrl = `/projects/${project._id}`;

  const tabs = [
    { name: 'Aperçu', href: baseUrl, exact: true },
    { name: 'Kanban', href: `${baseUrl}/kanban` },
    { name: 'Jalons', href: `${baseUrl}/milestones` },
    { name: 'GitHub', href: `${baseUrl}/commits` },
    { name: 'Feedback', href: `${baseUrl}/feedback` },
    { name: 'Évaluation', href: `${baseUrl}/evaluations` },
    { name: 'Configuration', href: `${baseUrl}/settings` },
  ];

  const isModern = user?.theme === 'modern';

  const handleToggleTheme = async () => {
    const newTheme = isModern ? 'classic' : 'modern';
    try {
      // Optimistic update
      if (user) {
        setUser({ ...user, theme: newTheme });
      }
      setTheme(newTheme); // Sync store just in case

      await api.put('/api/auth/profile', { theme: newTheme });
    } catch (err) {
      console.error('Error updating theme', err);
      // Revert if error? (Optional, but keeping simple for now)
    }
  };

  return (
    <div className={`bg-white border-b border-gray-100 px-8 pt-6 pb-0 sticky top-0 z-40 transition-all duration-300 ${isModern ? 'shadow-sm' : 'shadow-none'}`}>
      <div className="max-w-[1600px] mx-auto">

        {/* Top bar avec Breadcrumbs / Actions / Profil */}
        <div className="flex items-center justify-between mb-2">
          <div className={`flex items-center gap-3 text-xs font-bold uppercase tracking-widest ${isModern ? 'text-gray-400' : 'text-gray-500'}`}>
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <span>/</span>
            <span className={isModern ? 'text-gray-900' : 'text-gray-700'}>Projet</span>
          </div>

          <div className="flex items-center gap-4">

            <button
              onClick={handleToggleTheme}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isModern
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
            >
              <Layout size={14} />
              <span>{isModern ? 'Mode Modern' : 'Mode Classique'}</span>
            </button>
            <div className="h-6 w-px bg-gray-100"></div>
            <NotificationBell />
            <div className="h-6 w-px bg-gray-100"></div>
            <div className={`flex items-center gap-3 border transition-all ${isModern
              ? 'bg-gray-50 pl-4 pr-1 py-1 rounded-2xl border-gray-100'
              : 'bg-white px-3 py-1 rounded-lg border-gray-200 shadow-sm'
              }`}>
              <div className="text-right">
                <p className={`text-xs text-gray-900 leading-none mb-1 ${isModern ? 'font-black' : 'font-bold'}`}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className={`text-[10px] font-bold uppercase tracking-tighter ${isModern ? 'text-blue-600' : 'text-gray-400'}`}>
                  {user?.role === 'admin' ? 'Administrateur' : user?.role === 'instructor' ? 'Enseignant' : 'Étudiant'}
                </p>
              </div>
              <div className={`flex items-center justify-center text-white text-[10px] transition-all ${isModern
                ? 'w-8 h-8 bg-blue-600 rounded-xl font-black shadow-lg shadow-blue-200'
                : 'w-8 h-8 bg-slate-800 rounded-lg font-bold shadow-sm'
                }`}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>
          </div>
        </div>

        {/* Titre & Badges */}
        <div className="flex items-end gap-4 mb-6">
          <h1 className={`text-3xl text-gray-900 tracking-tight leading-none ${isModern ? 'font-black' : 'font-bold underline decoration-blue-500/20 decoration-4 underline-offset-[12px]'}`}>
            {project.title}
          </h1>
          <div className="flex gap-2 mb-1">
            {project.tags?.map(tag => (
              <span key={tag} className={`px-2 py-0.5 text-[10px] uppercase tracking-wider transition-all ${isModern
                ? 'bg-blue-50 text-blue-600 font-black rounded-md'
                : 'bg-white text-gray-700 font-bold border border-gray-200 rounded-sm'
                }`}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar translate-y-px">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  px-6 py-3 text-xs uppercase tracking-widest border-b-2 transition-all whitespace-nowrap
                  ${isModern ? 'font-black rounded-t-[1.2rem]' : 'font-bold rounded-t-md'}
                  ${isActive
                    ? isModern ? 'bg-[#f3f4f6] border-blue-600 text-blue-600' : 'bg-white border-blue-600 text-blue-700 border-x border-t border-b-white translate-y-[2px]'
                    : isModern ? 'bg-transparent border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50' : 'bg-transparent border-transparent text-gray-500 hover:text-blue-700 hover:bg-gray-50'}
                `}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div >
  );
}
