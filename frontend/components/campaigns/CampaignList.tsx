'use client';

import { useState } from 'react';
import { Calendar, FileText, MoreVertical, Trash2, Eye, X, Archive, Flag } from 'lucide-react';
import Link from 'next/link';

interface Campaign {
  _id: string;
  title: string;
  status: string;
  academicYear: string;
  startDate: string | Date;
  endDate: string | Date;
  manager?: { name: string };
  evaluationTemplate: any[];
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
      {campaigns.map((campaign) => (
        <div 
          key={campaign._id} 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group"
          onMouseLeave={() => setOpenMenuId(null)} 
        >
          
          {/* Badge Statut */}
          <div className="absolute top-6 right-6">
            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize
              ${campaign.status === 'active' ? 'bg-green-100 text-green-700' : 
                campaign.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'}`}>
              {campaign.status === 'active' ? 'En cours' : campaign.status}
            </span>
          </div>

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
                        onClick={() => {
                            if(confirm('⚠️ Attention : Cette action est irréversible. Voulez-vous supprimer définitivement ?')) {
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
      ))}
    </div>
  );
}