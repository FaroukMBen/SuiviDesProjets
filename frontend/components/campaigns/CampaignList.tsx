'use client';

import { useState } from 'react';
import { Calendar, FileText, MoreVertical, Trash2, Eye, X, Archive, Flag } from 'lucide-react';
import Link from 'next/link';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface Campaign {
  _id: string;
  title: string;
  status: string;
  academicYear: string;
  startDate: string | Date;
  endDate: string | Date;
  manager?: { name: string };
  evaluationTemplate: any[];
  projectCount?: number;
  banner?: string;
}

interface CampaignListProps {
  campaigns: Campaign[];
  loading: boolean;
  isInstructor: boolean;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

export function CampaignList({ campaigns, loading, isInstructor, onDelete, onArchive }: CampaignListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const { confirm } = useConfirm();


  if (loading) {
    return <div className="text-center py-20 text-gray-500">Chargement des campagnes...</div>;
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500">Aucune campagne trouvée.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
      {campaigns.map((campaign) => {
        const bannerUrl = campaign.banner || "https://iut.lukamaret.com/img/Lyon-1-Claude-Bernard.png";
        
        return (
        <div
          key={campaign._id}
          className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group flex flex-col overflow-hidden"
          onMouseLeave={() => setOpenMenuId(null)}
        >
          {/* Bannière */}
          <div className="h-32 w-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gray-900/10 group-hover:bg-transparent transition-all duration-500 z-10"></div>
            <img 
              src={bannerUrl} 
              alt="Campaign banner" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            {/* Badge Statut déplacé sur l'image pour un look plus moderne */}
            <div className="absolute top-4 right-4 z-20">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border
                ${campaign.status === 'active' ? 'bg-green-500/90 text-white border-green-400' :
                  campaign.status === 'draft' ? 'bg-gray-500/90 text-white border-gray-400' : 'bg-red-500/90 text-white border-red-400'}`}>
                {campaign.status === 'active' ? 'En cours' : campaign.status}
              </span>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col">
            {/* En-tête */}
            <div className="mb-4">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {campaign.academicYear}
              </span>
              <h3 className="text-lg font-bold text-gray-900 mt-2 line-clamp-1" title={campaign.title}>
                {campaign.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                Resp. {campaign.manager?.name || 'Inconnu'}
              </p>
            </div>

          {/* Infos Dates & Critères */}
          <div className="space-y-2 mt-4 pt-4 border-t border-gray-50 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span>
                Du {new Date(campaign.startDate).toLocaleDateString()} au {new Date(campaign.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-gray-400" />
              <span>{campaign.evaluationTemplate?.length || 0} Critères d'évaluation</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs font-semibold">
                {campaign.projectCount || 0} Projets inscrits
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-2 relative">
            <Link
              href={`/campaigns/${campaign._id}`}
              className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              Voir détails
            </Link>

            {/* Bouton Menu (Prof uniquement) */}
            {isInstructor && (
              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === campaign._id ? null : campaign._id)}
                  className={`p-2 rounded-lg transition ${openMenuId === campaign._id ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                  {openMenuId === campaign._id ? <X size={20} /> : <MoreVertical size={20} />}
                </button>

                {/* --- MENU DÉROULANT --- */}
                {openMenuId === campaign._id && (
                  <div className="absolute right-0 bottom-12 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1 space-y-1">

                      {/* Option 0 : OBJECTIFS (Important) */}
                      <Link
                        href={`/campaigns/${campaign._id}/milestones`}
                        onClick={() => setOpenMenuId(null)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Flag size={16} className="text-blue-500" />
                        Objectifs & Jalons
                      </Link>

                      {/* Option 1: ARCHIVER */}
                      {campaign.status !== 'archived' && (
                        <button
                          onClick={() => {
                            onArchive(campaign._id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Archive size={16} className="text-orange-500" />
                          Archiver
                        </button>
                      )}

                      {/* Option 2: SUPPRIMER */}
                      <button
                        onClick={async () => {
                          if (await confirm({ title: "Suppression définitive", message: "⚠️ Attention : Cette action est irréversible. Voulez-vous supprimer définitivement cette campagne ?", type: "danger" })) {
                            onDelete(campaign._id);
                            setOpenMenuId(null);
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} />
                        Supprimer définitivement
                      </button>

                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      );})}
    </div>
  );
}