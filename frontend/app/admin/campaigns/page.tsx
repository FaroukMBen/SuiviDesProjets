'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Search, User, Calendar, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { CampaignModal } from '@/components/campaigns/CampaignModal';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/lib/store';

import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterYears, setFilterYears] = useState<string[]>([]);

  const { user } = useAuthStore();
  const isModern = user?.theme === 'modern';
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      let url = `/api/campaigns?page=${page}&limit=${limit}`;
      if (searchTerm) url += `&search=${searchTerm}`;
      if (filterStatuses.length > 0) url += `&status=${filterStatuses.join(',')}`;
      if (filterYears.length > 0) url += `&targetYear=${filterYears.join(',')}`;

      const res = await api.get(url);
      setCampaigns(res.data.campaigns);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, limit, searchTerm, filterStatuses, filterYears]);

  const handleDelete = async (id: string) => {
    if (!await confirm({ title: "Suppression de campagne", message: 'Attention : Supprimer une campagne supprimera aussi tous les projets associés. Continuer ?', type: "danger" })) return;
    try {
      await api.delete(`/api/campaigns/${id}`);
      fetchCampaigns();
      showToast("Campagne supprimée", "success");
    } catch (err) {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
        <Navbar />
        <div className="flex-1 ml-64 p-8">

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Administration Campagnes</h1>
            <button
              onClick={() => { setSelectedCampaign(null); setIsModalOpen(true); }}
              className={`px-6 py-3 bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all ${isModern ? 'rounded-2xl' : 'rounded-lg'}`}
            >
              <Plus size={20} /> Créer une campagne
            </button>
          </div>

          {/* Search & Filters */}
          <div className={`${isModern ? 'bg-white/80 backdrop-blur-md rounded-3xl' : 'bg-white rounded-xl'} shadow-sm border border-gray-100 mb-8`}>
            <div className={`p-4 ${isModern ? 'bg-gray-50/50' : 'bg-gray-50'} border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center relative z-20`}>
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher une campagne..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-700"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto pb-2 md:pb-0">
                <MultiSelectDropdown
                  label="Statuts"
                  options={[
                    { value: 'active', label: 'En cours' },
                    { value: 'draft', label: 'Brouillon' },
                    { value: 'archived', label: 'Archivé' },
                    { value: 'closed', label: 'Fermé' }
                  ]}
                  selectedValues={filterStatuses}
                  onChange={(vals) => { setFilterStatuses(vals); setPage(1); }}
                  placeholder="Tous les statuts"
                  isModern={isModern}
                />

                <MultiSelectDropdown
                  label="Promos"
                  options={[
                    { value: 'BUT1', label: 'BUT1' },
                    { value: 'BUT2', label: 'BUT2' },
                    { value: 'BUT3', label: 'BUT3' }
                  ]}
                  selectedValues={filterYears}
                  onChange={(vals) => { setFilterYears(vals); setPage(1); }}
                  placeholder="Toutes promos"
                  isModern={isModern}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`${isModern ? 'bg-gray-50/50' : 'bg-gray-50'} text-gray-400 text-xs uppercase font-black tracking-widest`}>
                  <tr>
                    <th className="px-8 py-5">Campagne</th>
                    <th className="px-8 py-5">Responsable</th>
                    <th className="px-8 py-5">Période</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500 font-bold">Chargement...</td></tr>
                  ) : campaigns.map((campaign) => (
                    <tr key={campaign._id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-black text-gray-900 leading-none mb-1">{campaign.title}</div>
                        <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider shadow-sm
                          ${campaign.status === 'active' ? 'bg-green-50 text-green-600' :
                            campaign.status === 'draft' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <User size={16} className="text-blue-500" />
                          {campaign.manager?.name || 'Inconnu'}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-purple-500" />
                          {new Date(campaign.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2 text-right">
                          <Link
                            href={`/campaigns/${campaign._id}`}
                            className="p-3 text-emerald-600 hover:bg-emerald-100 rounded-2xl transition-all hover:scale-110 active:scale-95"
                            title="Accéder comme enseignant"
                          >
                            <Eye size={20} />
                          </Link>
                          <button
                            onClick={() => { setSelectedCampaign(campaign); setIsModalOpen(true); }}
                            className="p-3 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all hover:scale-110 active:scale-95"
                            title="Modifier"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(campaign._id)}
                            className="p-3 text-red-600 hover:bg-red-100 rounded-2xl transition-all hover:scale-110 active:scale-95"
                            title="Supprimer"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="px-8 py-10 text-center text-gray-400 font-bold">
                        Aucune campagne trouvée.
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

          <CampaignModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={fetchCampaigns}
            campaignToEdit={selectedCampaign}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}