'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/auth';
import { EditCampaignModal } from '@/components/campaigns/EditCampaignModal';
import {
    Calendar,
    FileText,
    Folder,
    Users,
    BarChart3,
    Clock,
    ChevronRight,
    Edit3,
    BookOpen,
    Layers,
    User,
    Flag,
    FileDown,
    Settings,
    TrendingUp
} from 'lucide-react';

export default function CampaignDetailsPage() {
    const params = useParams();
    const id = params.id;

    const [campaign, setCampaign] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleUpdateCampaign = (updatedCampaign: any) => {
        setCampaign(updatedCampaign);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const campaignRes = await api.get(`/api/campaigns/${id}`);
                setCampaign(campaignRes.data.campaign);

                const projectsRes = await api.get(`/api/projects?campaign=${id}`);
                setProjects(projectsRes.data.projects || []);
            } catch (err) {
                console.error("Erreur chargement:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    if (loading) return (
        <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>)}
            </div>
            <div className="h-16 bg-gray-200 rounded-2xl"></div>
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 h-64 bg-gray-200 rounded-2xl"></div>
                <div className="h-64 bg-gray-200 rounded-2xl"></div>
            </div>
        </div>
    );
    if (!campaign) return null;

    // Computed values
    const totalEvalPoints = campaign.evaluationTemplate?.reduce((acc: number, c: any) => acc + Number(c.maxScore), 0) || 0;
    const resourceCount = campaign.resources?.length || 0;

    const now = new Date();
    const endDate = new Date(campaign.endDate);
    const startDate = new Date(campaign.startDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const progressPercent = totalDays > 0 ? Math.min(100, Math.max(0, Math.round(((totalDays - Math.max(0, daysLeft)) / totalDays) * 100))) : 0;

    return (
        <>
            {/* ─── KPI CARDS ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                        <Folder size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Projets</p>
                        <p className="text-2xl font-black text-gray-900">{projects.length}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                    <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${daysLeft > 7 ? 'bg-emerald-50 text-emerald-600' : daysLeft > 0 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-500'}`}>
                        <Clock size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Temps restant</p>
                        <p className="text-2xl font-black text-gray-900">
                            {daysLeft > 0 ? `${daysLeft}j` : daysLeft === 0 ? "Aujourd'hui" : 'Terminée'}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                    <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                        <FileDown size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ressources</p>
                        <p className="text-2xl font-black text-gray-900">{resourceCount}</p>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                        <BarChart3 size={22} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Évaluation</p>
                        <p className="text-2xl font-black text-gray-900">{totalEvalPoints} <span className="text-sm font-bold text-gray-400">pts</span></p>
                    </div>
                </div>
            </div>

            {/* ─── PROGRESS BAR ─── */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Progression temporelle</span>
                    </div>
                    <span className="text-xs font-black text-gray-900">{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${progressPercent >= 100 ? 'bg-emerald-500' : progressPercent > 75 ? 'bg-orange-500' : 'bg-blue-500'}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-[10px] font-bold text-gray-400">
                        {new Date(campaign.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                        {new Date(campaign.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                </div>
            </div>

            {/* ─── MAIN GRID ─── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* ══════ LEFT COLUMN (2/3) ══════ */}
                <div className="xl:col-span-2 space-y-8">

                    {/* ── Grille d'évaluation ── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-black text-gray-900 flex items-center gap-2 text-base">
                                <BarChart3 size={20} className="text-blue-600" />
                                Grille d'évaluation
                            </h3>
                            {totalEvalPoints > 0 && (
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                    {campaign.evaluationTemplate.length} critère{campaign.evaluationTemplate.length > 1 ? 's' : ''} • {totalEvalPoints} pts
                                </span>
                            )}
                        </div>
                        <div className="p-6">
                            {campaign.evaluationTemplate && campaign.evaluationTemplate.length > 0 ? (
                                <div className="space-y-3">
                                    {campaign.evaluationTemplate.map((crit: any, idx: number) => {
                                        const weight = totalEvalPoints > 0 ? Math.round((Number(crit.maxScore) / totalEvalPoints) * 100) : 0;
                                        return (
                                            <div key={idx} className="p-4 bg-gray-50/70 rounded-xl border border-gray-100 hover:border-blue-200 transition-all group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                                                            <span className="font-bold text-gray-900">{crit.name}</span>
                                                        </div>
                                                        {crit.description && (
                                                            <p className="text-xs text-gray-500 mt-1.5 ml-8 leading-relaxed">{crit.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 ml-4">
                                                        <span className="text-xs font-bold text-gray-400">{weight}%</span>
                                                        <span className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-black text-gray-800 shadow-sm">
                                                            {crit.maxScore} pts
                                                        </span>
                                                    </div>
                                                </div>
                                                {crit.subCriteria && crit.subCriteria.length > 0 && (
                                                    <div className="ml-8 mt-3 space-y-1.5">
                                                        {crit.subCriteria.map((sub: any, sIdx: number) => (
                                                            <div key={sIdx} className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg border border-gray-100 text-xs">
                                                                <span className="text-gray-600 font-medium">{sub.name}</span>
                                                                <span className="text-gray-400 font-bold">/ {sub.maxScore}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="mt-3 ml-8">
                                                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${weight}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                                        <BarChart3 size={28} />
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium">Aucun critère d'évaluation défini pour le moment.</p>
                                    <button onClick={() => setIsEditModalOpen(true)} className="mt-3 text-xs text-blue-600 hover:underline font-bold">
                                        Configurer la grille →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Liste des Projets ── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-black text-gray-900 flex items-center gap-2 text-base">
                                <Folder size={20} className="text-blue-600" />
                                Projets rattachés
                                <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{projects.length}</span>
                            </h3>
                        </div>
                        <div>
                            {projects.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {projects.map((proj) => (
                                        <Link key={proj._id} href={`/projects/${proj._id}`} className="p-4 flex items-center justify-between hover:bg-blue-50/30 transition-all group block">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm shadow-blue-200">
                                                    {proj.title.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{proj.title}</h4>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-gray-400 font-bold">Par {proj.owner?.name}</span>
                                                        {proj.members && proj.members.length > 0 && (
                                                            <>
                                                                <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
                                                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                                                    <Users size={10} />
                                                                    {proj.members.length} membre{proj.members.length > 1 ? 's' : ''}
                                                                </span>
                                                            </>
                                                        )}
                                                        {proj.status && (
                                                            <>
                                                                <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
                                                                <span className={`text-[10px] font-bold ${proj.status === 'active' ? 'text-emerald-500' : proj.status === 'completed' ? 'text-blue-500' : 'text-gray-400'}`}>
                                                                    {proj.status === 'active' ? 'Actif' : proj.status === 'completed' ? 'Terminé' : 'Archivé'}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-gray-300">
                                        <Folder size={28} />
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">Aucun projet n'a encore rejoint cette campagne.</p>
                                    <p className="text-xs text-gray-400 mt-1">Les étudiants peuvent rattacher un projet depuis leur espace.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════ RIGHT COLUMN (1/3) ══════ */}
                <div className="space-y-6">

                    {/* ── Responsable(s) ── */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <User size={16} className="text-blue-600" />
                            Équipe pédagogique
                        </h3>
                        <div className="space-y-3">
                            {campaign.manager && (
                                <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/60">
                                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
                                        {campaign.manager.name?.charAt(0)?.toUpperCase() || 'R'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{campaign.manager.name}</p>
                                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Responsable</p>
                                    </div>
                                </div>
                            )}
                            {campaign.coManagers && campaign.coManagers.length > 0 && campaign.coManagers.map((co: any) => (
                                <div key={co._id} className="flex items-center gap-3 p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                                    <div className="w-9 h-9 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">
                                        {co.name?.charAt(0)?.toUpperCase() || 'C'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{co.name}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Co-responsable</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Configuration ── */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Settings size={16} className="text-blue-600" />
                            Configuration
                        </h3>

                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Période</p>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Calendar size={14} className="text-gray-400 shrink-0" />
                                    <span className="font-medium">
                                        {new Date(campaign.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                        {' → '}
                                        {new Date(campaign.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Cible</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                                        {campaign.academicYear}
                                    </span>
                                    <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-bold">
                                        {campaign.targetYear}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                    {campaign.targetGroups && campaign.targetGroups.length > 0 ? (
                                        campaign.targetGroups.map((g: string) => (
                                            <span
                                                key={g}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-gray-600 border border-gray-200"
                                            >
                                                Gr. {g}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            {campaign.targetYear ? "Toute la promo" : "Non ciblée"}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {campaign.tags && campaign.tags.length > 0 && (
                                <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Tags</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {campaign.tags.map((tag: string) => (
                                            <span key={tag} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Quick Links ── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100">
                            <h3 className="font-black text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Layers size={16} className="text-blue-600" />
                                Accès rapide
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {[
                                {
                                    label: 'Ressources pédagogiques',
                                    desc: `${resourceCount} document${resourceCount > 1 ? 's' : ''}`,
                                    href: `/campaigns/${id}/resources`,
                                    icon: <FileDown size={18} />,
                                    color: 'text-purple-600',
                                    bg: 'bg-purple-50'
                                },
                                {
                                    label: 'Jalons & Planning',
                                    desc: 'Échéances de la campagne',
                                    href: `/campaigns/${id}/milestones`,
                                    icon: <Flag size={18} />,
                                    color: 'text-orange-600',
                                    bg: 'bg-orange-50'
                                },
                                {
                                    label: 'Participants',
                                    desc: 'Étudiants de la campagne',
                                    href: `/campaigns/${id}/members`,
                                    icon: <Users size={18} />,
                                    color: 'text-emerald-600',
                                    bg: 'bg-emerald-50'
                                },
                                {
                                    label: 'Paramètres',
                                    desc: 'Modifier la campagne',
                                    href: `/campaigns/${id}/settings`,
                                    icon: <Settings size={18} />,
                                    color: 'text-gray-600',
                                    bg: 'bg-gray-100'
                                },
                            ].map(action => (
                                <Link
                                    key={action.label}
                                    href={action.href}
                                    className="flex items-center justify-between p-4 hover:bg-blue-50/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${action.bg} ${action.color}`}>
                                            {action.icon}
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{action.label}</span>
                                            <p className="text-[10px] text-gray-400 font-medium">{action.desc}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                </Link>
                            ))}
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
        </>
    );
}