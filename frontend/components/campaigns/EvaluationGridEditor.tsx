'use client';

import { Plus, Trash2 } from 'lucide-react';

// ✅ 1. L'interface correspond maintenant à 100% au Schema Mongoose
interface Criterion {
  name: string;
  maxScore: number;  // C'était maxPoints avant
  weight: number;    // Ajout du coefficient
  description?: string;
}

interface Props {
  criteria: Criterion[];
  onChange: (newCriteria: Criterion[]) => void;
}

export function EvaluationGridEditor({ criteria, onChange }: Props) {

  // Ajouter une ligne vide (avec les valeurs par défaut du Back)
  const handleAdd = () => {
    onChange([
      ...criteria, 
      { name: '', maxScore: 20, weight: 1, description: '' }
    ]);
  };

  const handleRemove = (index: number) => {
    const newList = criteria.filter((_, i) => i !== index);
    onChange(newList);
  };

  const handleChange = (index: number, field: keyof Criterion, value: any) => {
    const newList = [...criteria];
    // @ts-ignore (Parfois TS râle sur l'assignation dynamique, on l'ignore ici pour simplifier)
    newList[index] = { ...newList[index], [field]: value };
    onChange(newList);
  };

  // Calcul du total (maxScore * weight ?) ou juste la somme des maxScore
  // Ici je fais la somme simple des Notes Max
  const totalPoints = criteria.reduce((sum, item) => sum + Number(item.maxScore || 0), 0);

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">Critères d'évaluation</h3>
        <span className={`text-sm font-bold px-3 py-1 rounded-full border ${totalPoints === 20 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
          Total Max : {totalPoints} pts
        </span>
      </div>

      <div className="space-y-3">
        {criteria.map((crit, index) => (
          <div key={index} className="flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-bottom-2">
            
            {/* Ligne 1 : Nom, Coeff, Note Max */}
            <div className="flex gap-3 items-center">
                {/* NOM */}
                <input
                    type="text"
                    placeholder="Nom du critère (ex: Qualité Code)"
                    value={crit.name}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    className="flex-1 p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />

                {/* COEFF (Weight) */}
                <div className="w-20">
                    <label className="block text-[10px] text-gray-400 mb-0.5 text-center">Coeff.</label>
                    <input
                        type="number"
                        min="1"
                        value={crit.weight}
                        onChange={(e) => handleChange(index, 'weight', Number(e.target.value))}
                        className="w-full p-1.5 text-sm border border-gray-300 rounded-lg text-center outline-none focus:border-blue-500"
                    />
                </div>

                {/* NOTE MAX (MaxScore) */}
                <div className="w-20">
                    <label className="block text-[10px] text-gray-400 mb-0.5 text-center">Max Pts</label>
                    <input
                        type="number"
                        value={crit.maxScore} // ✅ Modifié ici
                        onChange={(e) => handleChange(index, 'maxScore', Number(e.target.value))} // ✅ Modifié ici
                        className="w-full p-1.5 text-sm border border-gray-300 rounded-lg text-center font-bold outline-none focus:border-blue-500"
                    />
                </div>

                {/* SUPPRIMER */}
                <button
                    onClick={() => handleRemove(index)}
                    className="p-2 mt-4 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Supprimer"
                >
                    <Trash2 size={18} />
                </button>
            </div>
            
            {/* Ligne 2 : Description */}
            <input
                type="text"
                placeholder="Description optionnelle (visible par l'étudiant)"
                value={crit.description || ''}
                onChange={(e) => handleChange(index, 'description', e.target.value)}
                className="w-full p-2 text-xs border border-gray-100 bg-gray-50 text-gray-600 rounded-lg focus:bg-white focus:border-blue-300 outline-none transition-colors"
            />
          </div>
        ))}
      </div>

      <button
        type="button" // Important pour ne pas submit le form parent
        onClick={handleAdd}
        className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus size={16} /> Ajouter un critère
      </button>
    </div>
  );
}