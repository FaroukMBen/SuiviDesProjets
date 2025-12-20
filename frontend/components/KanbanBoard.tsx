'use client';

import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, Calendar, GripVertical } from 'lucide-react'; // Installe lucide-react
import api from '@/lib/auth';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: string;
  type?: 'feature' | 'bug' | 'objectif'; // Ajouté pour le style badge
  assignee?: { name: string };
  dueDate?: string;
  subtasksCount?: string; // Ex: "1/2" comme sur la maquette
}

const COLUMNS = [
  { id: 'todo', label: 'À faire' },
  { id: 'in-progress', label: 'En cours' },
  { id: 'review', label: 'En revue' },
  { id: 'done', label: 'Terminé' }
];

export function KanbanBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour l'ajout rapide
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // États pour le Drag & Drop
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Remplacer par ton vrai endpoint
      const response = await api.get(`/api/tasks/project/${projectId}`);
      setTasks(response.data.tasks);
    } catch (err) {
      console.error("Erreur chargement tâches", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (status: string) => {
    if (!newTaskTitle.trim()) return;
    try {
      const response = await api.post('/api/tasks', { projectId, title: newTaskTitle, status, type: 'objectif' }); // Type par défaut
      setTasks([...tasks, response.data.task]);
      setNewTaskTitle('');
      setIsAdding(null);
    } catch (err) {
      alert("Erreur création tâche");
    }
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    // Mise à jour optimiste (UI d'abord)
    const updatedTasks = tasks.map(t => 
      t._id === draggedTaskId ? { ...t, status: status as any } : t
    );
    setTasks(updatedTasks);
    setDraggedTaskId(null);

    // Appel API
    try {
      await api.put(`/api/tasks/${draggedTaskId}`, { status });
    } catch (err) {
      console.error("Erreur update status", err);
      fetchTasks(); // Revert si erreur
    }
  };

  // Helper pour la couleur du badge (comme sur la maquette)
  const getBadgeStyle = (type?: string) => {
    switch (type) {
      case 'objectif': return 'bg-emerald-100 text-emerald-700';
      case 'bug': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700'; // Default "Feature" jaune
    }
  };

  if (loading) return <div className="animate-pulse flex gap-6 mt-4">{[1,2,3,4].map(i => <div key={i} className="flex-1 h-96 bg-gray-100 rounded-xl"></div>)}</div>;

  return (
    <div>
      {/* Barre d'info conceptuelle comme sur la maquette */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-gray-500 italic">
          Glisser-déposer les tâches pour changer leur statut.
        </p>
        <button 
          onClick={() => setIsAdding('todo')} // Ouvre l'ajout dans la première colonne par défaut
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={16} />
          Ajouter tâche
        </button>
      </div>

      {/* Grid des Colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-[calc(100vh-250px)] overflow-hidden">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);
          
          return (
            <div 
              key={col.id}
              className="flex flex-col h-full rounded-xl bg-white border border-gray-200 shadow-sm" // Fond blanc qui "pop"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Header Colonne */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-700 text-sm">{col.label}</h3>
                  <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {colTasks.length}
                  </span>
                </div>
                <div className="flex gap-1">
                   <button 
                     onClick={() => setIsAdding(col.id)}
                     className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-700 transition"
                   >
                     <Plus size={16} />
                   </button>
                   <button className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-700 transition">
                     <MoreHorizontal size={16} />
                   </button>
                </div>
              </div>

              {/* Zone de Tâches (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                
                {/* Zone d'ajout rapide (Input) */}
                {isAdding === col.id && (
                  <div className="bg-white p-3 rounded-xl border-2 border-blue-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                    <input
                      autoFocus
                      placeholder="Nom de la tâche..."
                      className="w-full text-sm font-medium text-gray-900 placeholder-gray-400 outline-none mb-3"
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      onKeyDown={e => {
                        if(e.key === 'Enter') handleCreateTask(col.id);
                        if(e.key === 'Escape') setIsAdding(null);
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setIsAdding(null)} className="px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded">Annuler</button>
                      <button onClick={() => handleCreateTask(col.id)} className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">Ajouter</button>
                    </div>
                  </div>
                )}

                {/* Liste des Cartes */}
                {colTasks.map((task) => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={() => setDraggedTaskId(task._id)}
                    className="group bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing"
                  >
                    {/* Header Carte : Badge + Date */}
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide ${getBadgeStyle(task.type || 'objectif')}`}>
                        {task.type || 'Objectif'}
                      </span>
                      {task.dueDate ? (
                        <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                          pour le {new Date(task.dueDate).toLocaleDateString(undefined, {month:'2-digit', day:'2-digit'})}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-medium italic">Non défini</span>
                      )}
                    </div>

                    {/* Titre */}
                    <h4 className="text-sm font-bold text-gray-800 mb-4 leading-tight">
                      {task.title}
                    </h4>

                    {/* Footer : Avatar + ID */}
                    <div className="flex justify-between items-center border-t border-gray-50 pt-3 mt-2">
                       {/* Avatar */}
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold border border-white shadow-sm" title={task.assignee?.name}>
                           {task.assignee?.name ? task.assignee.name[0] : '?'}
                         </div>
                         <span className="text-xs text-gray-400 truncate max-w-[80px]">
                           {task.assignee?.name || 'Non assigné'}
                         </span>
                       </div>

                       {/* Subtask Count ou ID */}
                       <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                         {task.subtasksCount || '0/1'}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}