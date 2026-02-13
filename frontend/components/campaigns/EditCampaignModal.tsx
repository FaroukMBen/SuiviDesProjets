'use client';

import { useState } from 'react';
import api from '@/lib/auth';
import { X, Save, AlertTriangle } from 'lucide-react';
import { EvaluationGridEditor } from './EvaluationGridEditor';
import { useToast } from '@/components/ui/Toast';

interface Props {
  campaign: any;
  onClose: () => void;
  onUpdate: (updatedCampaign: any) => void;
}

export function EditCampaignModal({ campaign, onClose, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    title: campaign.title,
    description: campaign.description || '',
    endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '', // Format YYYY-MM-DD
    evaluationTemplate: campaign.evaluationTemplate || []
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // API PUT
      const res = await api.put(`/api/campaigns/${campaign._id}`, formData);
      onUpdate(res.data.campaign); // Met à jour l'affichage parent
      onClose();
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la modification", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Modifier la campagne</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Infos Générales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Zone Grille d'évaluation */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">Grille de notation</label>
              <div className="group relative">
                <AlertTriangle size={14} className="text-orange-500 cursor-help" />
                <span className="absolute left-6 top-0 w-64 p-2 bg-gray-800 text-white text-xs rounded hidden group-hover:block z-10">
                  Attention : Modifier la grille alors que des projets sont déjà notés peut fausser les résultats.
                </span>
              </div>
            </div>

            {/* 👇 C'est ici qu'on utilise notre composant réutilisable */}
            <EvaluationGridEditor
              criteria={formData.evaluationTemplate}
              onChange={(newCriteria) => setFormData({ ...formData, evaluationTemplate: newCriteria })}
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : <><Save size={18} /> Enregistrer les modifications</>}
          </button>
        </div>
      </div>
    </div>
  );
}