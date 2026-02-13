'use client';

import { Plus, Trash2, CornerDownRight, Info } from 'lucide-react';
import { useEffect } from 'react';

export interface SubCriterion {
  name: string;
  maxScore: number;
  weight: number;
  description?: string;
}

export interface Criterion {
  name: string;
  maxScore: number;
  weight: number; // Coeff
  description?: string;
  subCriteria?: SubCriterion[];
}

interface Props {
  criteria: Criterion[];
  onChange: (newCriteria: Criterion[]) => void;
}

export function EvaluationGridEditor({ criteria, onChange }: Props) {

  // Auto-recalculate parent maxScore when subCriteria change
  useEffect(() => {
    let changed = false;
    const newCriteria = criteria.map(crit => {
      if (crit.subCriteria && crit.subCriteria.length > 0) {
        const sumSubDetails = crit.subCriteria.reduce((acc, sub) => acc + (sub.maxScore || 0), 0);
        if (crit.maxScore !== sumSubDetails) {
          changed = true;
          return { ...crit, maxScore: sumSubDetails };
        }
      }
      return crit;
    });

    if (changed) {
      onChange(newCriteria);
    }
  }, [criteria, onChange]);

  const handleAdd = () => {
    onChange([
      ...criteria,
      { name: '', maxScore: 20, weight: 1, description: '', subCriteria: [] }
    ]);
  };

  const handleRemove = (index: number) => {
    const newList = criteria.filter((_, i) => i !== index);
    onChange(newList);
  };

  const handleChange = (index: number, field: keyof Criterion, value: any) => {
    const newList = [...criteria];
    // @ts-ignore
    newList[index] = { ...newList[index], [field]: value };
    onChange(newList);
  };

  // --- Sub Criteria Handlers ---

  const handleAddSub = (parentIndex: number) => {
    const newList = [...criteria];
    const parent = newList[parentIndex];
    // Init subCriteria array if undefined
    const currentSubs = parent.subCriteria || [];

    newList[parentIndex] = {
      ...parent,
      subCriteria: [...currentSubs, { name: '', maxScore: 5, weight: 1, description: '' }]
    };

    onChange(newList);
  };

  const handleRemoveSub = (parentIndex: number, subIndex: number) => {
    const newList = [...criteria];
    const parent = newList[parentIndex];
    if (!parent.subCriteria) return;

    const newSubs = parent.subCriteria.filter((_, i) => i !== subIndex);
    newList[parentIndex] = { ...parent, subCriteria: newSubs };
    onChange(newList);
  };

  const handleChangeSub = (parentIndex: number, subIndex: number, field: keyof SubCriterion, value: any) => {
    const newList = [...criteria];
    const parent = newList[parentIndex];
    if (!parent.subCriteria) return;

    const newSubs = [...parent.subCriteria];
    // @ts-ignore
    newSubs[subIndex] = { ...newSubs[subIndex], [field]: value };

    newList[parentIndex] = { ...parent, subCriteria: newSubs };
    onChange(newList);
  };


  const totalPoints = criteria.reduce((sum, item) => sum + Number(item.maxScore || 0), 0);

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">Critères d'évaluation</h3>
        <span className={`text-sm font-bold px-3 py-1 rounded-full border ${totalPoints === 20 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
          Total Max : {totalPoints} pts
        </span>
      </div>

      <div className="space-y-4">
        {criteria.map((crit, index) => {
          const hasSubCriteria = crit.subCriteria && crit.subCriteria.length > 0;

          return (
            <div key={index} className="flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2">

              {/* Ligne 1 : Parent Principal */}
              <div className="flex gap-3 items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Catégorie / Critère principal"
                      value={crit.name}
                      onChange={(e) => handleChange(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 font-bold text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Description générale (optionnelle)"
                    value={crit.description || ''}
                    onChange={(e) => handleChange(index, 'description', e.target.value)}
                    className="w-full text-xs text-gray-500 border-b border-transparent focus:border-gray-300 outline-none bg-transparent placeholder-gray-300 pb-1"
                  />
                </div>

                {/* COEFF */}
                <div className="w-16">
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5 text-center">Coeff.</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={crit.weight}
                    onChange={(e) => handleChange(index, 'weight', Number(e.target.value))}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg text-center outline-none focus:border-blue-500 bg-gray-50"
                  />
                </div>

                {/* NOTE MAX */}
                <div className="w-16">
                  <label className="block text-[9px] uppercase font-bold text-gray-400 mb-0.5 text-center">Total</label>
                  <input
                    type="number"
                    value={crit.maxScore}
                    onChange={(e) => handleChange(index, 'maxScore', Number(e.target.value))}
                    disabled={hasSubCriteria} // Désactivé si calculé via sous-critères
                    className={`w-full p-2 text-sm border border-gray-300 rounded-lg text-center font-bold outline-none focus:border-blue-500 
                              ${hasSubCriteria ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition mt-4"
                  title="Supprimer ce bloc"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Sous-critères */}
              <div className="pl-6 mt-2 space-y-2 border-l-2 border-gray-100 ml-2">
                {crit.subCriteria?.map((sub, subIdx) => (
                  <div key={subIdx} className="flex gap-2 items-center group">
                    <CornerDownRight size={14} className="text-gray-300 shrink-0" />

                    <div className="flex-1 flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Sous-critère (ex: Orthographe)"
                        value={sub.name}
                        onChange={(e) => handleChangeSub(index, subIdx, 'name', e.target.value)}
                        className="w-full p-1.5 text-sm border border-gray-200 rounded focus:border-blue-400 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Description (optionnelle)"
                        value={sub.description || ''}
                        onChange={(e) => handleChangeSub(index, subIdx, 'description', e.target.value)}
                        className="w-full text-xs text-gray-400 bg-transparent outline-none placeholder-gray-200"
                      />
                    </div>

                    {/* Note Max du sous-critère */}
                    <div className="w-16">
                      <input
                        type="number"
                        placeholder="Pts"
                        value={sub.maxScore}
                        onChange={(e) => handleChangeSub(index, subIdx, 'maxScore', Number(e.target.value))}
                        className="w-full p-1.5 text-sm border border-gray-200 rounded text-center outline-none focus:border-blue-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSub(index, subIdx)}
                      className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                {/* Bouton Ajouter Sous-critère */}
                <button
                  type="button"
                  onClick={() => handleAddSub(index)}
                  className="flex items-center gap-2 text-xs font-semibold text-blue-500 hover:text-blue-700 mt-2 px-2 py-1 rounded hover:bg-blue-50 transition w-fit"
                >
                  <Plus size={12} /> Ajouter un sous-critère
                </button>
              </div>

            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className="mt-6 w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus size={18} /> Ajouter une catégorie principale
      </button>

      <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
        <Info size={12} />
        Si vous ajoutez des sous-critères, le total de la catégorie sera la somme des points définis pour chaque sous-critère.
      </p>
    </div>
  );
}