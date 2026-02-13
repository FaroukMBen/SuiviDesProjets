'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/auth';
import { useAuthStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { ArrowRight, Calendar, Users, LayoutTemplate } from 'lucide-react';

interface Campaign {
  _id: string;
  title: string;
  status: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  manager: { name: string };
  projectCount?: number;
}

export function RecentCampaigns() {
  const { user } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      // On attend que le user soit chargé
      const userId = user?.id || (user as any)?._id;
      if (!userId) return;

      try {
        // On récupère les campagnes du prof
        const response = await api.get(`/api/campaigns?manager=${userId}`);
        // On prend les 3 premières (ou actives)
        setCampaigns(response.data.campaigns.slice(0, 6));
      } catch (err) {
        console.error("Erreur chargement campagnes", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 m-5 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <LayoutTemplate className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-500 mb-4">Vous n'avez aucune campagne active.</p>
        <Link href="/campaigns" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Créer ma première campagne
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-6 space-y-4">
      <div className="flex justify-between items-end px-1 pb-2">
        <div>
          <h2 className="text-lg font-black text-gray-900">Mes Campagnes actives</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-1">Suivi de vos modules</p>
        </div>
        <Link
          href="/campaigns"
          className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest transition-all group"
        >
          Gérer tout
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {campaigns.map((campaign) => (
          <Link key={campaign._id} href={`/campaigns/${campaign._id}`} className="block group">
            <Card className="h-full hover:shadow-md hover:border-purple-200 transition-all cursor-pointer relative flex flex-col p-4">

              {/* Badge Statut */}
              <div className="absolute top-4 right-4">
                <span className={`w-2 h-2 rounded-full block ${campaign.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
              </div>

              <div className="mb-4">
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-md mb-3 inline-block">
                  {campaign.academicYear}
                </span>

                <h3 className="font-bold text-gray-900 text-lg group-hover:text-purple-600 transition-colors line-clamp-1">
                  {campaign.title}
                </h3>

                <p className="text-xs text-gray-500 mt-1">
                  Resp. {campaign.manager?.name}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar size={12} />
                  <span>Fin : {new Date(campaign.endDate).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Users size={12} />
                  <span>{campaign.projectCount || 0} Projets</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}