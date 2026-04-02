'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { LayoutDashboard, GanttChartSquare, Calendar } from 'lucide-react';

export default function GestionLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const params = useParams();
    const { user } = useAuthStore();

    const projectId = Array.isArray(params.id) ? params.id[0] : params.id;
    const baseUrl = `/projects/${projectId}/gestion`;

    const tabs = [
        { name: 'Kanban', href: `${baseUrl}/kanban`, icon: LayoutDashboard },
        { name: 'Gantt', href: `${baseUrl}/gantt`, icon: GanttChartSquare },
        { name: 'Agenda', href: `${baseUrl}/calendar`, icon: Calendar },
    ];

    const isModern = user?.theme === 'modern';

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className={`flex items-center gap-2 p-1 w-fit rounded-xl border ${isModern ? 'bg-white shadow-sm border-gray-100' : 'bg-gray-100 border-gray-200'}`}>
                {tabs.map((tab) => {
                    const isActive = pathname.startsWith(tab.href);
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${isActive
                                    ? isModern
                                        ? 'bg-blue-50 text-blue-600 font-bold'
                                        : 'bg-white text-gray-800 shadow-sm font-semibold'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 font-medium'
                                }`}
                        >
                            <Icon size={16} className={isActive ? 'text-blue-500' : 'text-gray-400'} />
                            {tab.name}
                        </Link>
                    );
                })}
            </div>

            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
