'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import { Search, Filter, Eye, FileText, X, CheckCircle, ExternalLink, Calendar, Users, FolderOpen } from 'lucide-react';
import { EvaluationGrid } from '@/components/EvaluationGrid';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';

interface Project {
    _id: string;
    title: string;
    description: string;
    campaignId?: { _id: string; title: string } | string;
    campaign?: { title: string };
    members: { _id: string; name: string; email: string }[];
    status: string;
    updatedAt: string;
}

interface Campaign {
    _id: string;
    title: string;
}

export default function ValidationsPage() {
    const { user } = useAuthStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

    // Modals
    const [previewProject, setPreviewProject] = useState<Project | null>(null);
    const [gradingProject, setGradingProject] = useState<Project | null>(null);

    // Initial Data Fetch
    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await api.get('/api/campaigns');
                setCampaigns(res.data.campaigns || []);
            } catch (err) {
                console.error("Error fetching campaigns", err);
            }
        };
        fetchCampaigns();
    }, []);

    // Fetch Projects with Filters
    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (searchQuery) params.append('search', searchQuery);
                if (selectedCampaign !== 'all') params.append('campaign', selectedCampaign);

                // We want all projects for instructors (handled by backend controller update)
                const res = await api.get(`/api/projects?${params.toString()}`);
                setProjects(res.data.projects || []);
            } catch (err) {
                console.error("Error fetching projects", err);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchProjects, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, selectedCampaign]);

    // Determine Campaign Name helper
    const getCampaignName = (project: Project) => {
        if (project.campaignId && typeof project.campaignId === 'object' && 'title' in project.campaignId) {
            return project.campaignId.title;
        }
        // Fallback if population differs
        return "Campagne inconnue";
    };

    return (
        <ProtectedRoute allowedRoles={['instructor', 'admin']}>
            <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
                <Navbar />

                <div className="flex-1 ml-64 p-8">
                    <header className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <CheckCircle className="text-blue-600" />
                            Validations & Notations
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Consultez, filtrez et notez les projets étudiants de vos campagnes.
                        </p>
                    </header>

                    {/* FILTERS BAR */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center">

                        {/* Search */}
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher un projet, un étudiant..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                            />
                        </div>

                        {/* Campaign Filter */}
                        <div className="relative min-w-[250px] w-full md:w-auto">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={selectedCampaign}
                                onChange={(e) => setSelectedCampaign(e.target.value)}
                                className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition bg-white appearance-none cursor-pointer text-gray-700 font-medium"
                            >
                                <option value="all">Toutes les campagnes</option>
                                {campaigns.map(c => (
                                    <option key={c._id} value={c._id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* PROJECTS LIST */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <div className="p-4 bg-gray-50 rounded-full mb-3 text-gray-400">
                                <FolderOpen size={32} />
                            </div>
                            <p className="text-gray-500 font-medium">Aucun projet trouvé correspondant à vos critères.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map(project => (
                                <div key={project._id} className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide truncate max-w-[150px]">
                                                {getCampaignName(project)}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${project.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {project.status === 'completed' ? 'Terminé' : 'En cours'}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors" title={project.title}>
                                            {project.title}
                                        </h3>

                                        <p className="text-sm text-gray-500 line-clamp-3 mb-4 min-h-[60px]">
                                            {project.description || "Aucune description fournie."}
                                        </p>

                                        <div className="flex items-center gap-2 mb-4 text-xs text-gray-500 font-medium">
                                            <Users size={14} />
                                            <span>{project.members?.length || 0} membre(s)</span>
                                        </div>

                                        <div className="flex -space-x-2 overflow-hidden mb-2 pl-1">
                                            {project.members?.slice(0, 4).map((m, idx) => (
                                                <div key={idx} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600 uppercase shadow-sm" title={m.name}>
                                                    {m.name.charAt(0)}
                                                </div>
                                            ))}
                                            {project.members?.length > 4 && (
                                                <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-xs text-gray-500 font-medium shadow-sm">
                                                    +{project.members.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex gap-3 rounded-b-xl">
                                        <button
                                            onClick={() => setPreviewProject(project)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition shadow-sm"
                                        >
                                            <Eye size={16} /> Aperçu
                                        </button>
                                        <button
                                            onClick={() => setGradingProject(project)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-200"
                                        >
                                            <FileText size={16} /> Noter
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* PREVIEW MODAL */}
                    {previewProject && (
                        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">

                                {/* Modal Header */}
                                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{previewProject.title}</h2>
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide">
                                                {getCampaignName(previewProject)}
                                            </span>
                                            <span>•</span>
                                            <Calendar size={14} />
                                            Mis à jour le {new Date(previewProject.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setPreviewProject(null)}
                                        className="p-2 bg-white border border-gray-200 rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition text-gray-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Modal Content */}
                                <div className="p-6 overflow-y-auto">
                                    <div className="space-y-8">

                                        {/* Description */}
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Description du projet</h3>
                                            <div className="bg-gray-50 p-4 rounded-xl text-gray-700 text-sm leading-relaxed border border-gray-100">
                                                {previewProject.description || "Aucune description fournie pour ce projet."}
                                            </div>
                                        </div>

                                        {/* Members */}
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Membres de l'équipe ({previewProject.members?.length || 0})</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {previewProject.members?.map(m => (
                                                    <div key={m._id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold uppercase shadow-md shadow-blue-200">
                                                            {m.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-gray-900 text-sm truncate">{m.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{m.email}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                    <Link
                                        href={`/projects/${previewProject._id}`}
                                        target="_blank"
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 hover:text-blue-600 hover:border-blue-200 transition font-medium text-sm shadow-sm"
                                    >
                                        <ExternalLink size={18} />
                                        Voir la page complète
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setGradingProject(previewProject);
                                            setPreviewProject(null);
                                        }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold text-sm shadow-lg shadow-blue-200"
                                    >
                                        <FileText size={18} />
                                        Noter ce projet
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GRADING MODAL */}
                    {gradingProject && (
                        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 relative">

                                {/* Header */}
                                <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md z-10">
                                    <div>
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <FileText className="text-blue-400" />
                                            Évaluation : <span className="text-blue-100">{gradingProject.title}</span>
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {gradingProject.members?.length} étudiants • {getCampaignName(gradingProject)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setGradingProject(null)}
                                        className="p-2 bg-gray-800 rounded-lg hover:bg-red-500 transition text-gray-400 hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                                    <div className="max-w-4xl mx-auto">
                                        {/* Reuse EvaluationGrid component in FULL mode */}
                                        <EvaluationGrid
                                            projectId={gradingProject._id}
                                            userRole="instructor"
                                            displayMode="full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </ProtectedRoute>
    );
}
