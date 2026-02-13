'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import { Trash2, Search, Eye, Edit2, ChevronLeft, ChevronRight, Filter, Check, ChevronDown } from 'lucide-react';
import { EditAdminProjectModal } from '@/components/admin/EditAdminProjectModal';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/lib/store';

import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuthStore();
  const isModern = user?.theme === 'modern';
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Filtres
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [filterCampaigns, setFilterCampaigns] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Backend handles comma separated values for multi-filters if implemented, 
      // or we can just send the first one if backend doesn't support array.
      // Assuming backend might need update for multi-select, but let's stick to the current API protocol first
      // or implement comma separated if it's standard.
      let url = `/api/projects?page=${page}&limit=${limit}`;
      if (searchTerm) url += `&search=${searchTerm}`;

      // If backend supports only one, we take the first. 
      // If backend supports array/list, we send comma separated.
      if (filterCampaigns.length > 0) url += `&campaign=${filterCampaigns.join(',')}`;
      if (filterStatuses.length > 0) url += `&status=${filterStatuses.join(',')}`;

      const res = await api.get(url);
      setProjects(res.data.projects);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/api/campaigns');
      setCampaigns(res.data.campaigns);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, limit, searchTerm, filterCampaigns, filterStatuses]);

  useEffect(() => {
    fetchCampaigns();
  }, []);


  const handleDelete = async (id: string) => {
    if (!await confirm({ title: "Suppression", message: "Voulez-vous vraiment supprimer ce projet ?", type: "danger" })) return;
    try {
      await api.delete(`/api/projects/${id}`);
      fetchProjects();
      showToast("Projet supprimé", "success");
    } catch (err) {
      showToast("Erreur suppression", "error");
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
        <Navbar />
        <div className="flex-1 ml-64 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Administration Projets</h1>

          {/* Search & Filters */}
          <div className={`${isModern ? 'bg-white/80 backdrop-blur-md rounded-3xl' : 'bg-white rounded-xl'} shadow-sm border border-gray-100 mb-8`}>
            <div className={`p-4 ${isModern ? 'bg-gray-50/50' : 'bg-gray-50'} border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center relative z-20`}>
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un projet (Titre, Description...)"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-700"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto pb-2 md:pb-0">
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
                    { value: 'waiting', label: 'En attente' },
                    { value: 'completed', label: 'Terminé' }
                  ]}
                  selectedValues={filterStatuses}
                  onChange={(vals) => { setFilterStatuses(vals); setPage(1); }}
                  placeholder="Tous les statuts"
                  isModern={isModern}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`${isModern ? 'bg-gray-50/50' : 'bg-gray-50'} text-gray-400 text-xs uppercase font-black tracking-widest`}>
                  <tr>
                    <th className="px-8 py-5">Projet</th>
                    <th className="px-8 py-5">Campagne</th>
                    <th className="px-8 py-5">Membres</th>
                    <th className="px-8 py-5">Statut</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Chargement...</td></tr>
                  ) : projects.map((p) => (
                    <tr key={p._id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-black text-gray-900 leading-none mb-1">{p.title}</div>
                        <div className="text-sm text-gray-400 font-medium line-clamp-1">{p.description}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                          {p.campaignId?.title || 'Aucune'}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex -space-x-2">
                          {p.members?.slice(0, 3).map((m: any, i: number) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold" title={m.firstName ? `${m.firstName} ${m.lastName || ''}` : m.name}>
                              {m.firstName ? m.firstName[0] : (m.name ? m.name[0] : 'U')}
                            </div>
                          ))}
                          {p.members?.length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-bold">
                              +{p.members.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider shadow-sm
                          ${p.status === 'active' ? 'bg-green-50 text-green-600' :
                            p.status === 'waiting' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                          {p.status === 'active' ? 'Actif' : p.status === 'waiting' ? 'Attente' : 'Terminé'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/projects/${p._id}`}
                            className="p-3 text-emerald-600 hover:bg-emerald-100 rounded-2xl transition-all hover:scale-110 active:scale-95"
                            title="Voir"
                          >
                            <Eye size={20} />
                          </Link>
                          <button
                            onClick={() => { setSelectedProject(p); setIsModalOpen(true); }}
                            className="p-3 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all hover:scale-110 active:scale-95"
                            title="Modifier"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id)}
                            className="p-3 text-red-600 hover:bg-red-100 rounded-2xl transition-all hover:scale-110 active:scale-95"
                            title="Supprimer"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center text-gray-400 font-bold">
                        Aucun projet trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

          <EditAdminProjectModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={fetchProjects}
            project={selectedProject}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}