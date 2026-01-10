'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { EditCampaignModal } from '@/components/campaigns/EditCampaignModal'; 
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  FileText, 
  Clock, 
  LayoutTemplate,
  CheckCircle,
  MoreVertical,
  Folder
} from 'lucide-react';

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id; // L'ID récupéré depuis l'URL

  const [campaign, setCampaign] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]); // Pour la liste des projets liés
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleUpdateCampaign = (updatedCampaign: any) => {
    setCampaign(updatedCampaign);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Récupérer les infos de la campagne
        const campaignRes = await api.get(`/api/campaigns/${id}`);
        setCampaign(campaignRes.data.campaign);

        // 2. Récupérer les projets liés à cette campagne
        // (Il faudra s'assurer que ton backend supporte ce filtre, sinon on le rajoutera)
        const projectsRes = await api.get(`/api/projects?campaign=${id}`);
        setProjects(projectsRes.data.projects || []);
      } catch (err) {
        console.error("Erreur chargement:", err);
        // Si 404, retour à la liste
        // router.push('/campaigns'); 
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f3f4f6]">
        <div className="text-gray-500 font-medium">Chargement des détails...</div>
      </div>
    );
  }

  if (!campaign) return null;

  // Vérification de sécurité avant le rendu
  if (!campaign) return null;

  // Sécurisation du calcul de date
  const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
  const now = new Date();
  
  // Si pas de date, on met false/0 par défaut pour éviter le crash/NaN
  const isExpired = endDate ? endDate < now : false;
  
  const daysLeft = endDate 
    ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24)) 
    : 0;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
        <Navbar />

        <div className="flex-1 ml-64 p-8">
          
          {/* --- HEADER --- */}
          <div className="mb-8">
            <Link 
              href="/campaigns" 
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
            >
              <ArrowLeft size={16} className="mr-1" /> Retour aux campagnes
            </Link>

            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{campaign.title}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize
                    ${campaign.status === 'active' ? 'bg-green-100 text-green-700' : 
                      campaign.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'}`}>
                    {campaign.status === 'active' ? 'En cours' : campaign.status}
                  </span>
                </div>
                <p className="text-gray-500 max-w-2xl">{campaign.description || "Aucune description fournie."}</p>
              </div>

              {/* Actions Rapides */}
              <div className="flex gap-2">
                 <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm"
                 >
                    Modifier
                 </button>
                 <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-200">
                    Voir les livrables
                 </button>
              </div>
            </div>
          </div>

          {/* --- STATS GRID --- */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                   <Folder size={24} />
                </div>
                <div>
                   <p className="text-xs text-gray-500 font-medium uppercase">Projets inscrits</p>
                   <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                </div>
             </div>
             
             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                   <Users size={24} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Promo Cible</p>
                    <p className="text-xl font-bold text-gray-900">
                        {campaign.targetYear || 'Non défini'} {/* Ajoute ce fallback */}
                    </p>
                </div>
             </div>

             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                   <Clock size={24} />
                </div>
                <div>
                   <p className="text-xs text-gray-500 font-medium uppercase">Temps restant</p>
                   <p className="text-xl font-bold text-gray-900">
                      {isExpired ? "Terminé" : `${daysLeft} jours`}
                   </p>
                </div>
             </div>

             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                   <CheckCircle size={24} />
                </div>
                <div>
                   <p className="text-xs text-gray-500 font-medium uppercase">Critères</p>
                   <p className="text-2xl font-bold text-gray-900">{campaign.evaluationTemplate?.length || 0}</p>
                </div>
             </div>
          </div>

          {/* --- CONTENU PRINCIPAL --- */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* COLONNE GAUCHE (2/3) : Grille d'évaluation & Projets */}
            <div className="xl:col-span-2 space-y-8">
               
               {/* 1. Grille d'évaluation */}
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                     <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FileText size={20} className="text-gray-400" /> 
                        Grille d'évaluation configurée
                     </h3>
                  </div>
                  <div className="p-6">
                     {campaign.evaluationTemplate && campaign.evaluationTemplate.length > 0 ? (
                        <div className="space-y-4">
                           {campaign.evaluationTemplate.map((crit: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                 <div>
                                    <span className="font-medium text-gray-900">{crit.name}</span>
                                    {crit.description && <p className="text-xs text-gray-500 mt-1">{crit.description}</p>}
                                 </div>
                                 <span className="bg-white px-3 py-1 rounded border border-gray-200 text-sm font-bold text-gray-700">
                                    / {crit.maxScore} pts
                                 </span>
                              </div>
                           ))}
                           <div className="flex justify-end pt-4 border-t border-gray-100">
                              <p className="text-sm font-medium text-gray-600">Total : <span className="text-gray-900 font-bold">{campaign.evaluationTemplate.reduce((acc: any, curr: any) => acc + Number(curr.maxScore), 0)} points</span></p>
                           </div>
                        </div>
                     ) : (
                        <p className="text-gray-500 italic">Aucun critère défini.</p>
                     )}
                  </div>
               </div>

               {/* 2. Liste des Projets */}
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                     <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Folder size={20} className="text-gray-400" /> 
                        Projets inscrits ({projects.length})
                     </h3>
                  </div>
                  <div>
                    {projects.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {projects.map((proj) => (
                                <div key={proj._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                                            {proj.title.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{proj.title}</h4>
                                            <p className="text-xs text-gray-500">Par {proj.owner?.name}</p>
                                        </div>
                                    </div>
                                    <Link href={`/projects/${proj._id}`} className="text-sm text-blue-600 font-medium hover:underline">
                                        Voir projet
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            Aucun projet n'a encore rejoint cette campagne.
                        </div>
                    )}
                  </div>
               </div>

            </div>

            {/* COLONNE DROITE (1/3) : Infos Configuration */}
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4">Configuration</h3>
                  
                  <div className="space-y-4">
                     <div>
                        <p className="text-xs text-gray-400 font-medium uppercase mb-1">Période</p>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                           <Calendar size={16} className="text-gray-400" />
                           Du {new Date(campaign.startDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                           <ArrowLeft size={16} className="text-gray-400 rotate-180" />
                           Au {new Date(campaign.endDate).toLocaleDateString()}
                        </div>
                     </div>

                     <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 font-medium uppercase mb-2">Cible</p>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-sm font-semibold">
                                {campaign.academicYear}
                            </span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm font-semibold">
                                {campaign.targetYear}
                            </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                            {campaign.targetGroups && campaign.targetGroups.length > 0 ? (
                                campaign.targetGroups.map((g: string) => (
                                    <span 
                                        key={g} 
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                                    >
                                        Gr. {g}
                                    </span>
                                ))
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                    {campaign.targetYear ? "Toute la promo" : "Aucune cible"}
                                </span>
                            )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

          </div>
        </div>
        {isEditModalOpen && campaign && (
            <EditCampaignModal 
                campaign={campaign}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={handleUpdateCampaign}
            />
        )}
      </div>
    </ProtectedRoute>
  );
}