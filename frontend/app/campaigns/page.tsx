'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth'; // Ton instance axios
import { useAuthStore } from '@/lib/store';
import {
  Plus,
  Trash2,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { CampaignList } from '@/components/campaigns/CampaignList';
import { CampaignModal } from '@/components/campaigns/CampaignModal';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';

// Interfaces pour Typer les données
interface Criterion {
  name: string;
  weight: number;
  maxScore: number;
}

interface Campaign {
  _id: string;
  title: string;
  academicYear: string;
  status: 'draft' | 'active' | 'closed' | 'archived';
  startDate: string;
  endDate: string;
  manager: { name: string };
  evaluationTemplate: Criterion[];
}

const SCHOOL_STRUCTURE: Record<string, string[]> = {
  'BUT1': ['G1', 'G2', 'G3', 'G4'],
  'BUT2': ['RA1', 'RA2', 'RA3', 'DACS', 'AGED1', 'AGED2'],
  'BUT3': ['RA1', 'RA2', 'RA3', 'DACS', 'AGED1', 'AGED2']
};

export default function CampaignsPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null); // null = Création, Objet = Modif

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCampaigns, setTotalCampaigns] = useState(0);

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterYears, setFilterYears] = useState<string[]>([]);

  // État du formulaire de création
  const [formData, setFormData] = useState({
    title: '',
    academicYear: '2025-2026',
    description: '',
    startDate: '',
    endDate: '',
    targetYear: 'BUT3',
    evaluationTemplate: [{ name: 'Qualité du code', weight: 1, maxScore: 20 }] as Criterion[],
    targetGroups: [] as string[]
  });

  const toggleGroup = (group: string) => {
    setFormData(prev => {
      const groups = prev.targetGroups.includes(group)
        ? prev.targetGroups.filter(g => g !== group) // On retire
        : [...prev.targetGroups, group]; // On ajoute
      return { ...prev, targetGroups: groups };
    });
  };

  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

  // Chargement des données
  useEffect(() => {
    const userId = user?.id || (user as any)?._id;

    if (user && userId) {
      console.log("✅ User trouvé, lancement du fetch pour :", userId);
      fetchCampaigns(userId); // On passe l'ID directement
    } else {
      console.log("⏳ En attente du chargement de l'utilisateur...");
    }
  }, [user, page, limit, searchTerm, filterStatuses, filterYears]);

  const fetchCampaigns = async (userIdForce?: string) => {
    // Si pas de user, on attend
    if (!user) return;

    try {
      let url = '/api/campaigns';

      // Si prof, on filtre par manager
      if (isInstructor) {
        const currentId = userIdForce || user.id || (user as any)._id;
        url += `?manager=${currentId}`;
        console.log(`📡 Appel API (Prof) : ${url}`);
      } else {
        // Si étudiant, on demande le scope student
        url += `?scope=student`;
        console.log(`📡 Appel API (Etudiant) : ${url}`);
      }

      let urlWithFilters = `${url}${url.includes('?') ? '&' : '?'}page=${page}&limit=${limit}`;
      if (searchTerm) urlWithFilters += `&search=${searchTerm}`;
      if (filterStatuses.length > 0) urlWithFilters += `&status=${filterStatuses.join(',')}`;
      if (filterYears.length > 0) urlWithFilters += `&targetYear=${filterYears.join(',')}`;

      const res = await api.get(urlWithFilters);
      setCampaigns(res.data.campaigns);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalCampaigns(res.data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Gestion du formulaire dynamique (Critères)
  const addCriterion = () => {
    setFormData({
      ...formData,
      evaluationTemplate: [...formData.evaluationTemplate, { name: '', weight: 1, maxScore: 20 }]
    });
  };

  const removeCriterion = (index: number) => {
    const newTemplate = formData.evaluationTemplate.filter((_, i) => i !== index);
    setFormData({ ...formData, evaluationTemplate: newTemplate });
  };

  const updateCriterion = (index: number, field: keyof Criterion, value: string | number) => {
    const newTemplate = [...formData.evaluationTemplate];
    newTemplate[index] = { ...newTemplate[index], [field]: value };
    setFormData({ ...formData, evaluationTemplate: newTemplate });
  };

  const handleCreateClick = () => {
    setSelectedCampaign(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (campaign: any) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleSuccess = (campaign: any) => {
    fetchCampaigns();
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("FormData : ", formData)
    try {
      await api.post('/api/campaigns', formData);
      setShowModal(false);
      fetchCampaigns();
    } catch (err) {
      showToast("Erreur lors de la création", "error");
    }
  };

  // Suppression Définitive (DELETE)
  const handleDeleteCampaign = async (id: string) => {
    if (!await confirm({ title: "Suppression", message: "Voulez-vous vraiment supprimer cette campagne ?", type: "danger" })) return;

    try {
      await api.delete(`/api/campaigns/${id}`);
      setCampaigns(prev => prev.filter(c => c._id !== id));
      showToast("Campagne supprimée", "success");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  // Archivage (PUT update)
  const handleArchiveCampaign = async (id: string) => {
    try {
      await api.put(`/api/campaigns/${id}`, { status: 'archived' });

      setCampaigns(prev => prev.map(c =>
        c._id === id ? { ...c, status: 'archived' } : c
      ));

    } catch (err) {
      console.error(err);
      showToast("Erreur lors de l'archivage", "error");
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
        <Navbar />
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
          {/* En-tête */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Campagnes Pédagogiques</h1>
              <p className="text-gray-500 mt-1">Gérez les sessions de projets et les grilles d'évaluation.</p>
            </div>

            {isInstructor && (
              <button
                onClick={handleCreateClick}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
              >
                <Plus size={20} />
                Nouvelle Campagne
              </button>
            )}
          </div>

          {/* Barre de recherche et filtres */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center mb-8">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Rechercher une campagne..."
                className="w-full pl-12 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-700"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto relative z-20 pb-2 md:pb-0">
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
                isModern={user?.theme === 'modern'}
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
                isModern={user?.theme === 'modern'}
              />
            </div>
          </div>

          <CampaignList
            campaigns={campaigns}
            loading={loading}
            isInstructor={isInstructor}
            onDelete={handleDeleteCampaign}
            onArchive={handleArchiveCampaign}
          />

          {/* Pagination */}
          {!loading && campaigns.length > 0 && (
            <div className={`mt-8 flex flex-col md:flex-row justify-center items-center gap-6 border-t border-gray-100 pt-8`}>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Afficher</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className={`${user?.theme === 'modern' ? 'bg-gray-50 rounded-xl px-4 py-1.5 focus:ring-4 focus:ring-blue-500/10' : 'bg-white rounded-lg px-3 py-1.5 min-w-[70px]'} border border-gray-200 outline-none focus:border-blue-500 font-bold text-gray-700 transition-all cursor-pointer`}
                >
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                  <option value={12}>12</option>
                  <option value={15}>15</option>
                </select>
                <span>par page</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 ${user?.theme === 'modern' ? 'rounded-xl' : 'rounded-lg'} text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm`}
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
                  className={`flex items-center gap-1 px-4 py-2 bg-white border border-gray-200 ${user?.theme === 'modern' ? 'rounded-xl' : 'rounded-lg'} text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm`}
                >
                  Suivant
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          <CampaignModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleSuccess}
            campaignToEdit={selectedCampaign} // Si null -> Création, Sinon -> Modif
          />
        </main>
      </div>
    </ProtectedRoute>
  );
}