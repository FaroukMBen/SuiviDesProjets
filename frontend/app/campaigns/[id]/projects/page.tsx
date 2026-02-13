'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/auth';
import {
    Search,
    Github,
    ArrowRight,
    Users,
    GitCommit,
    AlertCircle
} from 'lucide-react';

export default function CampaignProjectsTab() {
    const params = useParams();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // On récupère uniquement les projets de CETTE campagne
                const res = await api.get(`/api/projects?campaign=${params.id}`);
                setProjects(res.data.projects);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) fetchProjects();
    }, [params.id]);

    // Filtrage
    const filteredProjects = projects.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.members?.some((m: any) => m?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Quelques stats rapides pour cet onglet
    const stats = {
        total: projects.length,
        missingRepo: projects.filter(p => !p.githubRepo).length,
        active: projects.length // À affiner si tu as un statut
    };

    return (
        <div className="space-y-6">

            {/* 1. Petite barre de stats interne à l'onglet */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm">Groupes formés</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Users size={20} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm">Repos Git manquants</p>
                        <p className={`text-2xl font-bold ${stats.missingRepo > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {stats.missingRepo}
                        </p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.missingRepo > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        <GitCommit size={20} />
                    </div>
                </div>
                {/* Tu peux ajouter une 3ème stat ici */}
            </div>

            {/* 2. Tableau et Recherche */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher un groupe, un étudiant..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="ml-auto text-sm text-gray-500">
                        Affichage de {filteredProjects.length} projet(s)
                    </div>
                </div>

                {/* Liste */}
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Projet / Description</th>
                            <th className="px-6 py-4">Membres</th>
                            <th className="px-6 py-4">Dépôt</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Chargement...</td></tr>
                        ) : filteredProjects.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-gray-500">
                                    Aucun projet ne correspond à votre recherche.
                                </td>
                            </tr>
                        ) : filteredProjects.map((project) => (
                            <tr key={project._id} className="hover:bg-gray-50 transition group">

                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{project.title}</div>
                                    <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex items-center -space-x-2">
                                        {project.members?.map((m: any, i: number) => (
                                            <div
                                                key={i}
                                                title={m?.name || 'Inconnu'}
                                                className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-700 uppercase cursor-help"
                                            >
                                                {m?.name?.charAt(0) || '?'}
                                            </div>
                                        ))}
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    {project.githubRepo ? (
                                        <a
                                            href={project.githubRepo}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition"
                                        >
                                            <Github size={14} /> Voir le code
                                        </a>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                                            <AlertCircle size={12} /> Manquant
                                        </span>
                                    )}
                                </td>

                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/projects/${project._id}`}
                                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        Voir le détail <ArrowRight size={16} />
                                    </Link>
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}