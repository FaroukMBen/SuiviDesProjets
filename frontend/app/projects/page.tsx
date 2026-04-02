"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import api from '@/lib/auth';
import { Folder, Plus, ChevronRight, ChevronLeft, Calendar, CheckCircle2, Search, LayoutList, LayoutGrid, Grid3X3 } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useAuthStore, useThemeStore } from '@/lib/store';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';

interface Project {
    _id: string;
    title: string;
    description: string;
    status: string;
    deadline: string;
    tags: string[];
    members: { _id: string; name?: string; firstName?: string; lastName?: string }[];
    banner?: string;
    campaignId?: { _id: string; title: string; banner?: string };
}

export default function ProjectsPage() {
    const { user } = useAuthStore();
    // const { theme } = useThemeStore();
    const isModern = user?.theme === 'modern';
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Filtres
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [filterCampaigns, setFilterCampaigns] = useState<string[]>([]);
    const [filterStatuses, setFilterStatuses] = useState<string[]>([]);

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(6);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProjects, setTotalProjects] = useState(0);
    const [cols, setCols] = useState(2);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            let url = `/api/projects?page=${page}&limit=${limit}`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (filterStatuses.length > 0) url += `&status=${filterStatuses.join(',')}`;
            if (filterCampaigns.length > 0) url += `&campaign=${filterCampaigns.join(',')}`;

            const response = await api.get(url);
            setProjects(response.data.projects);
            setTotalPages(response.data.pagination?.totalPages || 1);
            setTotalProjects(response.data.pagination?.total || 0);
        } catch (err) {
            setError('Impossible de charger les projets');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await api.get('/api/campaigns?scope=student');
            setCampaigns(res.data.campaigns);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [page, limit, searchTerm, filterStatuses, filterCampaigns]);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const getMemberName = (member: any) => {
        if (member.firstName || member.lastName) {
            return `${member.firstName || ''} ${member.lastName || ''}`.trim();
        }
        return member.name || 'U';
    };

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-gray-50">
                <Navbar />

                <main className="flex-1 ml-64 p-8 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col gap-6 mb-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className={`${isModern ? 'text-4xl font-black tracking-tight' : 'text-2xl font-bold'} text-gray-900 flex items-center gap-3`}>
                                        Mes Projets
                                        <span className={`bg-gray-100 text-gray-600 ${isModern ? 'text-xs font-black uppercase tracking-wider' : 'text-sm font-medium'} px-2.5 py-0.5 rounded-full`}>
                                            {totalProjects} {totalProjects > 1 ? 'projets' : 'projet'}
                                        </span>
                                    </h1>
                                    <p className="text-gray-500 mt-1">Gérez vos collaborations et jalons.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <NotificationBell />
                                    <Link
                                        href="/projects/new"
                                        className={`flex items-center gap-2 px-4 py-2 ${isModern ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25 rounded-xl font-black' : 'bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700'} text-white transition-all`}
                                    >
                                        <Plus size={20} />
                                        <span>Nouveau Projet</span>
                                    </Link>
                                </div>
                            </div>


                            {/* Search & Multi-Filters */}
                            <div className="flex flex-col gap-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Rechercher par titre ou tag..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                        className={`w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none transition-all pl-11 ${isModern ? 'rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm' : 'rounded-lg focus:border-blue-600'}`}
                                    />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 relative z-20 pb-1">
                                    <div className="flex flex-wrap gap-3">
                                        <MultiSelectDropdown
                                            label="Campagnes"
                                            options={campaigns.map(c => ({ value: c._id, label: c.title }))}
                                            selectedValues={filterCampaigns}
                                            onChange={(vals) => { setFilterCampaigns(vals); setPage(1); }}
                                            placeholder="Toutes les campagnes"
                                            isModern={isModern}
                                        />
                                        <MultiSelectDropdown
                                            label="Statuts"
                                            options={[
                                                { value: 'active', label: 'Actif' },
                                                { value: 'in_progress', label: 'En cours' },
                                                { value: 'completed', label: 'Terminé' },
                                                { value: 'waiting', label: 'En attente' }
                                            ]}
                                            selectedValues={filterStatuses}
                                            onChange={(vals) => { setFilterStatuses(vals); setPage(1); }}
                                            placeholder="Tous les statuts"
                                            isModern={isModern}
                                        />
                                    </div>

                                    <div className={`hidden md:flex items-center gap-1 p-1 bg-white border border-gray-100 ${isModern ? 'rounded-xl' : 'rounded-lg shadow-sm'}`}>
                                        {[
                                            { num: 1, icon: LayoutList, label: '1 Colonne' },
                                            { num: 2, icon: LayoutGrid, label: '2 Colonnes' },
                                            { num: 3, icon: Grid3X3, label: '3 Colonnes' }
                                        ].map(({ num, icon: Icon, label }) => (
                                            <button
                                                key={num}
                                                onClick={() => setCols(num)}
                                                className={`p-2 transition-all group relative ${cols === num 
                                                    ? 'bg-blue-600 text-white shadow-md rounded-lg' 
                                                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg'}`}
                                                title={label}
                                            >
                                                <Icon size={18} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`${cols === 1 ? 'max-w-4xl mx-auto' : 'max-w-6xl'} transition-all duration-700 ease-in-out`}>
                            {loading ? (
                                <div className={`grid grid-cols-1 ${cols === 2 ? 'md:grid-cols-2' : cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6`}>
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-gray-100 shadow-sm"></div>
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                                    {error}
                                </div>
                            ) : projects.length === 0 ? (
                                <div className={`text-center py-12 bg-white ${isModern ? 'rounded-2xl border-gray-100 shadow-xl shadow-blue-500/5' : 'rounded-lg border-gray-200 shadow-sm'} border`}>
                                    <Folder size={48} className="mx-auto text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">Aucun projet trouvé</h3>
                                    <p className="text-gray-500 mt-2 mb-6">
                                        {searchTerm ? "Aucun projet ne correspond à votre recherche sur cette page." : "Vous n'avez pas encore de projets."}
                                    </p>
                                    {!searchTerm && (
                                        <Link
                                            href="/projects/new"
                                            className={`inline-flex items-center gap-2 px-4 py-2 ${isModern ? 'bg-blue-600 rounded-xl font-bold font-sans' : 'bg-blue-600 rounded-lg'} text-white hover:bg-blue-700 transition-colors`}
                                        >
                                            <Plus size={20} />
                                            <span>Créer mon premier projet</span>
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className={`grid grid-cols-1 ${cols === 2 ? 'md:grid-cols-2' : cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6`}>
                                        {projects.map((project) => {
                                            const bannerUrl = project.campaignId?.banner || project.banner || "https://iut.lukamaret.com/img/Lyon-1-Claude-Bernard.png";
                                            
                                            return (
                                            <Link
                                                key={project._id}
                                                href={`/projects/${project._id}`}
                                                className={isModern
                                                    ? "group relative bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] hover:border-blue-200 transition-all duration-500 ease-in-out transform hover:-translate-y-1 block overflow-hidden"
                                                    : "group bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all block overflow-hidden"
                                                }
                                            >
                                                {isModern && <div className="absolute top-0 left-0 w-2 h-full bg-transparent group-hover:bg-blue-600 transition-all duration-300 z-10"></div>}

                                                <div className="h-28 sm:h-36 w-full overflow-hidden relative">
                                                    <div className="absolute inset-0 bg-gray-900/10 group-hover:bg-transparent transition-all duration-500 z-10"></div>
                                                    <img 
                                                        src={bannerUrl} 
                                                        alt="Project banner" 
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                                    />
                                                </div>

                                                <div className={isModern ? "p-7" : "p-5"}>
                                                    <div className="flex flex-col gap-4 md:gap-6">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-4 md:gap-5 min-w-0">
                                                                <div className={isModern
                                                                    ? "p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner group-hover:shadow-blue-500/25 group-hover:rotate-6"
                                                                    : "p-3 bg-gray-50 text-gray-400 rounded-lg group-hover:text-blue-500 transition-colors"
                                                                }>
                                                                    <Folder size={isModern ? 28 : 24} strokeWidth={isModern ? 2.5 : 2} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h3 className={isModern
                                                                        ? "text-xl font-black text-gray-900 group-hover:text-blue-700 transition-colors tracking-tight truncate"
                                                                        : "text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate"
                                                                    }>
                                                                        {project.title}
                                                                    </h3>
                                                                    <p className="text-gray-500 text-sm line-clamp-2 mt-1 leading-relaxed max-w-xl font-medium">
                                                                        {project.description || "Un espace collaboratif pour relever de nouveaux défis techniques."}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 ${isModern ? 'bg-gray-50 rounded-xl border-gray-100 group-hover:bg-blue-50 group-hover:border-blue-100' : 'bg-white rounded-lg border-gray-200 group-hover:border-blue-200'} border transition-colors`}>
                                                                <ChevronRight className={`text-gray-400 ${isModern ? 'group-hover:text-blue-600' : ''}`} size={16} strokeWidth={3} />
                                                            </div>
                                                        </div>

                                                        <div className={`flex flex-wrap items-center justify-between gap-4 pt-4 md:pt-6 border-t border-gray-50 mt-1`}>
                                                            <div className="flex items-center gap-4 md:gap-6 text-xs font-bold">
                                                                <span className={`px-2.5 py-1 ${isModern ? 'text-[10px] font-black uppercase tracking-wider rounded-lg' : 'text-[10px] uppercase rounded-md'} border
                                                                    ${project.status === 'completed'
                                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                        : (project.status === 'active' || project.status === 'in_progress')
                                                                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                                            : 'bg-amber-50 text-amber-600 border-amber-100'
                                                                    }
                                                                `}>
                                                                    {project.status === 'completed' ? 'Terminé' : (project.status === 'active' || project.status === 'in_progress') ? 'En cours' : 'En attente'}
                                                                </span>

                                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                                    <Calendar size={14} className={isModern ? "text-blue-500" : "text-gray-400"} />
                                                                    {project.deadline ? new Date(project.deadline).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Indéfinie'}
                                                                </div>

                                                                {project.tags && project.tags.length > 0 && (
                                                                    <div className="hidden md:flex gap-2">
                                                                        {project.tags.slice(0, 2).map(tag => (
                                                                            <span key={tag} className="text-[10px] text-gray-400 uppercase tracking-widest">#{tag}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <div className="flex -space-x-2.5">
                                                                    {project.members && project.members.slice(0, 3).map((member, i) => (
                                                                        <div
                                                                            key={member._id || i}
                                                                            className={`w-8 h-8 rounded-full ${isModern ? 'bg-gradient-to-br from-indigo-500 to-blue-600 font-black text-white' : 'bg-gray-200 text-gray-600 font-bold'} border-2 border-white flex items-center justify-center text-[10px] shadow-sm`}
                                                                            title={getMemberName(member)}
                                                                        >
                                                                            {getMemberName(member).charAt(0).toUpperCase()}
                                                                        </div>
                                                                    ))}
                                                                    {project.members && project.members.length > 3 && (
                                                                        <div className={`w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-400`}>
                                                                            +{project.members.length - 3}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Controls */}
                                    <div className={`mt-8 flex flex-col md:flex-row justify-center items-center gap-6 border-t border-gray-100 pt-8`}>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span>Afficher</span>
                                            <select
                                                value={limit}
                                                onChange={(e) => {
                                                    setLimit(Number(e.target.value));
                                                    setPage(1);
                                                }}
                                                className={`${isModern ? 'bg-gray-50 rounded-xl px-4 py-1.5 focus:ring-4 focus:ring-blue-500/10' : 'bg-white rounded-lg px-3 py-1.5 min-w-[70px]'} border border-gray-200 outline-none focus:border-blue-500 font-bold text-gray-700 transition-all cursor-pointer`}
                                            >
                                                <option value={6}>6</option>
                                                <option value={12}>12</option>
                                                <option value={18}>18</option>
                                                <option value={24}>24</option>
                                                <option value={30}>30</option>
                                            </select>
                                            <span>par page</span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                className={`flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 ${isModern ? 'rounded-xl' : 'rounded-lg'} text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm`}
                                            >
                                                <ChevronLeft size={16} />
                                                Précédent
                                            </button>
                                            <span className="text-sm font-bold text-gray-600">
                                                Page <span className="text-blue-600">{page}</span> sur {totalPages}
                                            </span>
                                            <button
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages}
                                                className={`flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 ${isModern ? 'rounded-xl' : 'rounded-lg'} text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm`}
                                            >
                                                Suivant
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
