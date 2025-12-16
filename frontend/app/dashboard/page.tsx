'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar'; // Assure-toi que Navbar n'utilise pas de variables CSS cassées aussi !
import Link from 'next/link';
import api from '@/lib/auth';
import { Card } from '@/components/ui/Card'; // Importe les composants créés
import { Badge } from '@/components/ui/Badge';

interface Project {
  _id: string;
  title: string;
  description: string;
  status: string;
  owner: any;
  members: any[];
  deadline: string;
}

// Données fictives pour le style (en attendant le backend)
const MOCK_TASKS = [
  { id: 1, title: 'Setup repo & CI', assignedTo: 'Ilias', date: '2025-10-05' },
  { id: 2, title: 'Maquettes Dashboard', assignedTo: 'Ilias', date: '2025-10-02' },
  { id: 3, title: "Grille d'évaluation - v1", assignedTo: 'Sara', date: '2025-10-08' },
];

const MOCK_NOTIFS = [
  { id: 1, text: 'Invitation au projet PFE — App Mobile Santé', date: '2025-09-26' },
  { id: 2, text: 'Nouveau commentaire sur SAE — Plateforme de suivi', date: '2025-09-29' },
];

const MOCK_COMMITS = [
  { id: 1, project: 'SAE — Plateforme de suivi', msg: 'feat: AppShell + sidebar', author: 'Ilias', date: '2025-09-28' },
  { id: 2, project: 'SAE — Plateforme de suivi', msg: 'chore: seed data', author: 'Sara', date: '2025-09-29' },
  { id: 3, project: 'PFE — App Mobile Santé', msg: 'fix: auth redirect', author: 'Soufiane', date: '2025-09-27' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/projects');
      setProjects(response.data.projects);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
              <p className="text-gray-500 mt-1">Bon retour, {user?.name}</p>
            </div>
            <Link
              href="/projects/new"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition shadow-sm text-sm"
            >
              + Nouveau Projet
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Section 1 : Mes Projets */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Mes projets</h2>
              <Link href="/projects" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Voir tout</Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : projects.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-gray-500 mb-4">Vous n'avez aucun projet pour le moment.</p>
                <Link href="/projects/new" className="text-primary-600 hover:underline font-medium">Créer votre premier projet</Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project._id} className="hover:shadow-md transition-shadow duration-200 relative group">
                    {/* Header de la carte */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-2">
                         {/* Badge statique pour l'instant (à dynamiser plus tard) */}
                        <Badge variant="blue">Dev Web</Badge>
                        <span className="text-xs text-gray-500 py-1">
                          {project.owner?.name || "M. Dupont"}
                        </span>
                      </div>
                      {/* Icône étoile (placeholder) */}
                      <button className="text-gray-400 hover:text-yellow-400 transition">★</button>
                    </div>

                    {/* Titre */}
                    <Link href={`/projects/${project._id}`} className="block mb-6">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {project.title}
                      </h3>
                    </Link>

                    {/* Footer de la carte */}
                    <div className="flex items-center justify-between mt-auto">
                        <Link href="#" className="text-xs text-primary-600 hover:underline font-medium">Lien Git</Link>
                        
                        <div className="flex items-center gap-2">
                            {/* Avatars membres (Initiales) */}
                            <div className="flex -space-x-2">
                                {project.members?.slice(0, 3).map((m: any, i: number) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600">
                                        {m.name ? m.name[0] : '?'}
                                    </div>
                                ))}
                            </div>
                            <Link 
                                href={`/projects/${project._id}`}
                                className="px-3 py-1 border border-gray-200 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                Ouvrir
                            </Link>
                        </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section 2 : Tâches & Notifications (Grid 2 colonnes) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Colonne Tâches */}
            <div>
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-bold text-gray-900">Tâches à faire</h2>
               </div>
               <div className="space-y-3">
                 {MOCK_TASKS.map(task => (
                   <Card key={task.id} className="p-4 flex items-center justify-between !py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm text-gray-900">{task.title}</span>
                        <span className="text-xs text-gray-400">assigné à {task.assignedTo}</span>
                      </div>
                      <Badge variant="gray">{task.date}</Badge>
                   </Card>
                 ))}
               </div>
            </div>

            {/* Colonne Notifications */}
            <div>
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                 <button className="text-sm text-primary-600 hover:text-primary-700">Voir tout</button>
               </div>
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
                 {MOCK_NOTIFS.map(notif => (
                   <div key={notif.id} className="p-4 flex justify-between items-start hover:bg-gray-50 transition">
                      <p className="text-sm text-gray-600">{notif.text}</p>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{notif.date}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Section 3 : Derniers Commits */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Derniers commits</h2>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projet</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auteur</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {MOCK_COMMITS.map((commit) => (
                            <tr key={commit.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{commit.project}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{commit.msg}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{commit.author}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{commit.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}