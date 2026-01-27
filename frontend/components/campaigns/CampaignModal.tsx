'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth';
import { X, Save, AlertTriangle, FileText } from 'lucide-react';
import { EvaluationGridEditor } from './EvaluationGridEditor'; // On réutilise ton composant !

// Définition de la structure (tu peux aussi mettre ça dans un fichier constants.ts)
const SCHOOL_STRUCTURE: Record<string, string[]> = {
  'BUT1': ['G1', 'G2', 'G3', 'G4'],
  'BUT2': ['RA1', 'RA2', 'RA3', 'AGED1', 'AGED2', 'DACS'],
  'BUT3': ['RA1', 'RA2', 'RA3', 'AGED1', 'AGED2', 'DACS']
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (campaign: any) => void; // Appelé après sauvegarde pour rafraîchir la liste
  campaignToEdit?: any; // Optionnel : si présent, on est en mode EDIT
}

export function CampaignModal({ isOpen, onClose, onSuccess, campaignToEdit }: Props) {
  const isEditing = !!campaignToEdit; // true si on modifie, false si on crée
  const [loading, setLoading] = useState(false);

  // État initial vide
  const initialState = {
    title: '',
    academicYear: '2025-2026',
    description: '',
    startDate: '',
    endDate: '',
    targetYear: 'BUT1',
    targetGroups: [] as string[],
    evaluationTemplate: []
  };

  const [formData, setFormData] = useState<any>(initialState);

  // 🔄 EFFET : Quand le modal s'ouvre, on remplit le formulaire ou on le vide
  useEffect(() => {
    if (isOpen) {
      if (campaignToEdit) {
        // Mode EDIT : On remplit avec les données existantes
        setFormData({
          ...campaignToEdit,
          description: campaignToEdit.description || '',
          endDate: campaignToEdit.endDate ? campaignToEdit.endDate.split('T')[0] : '',
          startDate: campaignToEdit.startDate ? campaignToEdit.startDate.split('T')[0] : '',
          targetGroups: campaignToEdit.targetGroups || [] // Sécurité
        });
      } else {
        // Mode CREATE : On remet à zéro
        setFormData(initialState);
      }
    }
  }, [isOpen, campaignToEdit]);

  if (!isOpen) return null;

  // Gestion des groupes (Toggle)
  const toggleGroup = (group: string) => {
    setFormData((prev: any) => {
      const groups = prev.targetGroups.includes(group)
        ? prev.targetGroups.filter((g: string) => g !== group)
        : [...prev.targetGroups, group];
      return { ...prev, targetGroups: groups };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. NETTOYAGE : On ne garde que les critères qui ont un nom
    const cleanTemplate = formData.evaluationTemplate.filter(
      (c: any) => c.name && c.name.trim() !== ''
    );

    // 2. SÉCURITÉ : On vérifie qu'il reste au moins un critère
    if (cleanTemplate.length === 0) {
      alert("La grille d'évaluation doit contenir au moins un critère valide.");
      return;
    }

    const formattedTemplate = cleanTemplate.map((c: any) => ({
      name: c.name,
      description: c.description || "", // On gère le cas vide
      weight: Number(c.weight || 1),
      maxScore: Number(c.maxScore || 20)
    }));

    const dataToSend = {
      ...formData,
      evaluationTemplate: formattedTemplate
    };

    setLoading(true);

    try {
      let res;
      if (isEditing) {
        res = await api.put(`/api/campaigns/${campaignToEdit._id}`, dataToSend);
      } else {
        res = await api.post('/api/campaigns', dataToSend);
      }

      onSuccess(res.data.campaign);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Modifier la campagne' : 'Nouvelle Campagne'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Formulaire Scrollable */}
        <div className="p-6 overflow-y-auto">
          <form id="campaignForm" onSubmit={handleSubmit} className="space-y-6">

            {/* 1. Infos Générales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  required type="text"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Projets Tutorés S4 2025"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optionnel)</label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                  placeholder="Courte description de la campagne..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                  <input
                    required type="date"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                  <input
                    required type="date"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année Scolaire</label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option>2024-2025</option>
                  <option>2025-2026</option>
                  <option>2026-2027</option>
                </select>
              </div>
            </div>

            {/* 2. Ciblage (Promo & Groupes) */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">🎯 Ciblage Étudiants</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau Cible</label>
                <select
                  value={formData.targetYear}
                  onChange={(e) => setFormData({ ...formData, targetYear: e.target.value, targetGroups: [] })}
                  className="w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {Object.keys(SCHOOL_STRUCTURE).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Sélection des groupes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classes spécifiques (Optionnel)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SCHOOL_STRUCTURE[formData.targetYear]?.map((group) => (
                    <button
                      type="button" // Important pour ne pas submit le form
                      key={group}
                      onClick={() => toggleGroup(group)}
                      className={`
                                         px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2
                                         ${formData.targetGroups.includes(group)
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}
                                     `}
                    >
                      {formData.targetGroups.includes(group) && <span className="text-xs">✓</span>}
                      {group}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.targetGroups.length === 0
                    ? "Si aucune classe n'est sélectionnée, toute la promo sera ciblée."
                    : `${formData.targetGroups.length} classe(s) sélectionnée(s).`
                  }
                </p>
              </div>
            </div>

            {/* 3. Grille d'évaluation (LE COMPOSANT RÉUTILISABLE) */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">Grille de notation</label>
                {isEditing && (
                  <div className="group relative">
                    <AlertTriangle size={14} className="text-orange-500 cursor-help" />
                    <span className="absolute left-6 top-0 w-64 p-2 bg-gray-800 text-white text-xs rounded hidden group-hover:block z-10 shadow-lg">
                      Attention : Modifier la grille alors que des projets sont déjà notés peut fausser les résultats.
                    </span>
                  </div>
                )}
              </div>

              <EvaluationGridEditor
                criteria={formData.evaluationTemplate}
                onChange={(newCriteria) => setFormData({ ...formData, evaluationTemplate: newCriteria })}
              />
            </div>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition">
            Annuler
          </button>
          <button
            type="submit"
            form="campaignForm" // Lie le bouton au formulaire via ID
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : <><Save size={18} /> {isEditing ? 'Mettre à jour' : 'Créer la campagne'}</>}
          </button>
        </div>

      </div>
    </div>
  );
}