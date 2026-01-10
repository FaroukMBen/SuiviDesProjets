'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, MoreHorizontal, Calendar, GripVertical, Trash2, Pencil, X, User as UserIcon } from 'lucide-react'; // Installe lucide-react
import api from '@/lib/auth';

interface Member {
  _id: string;
  name: string;
  email: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: string;
  type?: 'feature' | 'bug' | 'objectif'; // Ajouté pour le style badge
  assignee?: Member;
  dueDate?: string;
  reminderDelay?: number; // 1, 2, 3, or 7
  subtasksCount?: string;
}

const COLUMNS = [
  { id: 'todo', label: 'À faire' },
  { id: 'in-progress', label: 'En cours' },
  { id: 'review', label: 'En revue' },
  { id: 'done', label: 'Terminé' }
];

export function KanbanBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]); // Ajout état membres
  const [loading, setLoading] = useState(true);

  // États pour l'ajout rapide
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>(''); // Ajout état nouvel assigné
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');   // Ajout état date creation

  // États pour l'édition et suppression
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // États pour le Drag & Drop
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchProjectMembers()]);
      setLoading(false);
    };
    init();
  }, [projectId]);

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get(`/api/tasks/project/${projectId}`);
      setTasks(response.data.tasks);
    } catch (err) {
      console.error("Erreur chargement tâches", err);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const response = await api.get(`/api/projects/${projectId}`);
      const project = response.data.project;
      // Combiner owner et members pour la liste complète
      const allMembers = [project.owner, ...project.members].filter((v, i, a) => a.findIndex(v2 => (v2._id === v._id)) === i); // Unique
      setMembers(allMembers);
    } catch (err) {
      console.error("Erreur chargement membres", err);
    }
  }

  const handleCreateTask = async (status: string) => {
    if (!newTaskTitle.trim()) return;
    try {
      const payload: any = {
        projectId,
        title: newTaskTitle,
        status,
        type: 'objectif' // Default type kept for backend compatibility but hidden from UI
      };
      if (newTaskAssignee) payload.assignee = newTaskAssignee;
      if (newTaskDueDate) payload.dueDate = newTaskDueDate;

      const response = await api.post('/api/tasks', payload);
      setTasks([...tasks, response.data.task]);

      // Reset form
      setNewTaskTitle('');
      setNewTaskAssignee('');
      setNewTaskDueDate('');
      setIsAdding(null);
    } catch (err) {
      alert("Erreur création tâche");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      console.error("Erreur suppression tâche", err);
      alert("Impossible de supprimer la tâche");
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      // Préparer l'objet pour l'API (l'assignee doit être un ID, pas l'objet complet s'il n'a pas changé... 
      // mais le backend attend un ID. Si updatedTask.assignee est peuplé (objet), on veut son ID.
      const payload = {
        ...updatedTask,
        assignee: (updatedTask.assignee as any)?._id || updatedTask.assignee
      };

      const response = await api.put(`/api/tasks/${updatedTask._id}`, payload);

      // Mettre à jour l'état local avec la nouvelle tâche retournée (qui a le bon populate)
      setTasks(tasks.map(t => t._id === updatedTask._id ? response.data.task : t));
      setEditingTask(null);
    } catch (err) {
      console.error("Erreur modification tâche", err);
      alert("Impossible de modifier la tâche");
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

  if (loading) return <div className="animate-pulse flex gap-6 mt-4">{[1, 2, 3, 4].map(i => <div key={i} className="flex-1 h-96 bg-gray-100 rounded-xl"></div>)}</div>;

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

      {/* Grid des Colonnes - REMOVED fixed height and overflow hidden */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col h-auto min-h-[500px] rounded-xl bg-white border border-gray-200 shadow-sm" // Changed h-full to h-auto min-h
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
                </div>
              </div>

              {/* Zone de Tâches - REMOVED flex-1 overflow-y-auto to allow expansion */}
              <div className="p-3 space-y-3">

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
                        if (e.key === 'Enter') handleCreateTask(col.id);
                        if (e.key === 'Escape') setIsAdding(null);
                      }}
                    />

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Selecteur d'assignee rapide */}
                      <select
                        value={newTaskAssignee}
                        onChange={e => setNewTaskAssignee(e.target.value)}
                        className="text-xs text-gray-600 border border-gray-200 rounded p-1 outline-none"
                      >
                        <option value="">-- Assigner --</option>
                        {members.map(m => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                      </select>

                      {/* Date rapide */}
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={e => setNewTaskDueDate(e.target.value)}
                        className="text-xs text-gray-600 border border-gray-200 rounded p-1 outline-none"
                      />
                    </div>

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
                    style={{ zIndex: menuOpenId === task._id ? 20 : 0 }}
                    className="group bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing relative"
                  >

                    {/* LIGNE 1 : Titre + Menu */}
                    <div className="flex justify-between items-start mb-2 gap-2">
                      {/* Titre */}
                      <h4 className="text-sm font-bold text-gray-800 leading-tight flex-1 pt-1">
                        {task.title}
                      </h4>

                      {/* Menu 3 points (Absolute top-right ou flex-end) */}
                      <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            setMenuOpenId(menuOpenId === task._id ? null : task._id);
                          }}
                          className="p-1 -mr-2 -mt-2 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpenId === task._id && (
                          <div className="absolute right-0 top-6 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-10 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left">
                            <button
                              onClick={() => {
                                setEditingTask(task);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                            >
                              <Pencil size={12} /> Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task._id)}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 size={12} /> Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* LIGNE 2 : Footer (Assigné + Date) */}
                    <div className="flex justify-between items-center border-t border-gray-50 pt-3 mt-2">
                      {/* Avatar + Nom */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold border border-white shadow-sm" title={task.assignee?.name}>
                          {task.assignee?.name ? task.assignee.name[0] : '?'}
                        </div>
                        <span className="text-xs text-gray-400 truncate max-w-[80px]">
                          {task.assignee?.name || 'Non assigné'}
                        </span>
                      </div>

                      {/* Date à droite */}
                      {task.dueDate && (
                        <span className={`text-[10px] font-medium flex items-center gap-1 ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-gray-400'
                          }`}>
                          <Calendar size={10} />
                          {new Date(task.dueDate).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal d'édition SIMPLIFIÉ */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Modifier la tâche</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTask(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Titre</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              {/* Assigné à */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Assigné à</label>
                <select
                  value={(editingTask.assignee as any)?._id || (typeof editingTask.assignee === 'string' ? editingTask.assignee : '') || ''}
                  onChange={e => {
                    const memberId = e.target.value;
                    const member = members.find(m => m._id === memberId);
                    setEditingTask({ ...editingTask, assignee: member });
                  }}
                  className="w-full p-2 rounded-lg border border-gray-200 bg-white"
                >
                  <option value="">-- Non assigné --</option>
                  {members.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Échéance */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Échéance</label>
                <input
                  type="date"
                  value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  className="w-full p-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                />
              </div>

              {/* Rappel (Conditionnel à l'existence d'une échéance) */}
              {editingTask.dueDate && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Rappel</label>
                  <select
                    value={editingTask.reminderDelay || 1}
                    onChange={e => setEditingTask({ ...editingTask, reminderDelay: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-gray-200 bg-white focus:border-blue-500 outline-none"
                  >
                    {[1, 2, 3, 7].map(d => (
                      <option key={d} value={d}>
                        {d} jour{d > 1 ? 's' : ''} avant
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  onClick={() => setEditingTask(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUpdateTask(editingTask)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-md shadow-blue-200 transition"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}