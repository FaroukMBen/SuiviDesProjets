'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import { Trash2, Search, Folder, Users } from 'lucide-react';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await api.get('/api/projects'); // Backend renvoie tout grâce au contrôleur admin
      setProjects(res.data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce projet définitivement ?')) {
      try {
        await api.delete(`/api/projects/${id}`);
        fetchProjects();
      } catch (err) {
        alert("Erreur suppression");
      }
    }
  };

  const filtered = projects.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
        <Navbar />
        <div className="flex-1 ml-64 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Administration Projets</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex gap-2">
                    <Search className="text-gray-400" />
                    <input 
                        type="text" placeholder="Rechercher un projet..." 
                        className="flex-1 outline-none"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Projet</th>
                            <th className="px-6 py-4">Campagne</th>
                            <th className="px-6 py-4">Étudiants</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.map((project) => (
                            <tr key={project._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900 flex items-center gap-2">
                                        <Folder size={16} className="text-blue-500"/>
                                        {project.title}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{project.description}</div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {project.campaign?.title || 'Non assigné'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {project.members?.map((m: any) => (
                                            <span key={m._id} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                {m.name}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(project._id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                        title="Supprimer le projet"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}