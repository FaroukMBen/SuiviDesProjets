'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth'; // Ton instance axios
import { useAuthStore } from '@/lib/store';
import { 
  Plus, 
  Trash2,
  FileText,
  X
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { CampaignList } from '@/components/campaigns/CampaignList';
import { CampaignModal } from '@/components/campaigns/CampaignModal';

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null); // null = Création, Objet = Modif

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
  }, [user]);

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

      const res = await api.get(url);
      setCampaigns(res.data.campaigns);
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
      alert("Erreur lors de la création");
    }
  };

  // Suppression Définitive (DELETE)
  const handleDeleteCampaign = async (id: string) => {
    try {
      await api.delete(`/api/campaigns/${id}`);
      setCampaigns(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
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
      alert("Erreur lors de l'archivage");
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

      <CampaignList 
        campaigns={campaigns} 
        loading={loading} 
        isInstructor={isInstructor}
        onDelete={handleDeleteCampaign}
        onArchive={handleArchiveCampaign}
      />

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