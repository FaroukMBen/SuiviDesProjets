'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/auth';
import {
    Flag,
    ArrowRight,
    Link as LinkIcon,
    Loader2,
    FileBox,
    Activity,
    PlusCircle,
    HelpCircle,
    FolderOpen,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { ProjectMilestones } from '@/components/ProjectMilestones';

interface Campaign {
    _id: string;
    title: string;
}

export default function ProjectMilestonesPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
    const [isLinking, setIsLinking] = useState(false);
    const [isFaqOpen, setIsFaqOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/api/projects/${projectId}`);
            setProject(res.data.project);

            // Si pas de campagne, on cherche les dispo
            if (!res.data.project.campaignId) {
                const campRes = await api.get('/api/campaigns?scope=student');
                setAvailableCampaigns(campRes.data.campaigns || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) fetchData();
    }, [projectId]);

    const handleLinkCampaign = async (campaignId: string) => {
        if (!await confirm({
            title: "Liaison Campagne",
            message: "Voulez-vous lier ce projet à cette campagne ? Cette action est définitive pour ce projet.",
            type: "warning"
        })) return;

        setIsLinking(true);
        try {
            await api.put(`/api/projects/${projectId}/link-campaign`, { campaignId });
            showToast("Le projet a rejoint la campagne !", "success");
            await fetchData();
        } catch (err) {
            console.error(err);
            showToast("Erreur lors de la liaison", "error");
        } finally {
            setIsLinking(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Initialisation du planning...</p>
        </div>
    );

    if (!project) return <div className="p-8 text-center text-red-500 font-bold">Projet introuvable</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
            {/* Intro Section */}
            <div className="flex items-end justify-between border-b-2 border-gray-100 pb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                            <Flag className="text-blue-600" />
                            Planning & Objectifs
                        </h2>
                        {project.campaignId ? (
                            <span className="mt-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                Lié à : {project.campaignId?.title || 'Campagne Active'}
                            </span>
                        ) : (
                            <span className="mt-1 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                Non rattaché
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Suivez l'avancement des jalons et gérez vos soumissions officielles.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Main Timeline Column */}
                <div className="lg:col-span-2 space-y-8">
                    {!project.campaignId ? (
                        <div className="bg-white rounded-[2.5rem] p-10 border-2 border-dashed border-gray-200 text-center space-y-6">
                            <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                                <LinkIcon size={40} />
                            </div>
                            <div className="max-w-md mx-auto">
                                <h3 className="text-xl font-bold text-gray-900">Projet non rattaché</h3>
                                <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                                    Pour accéder aux jalons pédagogiques et pouvoir soumettre vos livrables officiels, vous devez lier ce projet à une campagne active.
                                </p>
                            </div>

                            {availableCampaigns.length > 0 ? (
                                <div className="grid gap-3 mt-8 max-w-sm mx-auto">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-left ml-2">Campagnes suggérées</p>
                                    {availableCampaigns.map(camp => (
                                        <button
                                            key={camp._id}
                                            onClick={() => handleLinkCampaign(camp._id)}
                                            disabled={isLinking}
                                            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
                                        >
                                            <span className="font-bold text-gray-700 group-hover:text-blue-700">{camp.title}</span>
                                            <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-orange-50 text-orange-700 rounded-2xl border border-orange-100 text-xs font-bold inline-block">
                                    Aucune campagne disponible pour votre promotion.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 space-y-8 text-slate-800">
                            <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                                <div className="flex items-center gap-3">
                                    <Activity className="text-blue-600" size={20} />
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Timeline de Campagne</h3>
                                </div>
                                <button className="text-[10px] font-black text-gray-400 hover:text-blue-600 transition-colors uppercase tracking-widest">
                                    Actualiser
                                </button>
                            </div>

                            <ProjectMilestones
                                campaignId={typeof project.campaignId === 'string' ? project.campaignId : project.campaignId._id}
                                projectId={project._id}
                                projectFiles={project.files}
                            />
                        </div>
                    )}
                </div>

                {/* Right Action Sidebar/Cards */}
                <div className="space-y-6">

                    {/* Deliverables Redirect Card */}
                    <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden group min-h-[220px] flex flex-col justify-between">
                        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0">
                            <FolderOpen size={160} />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-2 relative z-10">Livrables Bonus</h3>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6 relative z-10">
                                Souhaitez-vous ajouter des documents hors jalons, des justificatifs ou des ressources complémentaires ?
                            </p>
                        </div>

                        <Link
                            href={`/projects/${project._id}/liverables`}
                            className="flex items-center justify-between w-full p-4 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-2xl transition-all border border-white/10 relative z-10 group/btn"
                        >
                            <span className="font-bold text-sm uppercase tracking-widest">Voir le gestionnaire</span>
                            <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 border border-gray-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                <FileBox size={18} />
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-tight">Statistiques</h4>
                        </div>
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-medium">Fichiers déposés</span>
                                <span className="font-bold text-gray-900">{project.files?.length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-medium">Jalons validés</span>
                                <span className="font-bold text-blue-600">{project.files?.filter((f: any) => f.milestoneId).length || 0}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* FAQ Section (Collapsible) */}
            <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden transition-all duration-500">
                <button
                    onClick={() => setIsFaqOpen(!isFaqOpen)}
                    className="w-full flex items-center justify-between p-10 hover:bg-gray-50 transition-colors group"
                >
                    <div className="flex items-center gap-4 text-gray-900">
                        <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                            <HelpCircle size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-xl font-black uppercase tracking-tight">Centre d'aide & FAQ</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tout savoir sur les jalons et livrables</p>
                        </div>
                    </div>
                    <div className={`p-3 rounded-xl bg-gray-50 text-gray-400 transition-all ${isFaqOpen ? 'rotate-180 bg-blue-50 text-blue-600' : ''}`}>
                        <ChevronDown size={24} />
                    </div>
                </button>

                {isFaqOpen && (
                    <div className="px-10 pb-10 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-4 duration-300">
                        <div className="col-span-full h-px bg-gray-100 mb-2"></div>
                        {[
                            {
                                q: "Comment lier un fichier à un jalon ?",
                                a: "Rendez-vous dans la section 'Livrables Bonus', cliquez sur 'Nouvel Envoi', et dans le formulaire, sélectionnez le jalon correspondant dans la liste déroulante avant de valider."
                            },
                            {
                                q: "Qu'est-ce qu'un document bonus ?",
                                a: "C'est n'importe quel fichier utile à votre projet qui n'est pas explicitement demandé par la campagne. Ils permettent d'enrichir votre dossier de projet."
                            },
                            {
                                q: "Puis-je modifier un livrable déjà envoyé ?",
                                a: "Oui, vous pouvez supprimer l'ancien fichier et en uploader un nouveau pour le même jalon tant que la date limite n'est pas dépassée."
                            },
                            {
                                q: "Qui peut voir mes livrables ?",
                                a: "Vos coéquipiers, vos enseignants et les administrateurs de la campagne ont accès aux documents déposés."
                            }
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-2 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></div>
                                    {item.q}
                                </h4>
                                <p className="text-sm text-gray-500 leading-relaxed font-medium pl-3.5">
                                    {item.a}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
