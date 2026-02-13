"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import api from '@/lib/auth';
import { Folder, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { useAuthStore } from '@/lib/store';

interface Project {
    _id: string;
    title: string;
    description: string;
    status: string;
    deadline: string;
    tags: string[];
    members: { _id: string; name: string }[];
}

export default function ProjectsPage() {
    const { user } = useAuthStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProjects, setTotalProjects] = useState(0);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/projects?page=${page}&limit=${limit}`);
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

    useEffect(() => {
        fetchProjects();
    }, [page, limit]); // Re-fetch on page or limit change

    // Client-side filtering for search (within current page results is tricky, 
    // ideally search should be server-side or we accept filtering current page only)
    // For simplicity with server pagination, we should probably move search to server-side too
    // BUT for now, let's keep client filtering on the fetched page.
    useEffect(() => {
        const results = projects.filter(project =>
            project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredProjects(results);
    }, [searchTerm, projects]);

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-gray-50">
                <Navbar />

                <main className="flex-1 ml-64 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col gap-6 mb-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                        Mes Projets
                                        <span className="bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                            {totalProjects} {totalProjects > 1 ? 'projets' : 'projet'}
                                        </span>
                                    </h1>
                                    <p className="text-gray-500 mt-1">Page {page} sur {totalPages}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <NotificationBell />
                                    <Link
                                        href="/projects/new"
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Plus size={20} />
                                        <span>Nouveau Projet</span>
                                    </Link>
                                </div>
                            </div>


                            {/* Search Bar */}
                            {/* Note: Searching only filters current page results in this implementation */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Rechercher sur cette page..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pl-11"
                                />
                                <svg
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-500">Chargement des projets...</p>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                                {error}
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <Folder size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">Aucun projet trouvé</h3>
                                <p className="text-gray-500 mt-2 mb-6">
                                    {searchTerm ? "Aucun projet ne correspond à votre recherche sur cette page." : "Vous n'avez pas encore de projets."}
                                </p>
                                {!searchTerm && (
                                    <Link
                                        href="/projects/new"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Plus size={20} />
                                        <span>Créer mon premier projet</span>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid gap-4">
                                    {filteredProjects.map((project) => (
                                        <Link
                                            key={project._id}
                                            href={`/projects/${project._id}`}
                                            className="block bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
                                        >
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                            <Folder size={24} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                {project.title}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 line-clamp-1 mb-1">
                                                                {project.description || 'Aucune description'}
                                                            </p>
                                                            {/* Tags */}
                                                            <div className="flex flex-wrap gap-2">
                                                                {project.tags && project.tags.map(tag => (
                                                                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                                </div>

                                                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-50">
                                                    <div className="flex items-center gap-4">
                                                        <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full
                                                            ${project.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                            }
                                                        `}>
                                                            {project.status === 'completed' ? 'Terminé' :
                                                                project.status === 'in_progress' ? 'En cours' : 'En attente'}
                                                        </span>
                                                        <span>
                                                            {project.deadline ? `Pour le ${new Date(project.deadline).toLocaleDateString()}` : 'Pas de date limite'}
                                                        </span>
                                                    </div>

                                                    {/* Members Avatars */}
                                                    <div className="flex -space-x-2">
                                                        {project.members && project.members.slice(0, 3).map((member, i) => (
                                                            <div
                                                                key={member._id || i}
                                                                className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700"
                                                                title={member.name}
                                                            >
                                                                {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                                                            </div>
                                                        ))}
                                                        {project.members && project.members.length > 3 && (
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                                                                +{project.members.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Pagination Controls */}
                                <div className="mt-8 flex flex-col md:flex-row justify-center items-center gap-6 border-t border-gray-100 pt-8">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span>Afficher</span>
                                        <select
                                            value={limit}
                                            onChange={(e) => {
                                                setLimit(Number(e.target.value));
                                                setPage(1);
                                            }}
                                            className="bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value={10}>10</option>
                                            <option value={15}>15</option>
                                            <option value={20}>20</option>
                                            <option value={25}>25</option>
                                        </select>
                                        <span>par page</span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                            Précédent
                                        </button>
                                        <span className="text-sm text-gray-600">
                                            Page <span className="font-medium text-gray-900">{page}</span> sur <span className="font-medium text-gray-900">{totalPages}</span>
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Suivant
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
