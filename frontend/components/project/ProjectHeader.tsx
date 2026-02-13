'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/Badge'; // Le composant qu'on a créé au début

import { useAuthStore } from '@/lib/store';
import { NotificationBell } from '@/components/NotificationBell';

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
  const { user } = useAuthStore();
  const baseUrl = `/projects/${project._id}`;

  const tabs = [
    { name: 'Aperçu', href: baseUrl, exact: true },
    { name: 'Tâches (Kanban)', href: `${baseUrl}/kanban` },
    { name: 'Objectifs & Jalons', href: `${baseUrl}/milestones` },
    { name: 'Git', href: `${baseUrl}/commits` },
    { name: 'Feedback', href: `${baseUrl}/feedback` },
    { name: 'Évaluation', href: `${baseUrl}/evaluations` },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-8 pt-8 pb-0">
      <div className="max-w-[1600px] mx-auto">

        {/* Ligne 1 : Badges & Infos + User Profile */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {project.tags?.[0] ? (
              <Badge variant="blue">{project.tags[0]}</Badge>
            ) : (
              <Badge variant="blue">Projet</Badge>
            )}
            <span className="text-sm text-gray-500 font-medium">
              Prof: <span className="text-gray-900">{project.owner?.name}</span>
            </span>
            <Link href={`${baseUrl}/commits`} className="text-sm text-blue-600 hover:underline font-medium ml-2">
              Git
            </Link>
          </div>

          {/* User Profile Section */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">
                {user ? `${user.firstName} ${user.lastName || user.name}` : 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Administrateur' : user?.role || 'Étudiant'}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm">
              {user?.firstName ? user.firstName[0] : (user?.name ? user.name[0] : 'U')}
            </div>
          </div>
        </div>

        {/* Ligne 2 : Titre */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{project.title}</h1>

        {/* Ligne 3 : Navigation (Tabs) */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`
                  px-5 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all whitespace-nowrap
                  ${isActive
                    ? 'bg-gray-100 border-gray-900 text-gray-900'
                    : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                `}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}