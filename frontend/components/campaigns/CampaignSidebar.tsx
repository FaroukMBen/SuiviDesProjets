'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, Flag, Settings, ArrowLeft } from 'lucide-react';

interface CampaignSidebarProps {
  campaignId: string;
}

export function CampaignSidebar({ campaignId }: CampaignSidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: `/campaigns/${campaignId}`, label: 'Vue d\'ensemble', icon: LayoutDashboard, exact: true },
    { href: `/campaigns/${campaignId}/projects`, label: 'Projets suivis', icon: FolderKanban },
    { href: `/campaigns/${campaignId}/milestones`, label: 'Objectifs & Jalons', icon: Flag },
    { href: `/campaigns/${campaignId}/settings`, label: 'Configuration', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col fixed left-0 top-0 bottom-0 z-30 pt-16">
      <div className="p-4">
        <Link href="/campaigns" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition">
          <ArrowLeft size={16} />
          Retour aux campagnes
        </Link>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Gestion Campagne</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const isActive = link.exact 
            ? pathname === link.href 
            : pathname.startsWith(link.href);
            
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
