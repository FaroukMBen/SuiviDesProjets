'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/auth';
import { Card } from '@/components/ui/Card'; // Ta carte standard
import { 
  Trophy, 
  Target, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Save, 
  X,
  FileText,
  User
} from 'lucide-react';

interface Criterion {
  name: string;
  weight: number;
  maxScore: number;
  score?: number;
}

interface Evaluation {
  _id: string;
  evaluator: { name: string; email: string };
  criteria: Criterion[];
  totalScore: number;
  feedback: string;
  status: 'draft' | 'completed';
}

export function EvaluationGrid({ projectId, userRole }: { projectId: string; userRole?: string }) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    criteria: [{ name: '', weight: 1, maxScore: 20, score: 0 }],
    feedback: ''
  });

  useEffect(() => {
    fetchEvaluations();
  }, [projectId]);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/evaluations/project/${projectId}`);
      setEvaluations(response.data.evaluations);
    } catch (err) {
      console.error("Erreur chargement évaluations", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Gestion du Formulaire ---
  const handleCriteriaChange = (index: number, field: string, value: any) => {
    const newCriteria: any = [...formData.criteria];
    newCriteria[index][field] = value;
    setFormData({ ...formData, criteria: newCriteria });
  };

  const addCriterion = () => {
    setFormData({
      ...formData,
      criteria: [...formData.criteria, { name: '', weight: 1, maxScore: 20, score: 0 }]
    });
  };

  const removeCriterion = (index: number) => {
    setFormData({
      ...formData,
      criteria: formData.criteria.filter((_, i) => i !== index)
    });
  };

  const submitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/evaluations', { projectId, ...formData });
      setEvaluations([...evaluations, response.data.evaluation]);
      setShowForm(false);
      // Reset form
      setFormData({ criteria: [{ name: '', weight: 1, maxScore: 20, score: 0 }], feedback: '' });
    } catch (err) {
      alert("Erreur lors de l'enregistrement de l'évaluation");
    }
  };

  const calculateAverage = () => {
    if (evaluations.length === 0) return 0;
    const sum = evaluations.reduce((acc, curr) => acc + curr.totalScore, 0);
    return (sum / evaluations.length).toFixed(1); // 1 décimale
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-32 bg-gray-100 rounded-xl"></div></div>;

  return (
    <div className="space-y-8">
      
      {/* 1. KPIs (Indicateurs Clés) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase">Total Évaluations</p>
            <p className="text-3xl font-bold text-gray-900">{evaluations.length}</p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase">Moyenne Globale</p>
            <p className="text-3xl font-bold text-gray-900">{calculateAverage()} <span className="text-sm text-gray-400 font-normal">/ 20</span></p>
          </div>
        </Card>
        
        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-purple-500">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase">Statut</p>
            <p className="text-lg font-bold text-gray-900">
              {evaluations.length > 0 ? 'Noté' : 'En attente'}
            </p>
          </div>
        </Card>
      </div>

      {/* 2. Formulaire Enseignant (Conditionnel) */}
      {(userRole === 'instructor' || userRole === 'admin') && (
        <div className="mb-8">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition shadow-lg shadow-gray-200"
            >
              <Plus size={18} />
              Nouvelle Évaluation
            </button>
          ) : (
            <Card className="border-blue-200 shadow-md overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                 <h3 className="font-bold text-gray-900 flex items-center gap-2">
                   <Target className="text-blue-600" size={20} />
                   Grille d'évaluation
                 </h3>
                 <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-red-500 transition">
                   <X size={20} />
                 </button>
              </div>
              
              <form onSubmit={submitEvaluation} className="p-6 space-y-6">
                {/* Liste des critères */}
                <div className="space-y-4">
                  {formData.criteria.map((criterion, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-4 items-end p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex-1 w-full">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Critère</label>
                        <input
                          type="text"
                          placeholder="Ex: Qualité du code"
                          value={criterion.name}
                          onChange={(e) => handleCriteriaChange(idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-medium"
                          required
                        />
                      </div>
                      
                      <div className="w-24">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Coeff.</label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={criterion.weight}
                          onChange={(e) => handleCriteriaChange(idx, 'weight', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                        />
                      </div>

                      <div className="w-24">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Max</label>
                        <input
                          type="number"
                          value={criterion.maxScore}
                          onChange={(e) => handleCriteriaChange(idx, 'maxScore', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 outline-none text-sm"
                          readOnly // Souvent fixe, ou modifiable si besoin
                        />
                      </div>

                      <div className="w-24">
                        <label className="text-xs font-bold text-blue-600 uppercase mb-1 block">Note</label>
                        <input
                          type="number"
                          min="0"
                          max={criterion.maxScore}
                          value={criterion.score}
                          onChange={(e) => handleCriteriaChange(idx, 'score', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border-2 border-blue-100 bg-white rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-bold text-blue-700"
                          required
                        />
                      </div>

                      {formData.criteria.length > 1 && (
                        <button type="button" onClick={() => removeCriterion(idx)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition mb-[2px]">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addCriterion}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus size={16} /> Ajouter un critère
                </button>

                {/* Feedback Global */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Appréciation globale</label>
                  <textarea
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none resize-none text-sm"
                    placeholder="Commentaire général sur le projet..."
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                  >
                    <Save size={16} /> Enregistrer la note
                  </button>
                </div>
              </form>
            </Card>
          )}
        </div>
      )}

      {/* 3. Liste des Évaluations (Affichage) */}
      <div className="space-y-6">
        {evaluations.length === 0 && !showForm ? (
           <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
             <div className="mx-auto w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-3">
               <FileText size={24} />
             </div>
             <p className="text-gray-500 font-medium">Aucune évaluation publiée.</p>
           </div>
        ) : (
          evaluations.map((evaluation) => (
            <Card key={evaluation._id} className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-all">
              {/* Header Évaluation */}
              <div className="bg-gray-50/50 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    {evaluation.evaluator?.name?.[0] || <User size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Évalué par {evaluation.evaluator?.name}</p>
                    <p className="text-xs text-gray-500">{evaluation.evaluator?.email}</p>
                  </div>
                </div>
                
                <div className="text-right flex items-center gap-4">
                  <div className="flex flex-col items-end">
                     <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Note Finale</span>
                     <span className="text-3xl font-black text-gray-900">{evaluation.totalScore} <span className="text-lg text-gray-400 font-normal">/ 20</span></span>
                  </div>
                  {evaluation.status === 'completed' && (
                    <CheckCircle className="text-emerald-500" size={28} />
                  )}
                </div>
              </div>

              {/* Détails Critères */}
              <div className="p-6 space-y-5">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Target size={16} className="text-gray-400" />
                  Détail de la notation
                </h4>
                
                <div className="space-y-4">
                  {evaluation.criteria.map((criterion, idx) => {
                    const percentage = (criterion.score || 0) / criterion.maxScore * 100;
                    return (
                      <div key={idx} className="group">
                        <div className="flex justify-between items-end mb-1">
                           <div>
                             <span className="font-medium text-gray-800 text-sm">{criterion.name}</span>
                             <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Coef. {criterion.weight}</span>
                           </div>
                           <span className="font-bold text-sm text-gray-900">
                             {criterion.score} <span className="text-gray-400 font-normal">/ {criterion.maxScore}</span>
                           </span>
                        </div>
                        {/* Barre de progression */}
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              percentage >= 80 ? 'bg-emerald-500' :
                              percentage >= 50 ? 'bg-blue-500' : 
                              'bg-orange-500'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Feedback Textuel */}
                {evaluation.feedback && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <h5 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-1">
                      <FileText size={14} /> Feedback de l'enseignant
                    </h5>
                    <p className="text-sm text-blue-900 italic leading-relaxed">
                      "{evaluation.feedback}"
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}