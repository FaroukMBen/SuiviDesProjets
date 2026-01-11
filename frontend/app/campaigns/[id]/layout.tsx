'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  Flag, 
  Settings, 
  Users, 
  Calendar,
  Clock,
  CheckCircle,
  FolderKanban
} from 'lucide-react';

interface Campaign {
  _id: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  academicYear: string;
  targetYear: string;
}

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      api.get(`/api/campaigns/${campaignId}`)
        .then(res => setCampaign(res.data.campaign))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [campaignId]);

  const tabs = [
    { href: `/campaigns/${campaignId}`, label: 'Aperçu', icon: LayoutDashboard, exact: true },
    { href: `/campaigns/${campaignId}/projects`, label: 'Projets', icon: FolderKanban },
    { href: `/campaigns/${campaignId}/milestones`, label: 'Objectifs & Jalons', icon: Flag },
    { href: `/campaigns/${campaignId}/members`, label: 'Participants', icon: Users },
    { href: `/campaigns/${campaignId}/settings`, label: 'Paramètres', icon: Settings },
  ];

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Chargement...</div>;
  if (!campaign) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Campagne introuvable</div>;

  const endDate = new Date(campaign.endDate);
  const now = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
  const isExpired = daysLeft < 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f8f9fc] font-sans pb-20">
        <Navbar />

        <div className="ml-64 max-w-7xl mx-auto px-6 py-8">
            {/* Fil d'ariane / Retour */}
            <Link 
              href="/campaigns" 
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft size={16} className="mr-1" /> Retour aux campagnes
            </Link>

            {/* --- HEADER CAMPAGNE --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{campaign.title}</h1>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                ${campaign.status === 'active' ? 'bg-green-100 text-green-700' : 
                                  campaign.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'}`}>
                                {campaign.status === 'active' ? 'En cours' : campaign.status}
                             </span>
                        </div>
                        <p className="text-gray-500 max-w-3xl leading-relaxed">
                            {campaign.description || "Aucune description pour cette campagne."}
                        </p>
                    </div>
                </div>

                {/* KPI Rapides */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Début</p>
                            <p className="text-sm font-semibold text-gray-900">{new Date(campaign.startDate).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Fin / Restant</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {isExpired ? "Terminée" : `${daysLeft} jours`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Cible</p>
                            <p className="text-sm font-semibold text-gray-900">
                                {campaign.academicYear} - {campaign.targetYear}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- NAVIGATION ONGLETS --- */}
            <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-200">
                {tabs.map((tab) => {
                    const isActive = tab.exact 
                        ? pathname === tab.href 
                        : pathname.startsWith(tab.href);
                    
                    return (
                        <Link 
                            key={tab.href}
                            href={tab.href}
                            className={`flex items-center gap-2 px-4 py-3 rounded-t-lg font-medium text-sm transition-all relative
                                ${isActive 
                                    ? 'text-blue-600 bg-white border-x border-t border-gray-200 -mb-px z-10' 
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
                                }`
                            }
                        >
                            <tab.icon size={18} />
                            {tab.label}
                            {/* Petit indicateur visuel si actif pour masquer la bordure du bas */}
                            {isActive && <div className="absolute bottom-[-1px] left-0 right-0 h-1 bg-white"></div>}
                        </Link>
                    )
                })}
            </div>

            {/* --- CONTENU DE LA PAGE --- */}
            <main className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {children}
            </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
