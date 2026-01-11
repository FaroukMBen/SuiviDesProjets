'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Flag, 
  Calendar, 
  FileText, 
  Code,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Link as LinkIcon,
  Upload,
  Download,
  Trash2,
  Loader2
} from 'lucide-react';
import { useProjectFiles } from '@/hooks/useProjectFiles';

interface FileItem {
    _id: string;
    name: string;
    path: string;
    milestoneId?: string;
    uploadedAt: string;
}

interface Milestone {
  _id: string;
  title: string;
  description: string;
  date: string;
  type: 'livrable' | 'point_de_controle';
}

interface Project {
    _id: string;
    title: string;
    campaignId: string;
    files: FileItem[];
}

interface Campaign {
    _id: string;
    title: string;
}

export default function ProjectMilestonesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [isLinking, setIsLinking] = useState(false);
  const [campaignDetails, setCampaignDetails] = useState<Campaign | null>(null);

  const fetchProjectAndMilestones = async () => {
    try {
      if (!project) setLoading(true); 

      const projRes = await api.get(`/api/projects/${projectId}`);
      const proj = projRes.data.project;
      setProject(proj);

      if (proj.campaignId) {
         try {
             const campRes = await api.get(`/api/campaigns/${proj.campaignId}`);
             setCampaignDetails(campRes.data.campaign);
         } catch(e) { console.error(e); }

         const res = await api.get(`/api/milestones/campaign/${proj.campaignId}`);
         if (res.data.milestones) {
            const sorted = res.data.milestones.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setMilestones(sorted);
         } else {
             setMilestones([]);
         }
      } else {
        setMilestones([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
      fetchProjectAndMilestones();
  };
  const { uploadFile, deleteFile, downloadFile, uploading } = useProjectFiles(projectId, refreshData);

  useEffect(() => {
    if (projectId) {
      fetchProjectAndMilestones();
    }
  }, [projectId]);

  useEffect(() => {
    if (project && !project.campaignId) {
        const fetchAvailable = async () => {
             try {
                 const res = await api.get('/api/campaigns?scope=student');
                 setAvailableCampaigns(res.data.campaigns);
             } catch (err) {
                 console.error("Erreur chargement campagnes", err);
             }
        };
        fetchAvailable();
    }
  }, [project]);

  const handleLinkCampaign = async (campaignId: string) => {
    if (!confirm("Voulez-vous lier ce projet à cette campagne ? Cela ne pourra pas être annulé facilement.")) return;
    setIsLinking(true);
    try {
        await api.put(`/api/projects/${projectId}/link-campaign`, { campaignId });
        await fetchProjectAndMilestones();
        // Optionnel : Notification de succès
    } catch (err) {
        console.error(err);
        alert("Erreur lors de la liaison");
    } finally {
        setIsLinking(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, milestoneId: string) => {
      if (!e.target.files || e.target.files.length === 0) return;
      await uploadFile(e.target.files[0], milestoneId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric', 
      month: 'long', 
      year: 'numeric'
    });
  };

  const getStatusInfo = (dateString: string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const deadline = new Date(dateString);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Passé', color: 'text-gray-400', bg: 'bg-gray-100', icon: CheckCircle };
    if (diffDays <= 3) return { label: 'Urgent', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle };
    return { label: 'À venir', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock };
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50 font-sans">
        <Navbar />
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => router.back()} 
                  className="p-2 rounded-full hover:bg-white hover:shadow-sm transition text-gray-500"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                   <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                       <Flag className="text-blue-600" />
                       Planning du projet
                   </h1>
                   <p className="text-gray-500">
                       Timeline des objectifs pour : <span className="font-semibold">{project?.title || 'Chargement...'}</span>
                   </p>
                </div>
            </div>

            {loading && !project ? (
                <div className="space-y-8 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-4">
                           <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                           <div className="flex-1 h-32 bg-gray-200 rounded-xl"></div>
                        </div>
                    ))}
                </div>
            ) : !project?.campaignId ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 gap-8">
                   <div className="text-center max-w-lg px-4">
                       <Flag size={48} className="mx-auto text-gray-300 mb-4" />
                       <h3 className="text-xl font-bold text-gray-800">Aucune campagne liée</h3>
                       <p className="text-gray-500 mt-2">
                           Ce projet est orphelin (hors campagne). Pour voir les objectifs et être évalué, vous devez le lier à une campagne pédagogique active.
                       </p>
                   </div>

                   {availableCampaigns.length > 0 ? (
                       <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                           <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                               <h4 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
                                   <LinkIcon size={16} /> 
                                   Campagnes disponibles ({availableCampaigns.length})
                               </h4>
                           </div>
                           <div className="divide-y divide-gray-100">
                               {availableCampaigns.map(camp => (
                                   <button
                                       key={camp._id}
                                       onClick={() => handleLinkCampaign(camp._id)}
                                       disabled={isLinking}
                                       className="w-full flex items-center justify-between p-4 hover:bg-blue-50 transition text-left group"
                                   >
                                       <span className="font-medium text-gray-900 group-hover:text-blue-700">{camp.title}</span>
                                       <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                           Rejoindre
                                       </span>
                                   </button>
                               ))}
                           </div>
                       </div>
                   ) : (
                       <div className="p-4 bg-orange-50 text-orange-700 rounded-xl border border-orange-100 text-sm">
                           Aucune campagne ne correspond à votre profil (Année/Groupe) pour le moment.
                       </div>
                   )}
               </div>
            ) : milestones.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                    <Flag size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-800">Aucun jalon défini</h3>
                    <p className="text-gray-500">
                        La campagne <span className="font-bold text-gray-700">"{campaignDetails?.title || 'Chargement...'}"</span> n'a pas encore d'étapes définies.
                    </p>
                </div>
            ) : (
                <div className="relative border-l-4 border-blue-100 ml-8 py-4 space-y-12">
                    {milestones.map((milestone) => {
                        const status = getStatusInfo(milestone.date);
                        // On cherche s'il y a un fichier lié à ce jalon
                        const linkedFile = project?.files?.find(f => f.milestoneId === milestone._id);

                        return (
                            <div key={milestone._id} className="relative pl-12 group">
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[14px] top-6 w-7 h-7 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 
                                    ${status.label === 'Passé' ? 'bg-gray-400' : 'bg-blue-600'}`
                                }>
                                    {status.label === 'Passé' && <CheckCircle size={12} className="text-white" />}
                                </div>

                                <div className={`bg-white rounded-2xl shadow-sm border p-6 transition hover:shadow-md
                                    ${status.label === 'Passé' ? 'border-gray-100 opacity-80' : 'border-blue-50'}
                                `}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${milestone.type === 'livrable' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {milestone.type === 'livrable' ? <FileText size={20} /> : <Code size={20} />}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{milestone.title}</h3>
                                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                                    <span>{milestone.type.replace('_', ' ')}</span>
                                                    <span>•</span>
                                                    <span className={status.color}>{status.label}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 ${status.bg} ${status.color}`}>
                                            <Calendar size={16} />
                                            {formatDate(milestone.date)}
                                        </div>
                                    </div>

                                    <p className="text-gray-600 leading-relaxed mb-4">
                                        {milestone.description}
                                    </p>

                                    {/* ZONE DE LIVRABLE */}
                                    {milestone.type === 'livrable' && (
                                        <div className="mt-6 pt-4 border-t border-gray-50">
                                            {linkedFile ? (
                                                <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100 text-green-700">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="p-1.5 bg-green-200 rounded">
                                                            <FileText size={16} className="text-green-800" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold truncate">{linkedFile.name}</p>
                                                            <p className="text-xs opacity-80">
                                                                Déposé le {new Date(linkedFile.uploadedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => downloadFile(linkedFile.path, linkedFile.name)}
                                                            className="p-1.5 text-green-600 hover:bg-green-100 rounded transition"
                                                            title="Télécharger"
                                                        >
                                                            <Download size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteFile(linkedFile._id)}
                                                            className="p-1.5 text-green-600 hover:text-red-500 hover:bg-red-50 rounded transition"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label className={`
                                                    flex items-center justify-center gap-2 w-full p-3 rounded-lg border-2 border-dashed border-gray-200 
                                                    text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer font-medium text-sm
                                                    ${uploading ? 'opacity-50 cursor-wait' : ''}
                                                `}>
                                                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                                    <span>Déposer mon livrable</span>
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        onChange={(e) => handleFileUpload(e, milestone._id)}
                                                        disabled={uploading}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
