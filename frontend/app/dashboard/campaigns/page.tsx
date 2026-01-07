'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth'; // Ton instance axios
import { useAuthStore } from '@/lib/store';
import { 
  Plus, 
  Calendar, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  FileText,
  X
} from 'lucide-react';

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

export default function CampaignsPage() {
  const { user } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // État du formulaire de création
  const [formData, setFormData] = useState({
    title: '',
    academicYear: '2025-2026',
    description: '',
    startDate: '',
    endDate: '',
    evaluationTemplate: [{ name: 'Qualité du code', weight: 1, maxScore: 20 }] as Criterion[]
  });

  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

  // Chargement des données
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await api.get(`/api/campaigns?manager=${user.id}`);
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

  // Envoi du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/campaigns', formData);
      setShowModal(false);
      fetchCampaigns(); // Rafraîchir la liste
      // Reset form (optionnel)
    } catch (err) {
      alert("Erreur lors de la création");
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
      
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campagnes Pédagogiques</h1>
          <p className="text-gray-500 mt-1">Gérez les sessions de projets et les grilles d'évaluation.</p>
        </div>
        
        {isInstructor && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
          >
            <Plus size={20} />
            Nouvelle Campagne
          </button>
        )}
      </div>

      {/* Liste des Campagnes (Grille) */}
      {loading ? (
        <div className="text-center py-20">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
              
              {/* Badge Statut */}
              <div className="absolute top-6 right-6">
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                  ${campaign.status === 'active' ? 'bg-green-100 text-green-700' : 
                    campaign.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'}`}>
                  {campaign.status === 'active' ? 'En cours' : campaign.status}
                </span>
              </div>

              <div className="mb-4">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                  {campaign.academicYear}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-2">{campaign.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  Resp. {campaign.manager?.name}
                </p>
              </div>

              <div className="space-y-2 mt-4 pt-4 border-t border-gray-50 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  <span>Du {new Date(campaign.startDate).toLocaleDateString()} au {new Date(campaign.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-400" />
                  <span>{campaign.evaluationTemplate.length} Critères d'évaluation</span>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  Voir détails
                </button>
                {/* Bouton Config (Prof uniquement) */}
                {isInstructor && (
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                    <MoreVertical size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL DE CRÉATION --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">Nouvelle Campagne</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Infos Générales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la campagne</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ex: Projets Tutorés S4 2025"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Année Univ.</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={formData.academicYear}
                    onChange={e => setFormData({...formData, academicYear: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                    <input 
                      required type="date" 
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                    <input 
                      required type="date" 
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                      value={formData.endDate}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-blue-600"/>
                    Grille d'évaluation modèle
                  </h3>
                  <button type="button" onClick={addCriterion} className="text-sm text-blue-600 font-medium hover:underline">
                    + Ajouter un critère
                  </button>
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                  {formData.evaluationTemplate.map((criterion, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input 
                        type="text" 
                        placeholder="Nom du critère (ex: Qualité Code)" 
                        className="flex-1 px-3 py-2 rounded-md border border-gray-200 text-sm"
                        value={criterion.name}
                        onChange={(e) => updateCriterion(idx, 'name', e.target.value)}
                      />
                      <div className="flex items-center gap-1 w-20">
                        <span className="text-xs text-gray-500">Coef.</span>
                        <input 
                          type="number" min="1"
                          className="w-full px-2 py-2 rounded-md border border-gray-200 text-sm text-center"
                          value={criterion.weight}
                          onChange={(e) => updateCriterion(idx, 'weight', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="flex items-center gap-1 w-20">
                        <span className="text-xs text-gray-500">Max</span>
                        <input 
                          type="number" 
                          className="w-full px-2 py-2 rounded-md border border-gray-200 text-sm text-center"
                          value={criterion.maxScore}
                          onChange={(e) => updateCriterion(idx, 'maxScore', parseInt(e.target.value))}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeCriterion(idx)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">
                  * Cette grille sera copiée automatiquement sur tous les nouveaux projets de cette campagne.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                >
                  Créer la Campagne
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}