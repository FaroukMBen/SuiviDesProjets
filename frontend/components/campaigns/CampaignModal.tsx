'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth';
import { X, Save, AlertTriangle, FileText, UploadCloud, File, Trash2 } from 'lucide-react';
import { EvaluationGridEditor } from './EvaluationGridEditor';
import { useToast } from '@/components/ui/Toast';

import { SCHOOL_STRUCTURE } from '@/lib/constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (campaign: any) => void;
  campaignToEdit?: any;
}

export function CampaignModal({ isOpen, onClose, onSuccess, campaignToEdit }: Props) {
  const isEditing = !!campaignToEdit;
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();


  const initialState = {
    title: '',
    academicYear: '2025-2026',
    description: '',
    startDate: '',
    endDate: '',
    targetYear: 'BUT1',
    targetGroups: [] as string[],
    status: 'draft',
    evaluationTemplate: []
  };

  const [formData, setFormData] = useState<any>(initialState);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (campaignToEdit) {
        setFormData({
          ...campaignToEdit,
          endDate: campaignToEdit.endDate ? campaignToEdit.endDate.split('T')[0] : '',
          startDate: campaignToEdit.startDate ? campaignToEdit.startDate.split('T')[0] : '',
          targetGroups: campaignToEdit.targetGroups || [] // Sécurité
        });
        setSelectedFiles([]); // Reset files on edit open
      } else {
        setFormData(initialState);
        setSelectedFiles([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    const cleanTemplate = formData.evaluationTemplate.filter(
      (c: any) => c.name && c.name.trim() !== ''
    );

    // 2. SÉCURITÉ : On vérifie qu'il reste au moins un critère
    if (cleanTemplate.length === 0) {
      showToast("La grille d'évaluation doit contenir au moins un critère valide.", "error");
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
      let campaignId;

      if (isEditing) {
        res = await api.put(`/api/campaigns/${campaignToEdit._id}`, dataToSend);
        campaignId = campaignToEdit._id;
      } else {
        res = await api.post('/api/campaigns', dataToSend);
        campaignId = res.data.campaign._id;
      }

      // Upload Files if any
      if (selectedFiles.length > 0 && campaignId) {
        try {
          await Promise.all(selectedFiles.map(file => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name);
            return api.post(`/api/campaigns/${campaignId}/resources`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          }));
          showToast(`Campagne ${isEditing ? 'modifiée' : 'créée'} avec ${selectedFiles.length} fichier(s)`, "success");
        } catch (uploadErr) {
          console.error("Upload error", uploadErr);
          showToast("Campagne créée mais erreur lors de l'upload des fichiers", "warning");
        }
      } else {
        showToast(`Campagne ${isEditing ? 'modifiée' : 'créée'} avec succès`, "success");
      }

      // On refusech le tout pour être sûr
      if (res.data && res.data.campaign) {
        onSuccess(res.data.campaign);
      } else {
        // Fallback si l'API retourne pas l'objet complet immédiatement (rare)
        onSuccess(dataToSend);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || "Erreur lors de l'enregistrement", "error");
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

        {/* Formulaire  */}
        <div className="p-6 overflow-y-auto">
          <form id="campaignForm" onSubmit={handleSubmit} className="space-y-6">

            {/* 1. Infos Générales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                <input
                  required type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-gray-900 mb-3"
                  placeholder="Ex: Projets Tutorés S4 2025"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
                
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de la bannière (Optionnel)</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-gray-900 mb-3"
                  placeholder="Ex: https://images.unsplash.com/photo-..."
                  value={formData.banner || ''}
                  onChange={e => setFormData({ ...formData, banner: e.target.value })}
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optionnel)</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-gray-900"
                  placeholder="Description du projet..."
                  rows={2}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Début</label>
                  <input
                    required type="date"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold text-gray-700 transition-all"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Fin</label>
                  <input
                    required type="date"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold text-gray-700 transition-all"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Année Scolaire</label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-gray-700 transition-all"
                >
                  <option>2024-2025</option>
                  <option>2025-2026</option>
                  <option>2026-2027</option>
                </select>
              </div>
              <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg border border-green-100">
                <input
                  type="checkbox"
                  id="activeCheck"
                  className="rounded-lg" // Class added to support global CSS
                  checked={formData.status === 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'draft' })}
                />
                <label htmlFor="activeCheck" className="text-sm font-medium text-green-900 cursor-pointer">
                  Activer immédiatement cette campagne
                  <span className="block text-xs text-green-600 font-normal">
                    Les étudiants pourront voir et rejoindre la campagne dès sa création.
                  </span>
                </label>
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
                  className="w-full rounded-xl border border-gray-100 bg-white p-2.5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-gray-700 transition-all"
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

            {/* 4. Ressources de référence (Optionnel) */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                Ressources de référence
              </h3>

              <p className="text-xs text-gray-500 mb-4">
                Vous pouvez ajouter des sujets, consignes ou tout document utile pour les étudiants dès la création de la campagne.
              </p>

              <div className="space-y-3">
                {/* Upload button */}
                <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 hover:border-blue-400 cursor-pointer transition bg-white/50">
                  <UploadCloud className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">Ajouter des fichiers</span>
                  <input type="file" multiple onChange={handleFileChange} className="hidden" />
                </label>

                {/* File List */}
                {selectedFiles.length > 0 && (
                  <ul className="space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <li key={idx} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <File size={16} className="text-blue-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate font-medium">{file.name}</span>
                          <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          </form>
        </div>

        {/* Footer  */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition">
            Annuler
          </button>
          <button
            type="submit"
            form="campaignForm"
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