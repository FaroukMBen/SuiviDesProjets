'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute  from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import api from '@/lib/auth';
import { Folder, Plus, ChevronRight } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';

interface Project {
    _id: string;
    title: string;
    description: string;
    status: string;
    deadline: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await api.get('/api/projects');
                setProjects(response.data.projects);
            } catch (err) {
                setError('Impossible de charger les projets');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-gray-50">
                <Navbar />

                <main className="flex-1 ml-64 p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Mes Projets</h1>
                                <p className="text-gray-500 mt-1">Liste de tous vos projets en cours</p>
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

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-500">Chargement des projets...</p>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                                {error}
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <Folder size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">Aucun projet</h3>
                                <p className="text-gray-500 mt-2 mb-6">Vous n'avez pas encore de projets.</p>
                                <Link
                                    href="/projects/new"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Plus size={20} />
                                    <span>Créer mon premier projet</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {projects.map((project) => (
                                    <Link
                                        key={project._id}
                                        href={`/projects/${project._id}`}
                                        className="block bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                    <Folder size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {project.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 line-clamp-1">
                                                        {project.description || 'Aucune description'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-3 py-1 text-xs font-medium rounded-full
                          ${project.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }
                        `}>
                                                    {project.status === 'completed' ? 'Terminé' :
                                                        project.status === 'in_progress' ? 'En cours' : 'En attente'}
                                                </span>
                                                <ChevronRight className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
