'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/auth';
import { useAuthStore } from '@/lib/store';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  Flag, 
  FileText,
  Code,
  X
} from 'lucide-react';

interface Milestone {
  _id: string;
  title: string;
  description: string;
  date: string;
  type: 'livrable' | 'point_de_controle';
  createdAt: string;
}

interface Campaign {
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
}

export default function MilestonesPage() {
  const params = useParams();
  const router = useRouter(); 
  const { user } = useAuthStore();
  
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    type: 'livrable'
  });

  useEffect(() => {
    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const campRes = await api.get(`/api/campaigns`); // Optimisation possible
      const foundCampaign = campRes.data.campaigns.find((c: any) => c._id === campaignId);
      setCampaign(foundCampaign || null);

      const milestonesRes = await api.get(`/api/milestones/campaign/${campaignId}`);
      setMilestones(milestonesRes.data.milestones);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingMilestone(null);
    setFormData({ title: '', description: '', date: '', type: 'livrable' });
    setIsModalOpen(true);
  };

  const openEditModal = (m: Milestone) => {
    setEditingMilestone(m);
    setFormData({ 
      title: m.title, 
      description: m.description, 
      date: m.date.split('T')[0],
      type: m.type as string 
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce jalon ?')) return;
    try {
      await api.delete(`/api/milestones/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, campaignId };
      if (editingMilestone) {
        await api.put(`/api/milestones/${editingMilestone._id}`, payload);
      } else {
        await api.post('/api/milestones', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric', 
      month: 'long', 
      year: 'numeric'
    });
  };

  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

  return (
    <div>
        {/* Barre d'action spécifique à cette page */}
        <div className="flex justify-end mb-6">
            {isInstructor && (
                <button 
                  onClick={openCreateModal}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                    <Plus size={20} />
                    Ajouter un Jalon
                </button>
            )}
        </div>

        {loading ? (
            <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse"></div>)}
            </div>
        ) : milestones.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <Flag size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun jalon défini</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    Commencez par ajouter des objectifs ou des livrables attendus pour guider les étudiants dans ce projet.
                </p>
            </div>
        ) : (
            <div className="relative border-l-4 border-blue-100 ml-6 space-y-12 py-4">
                {milestones.map((milestone, idx) => (
                    <div key={milestone._id} className="relative pl-10">
                        {/* Point sur la timeline */}
                        <div className={`absolute -left-[13px] top-6 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center 
                            ${milestone.type === 'livrable' ? 'bg-orange-500' : 'bg-blue-600'}`
                        }>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${milestone.type === 'livrable' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {milestone.type === 'livrable' ? <FileText size={20} /> : <Code size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{milestone.title}</h3>
                                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            {milestone.type === 'livrable' ? 'Livrable attendu' : 'Point de contrôle'}
                                        </span>
                                    </div>
                                </div>

                                {isInstructor && (
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                        <button 
                                            onClick={() => openEditModal(milestone)} 
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(milestone._id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-600 mb-6 leading-relaxed">
                                {milestone.description}
                            </p>

                            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 w-fit px-4 py-2 rounded-lg border border-gray-100">
                                <Calendar size={16} className="text-gray-400" />
                                <span>À réaliser pour le : <b className="text-gray-800">{formatDate(milestone.date)}</b></span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Modal Création / Édition */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="text-xl font-bold text-gray-900">
                            {editingMilestone ? 'Modifier le jalon' : 'Nouveau Jalon'}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Titre (<span className="text-red-500">*</span>)</label>
                            <input 
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                placeholder="Ex: Cahier des charges"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type de jalon</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, type: 'livrable'})}
                                    className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition
                                        ${formData.type === 'livrable' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <FileText size={18} />
                                    Livrable (Fichier)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, type: 'point_de_controle'})}
                                    className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition
                                        ${formData.type === 'point_de_controle' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Code size={18} />
                                    Point de contrôle
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date butoir</label>
                                <input 
                                    type="date"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={formData.date}
                                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea 
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500/20 outline-none h-32 resize-none"
                                placeholder="Détails attendus..."
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition"
                            >
                                Annuler
                            </button>
                            <button 
                                type="submit"
                                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                            >
                                {editingMilestone ? 'Sauvegarder' : 'Créer le jalon'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}
