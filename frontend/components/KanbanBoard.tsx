'use client';

import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, Calendar, GripVertical, Trash2, Pencil, X, User as UserIcon } from 'lucide-react'; // Installe lucide-react
import api from '@/lib/auth';
import { useAuthStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

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
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]); // Ajout état membres
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { confirm } = useConfirm();

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
      showToast("Tâche créée avec succès", "success");
    } catch (err) {
      showToast("Erreur création tâche", "error");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!await confirm({ title: "Supprimer la tâche", message: "Voulez-vous vraiment supprimer cette tâche ?", type: "danger", confirmText: "Supprimer" })) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
      showToast("Tâche supprimée", "success");
    } catch (err) {
      console.error("Erreur suppression tâche", err);
      showToast("Impossible de supprimer la tâche", "error");
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
      showToast("Tâche modifiée", "success");
    } catch (err) {
      console.error("Erreur modification tâche", err);
      showToast("Impossible de modifier la tâche", "error");
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

  const isModern = user?.theme === 'modern';

  if (isModern) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-gray-500 font-medium">
            Organisez vos tâches avec le tableau interactif <span className="text-blue-600 font-bold">Premium</span>.
          </p>
          <button
            onClick={() => setIsAdding('todo')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-sm font-black hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/20 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={18} strokeWidth={3} />
            Nouvelle Tâche
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-start">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter(t => t.status === col.id);
            const colColors: Record<string, string> = {
              'todo': 'bg-gray-100 text-gray-600',
              'in-progress': 'bg-blue-100 text-blue-600 border-blue-200',
              'review': 'bg-purple-100 text-purple-600 border-purple-200',
              'done': 'bg-emerald-100 text-emerald-600 border-emerald-200'
            };

            return (
              <div
                key={col.id}
                className="flex flex-col min-h-[600px] rounded-[2rem] bg-gray-50/50 border border-gray-100/50 p-5 transition-all"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-gray-800 text-xs uppercase tracking-[0.2em]">{col.label}</h3>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${colColors[col.id] || 'bg-gray-100 text-gray-600'}`}>
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsAdding(col.id)}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Modale d'ajout rapide (Modern) */}
                  {isAdding === col.id && (
                    <div className="bg-white p-6 rounded-3xl border-2 border-blue-100 shadow-2xl shadow-blue-500/5 animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                      <input
                        autoFocus
                        placeholder="Qu'y a-t-il à faire ?"
                        className="w-full text-sm font-black text-gray-900 placeholder-gray-300 outline-none mb-4 bg-transparent"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleCreateTask(col.id);
                          if (e.key === 'Escape') setIsAdding(null);
                        }}
                      />

                      <div className="grid grid-cols-1 gap-3 mb-5">
                        <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                          <UserIcon size={16} className="text-gray-400" />
                          <select
                            value={newTaskAssignee}
                            onChange={e => setNewTaskAssignee(e.target.value)}
                            className="bg-transparent text-sm font-bold text-gray-700 w-full outline-none"
                          >
                            <option value="">Assigner à...</option>
                            {members.map(m => (
                              <option key={m._id} value={m._id}>{m.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                          <Calendar size={16} className="text-gray-400" />
                          <input
                            type="date"
                            value={newTaskDueDate}
                            onChange={e => setNewTaskDueDate(e.target.value)}
                            className="bg-transparent text-sm font-bold text-gray-700 w-full outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => setIsAdding(null)} className="px-4 py-2 text-xs font-black text-gray-400 hover:text-gray-600">Annuler</button>
                        <button onClick={() => handleCreateTask(col.id)} className="px-5 py-2 text-xs font-black bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">Créer</button>
                      </div>
                    </div>
                  )}

                  {colTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={() => setDraggedTaskId(task._id)}
                      className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-[0_20px_40px_-15_rgba(0,0,0,0.06)] hover:border-blue-200 transition-all duration-300 cursor-grab active:cursor-grabbing relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-4 bottom-4 w-1.5 bg-transparent group-hover:bg-blue-600 rounded-r-full transition-all duration-300"></div>

                      <div className="flex justify-between items-start mb-4 gap-3">
                        <h4 className="text-sm font-black text-gray-900 leading-snug group-hover:text-blue-700 transition-colors">
                          {task.title}
                        </h4>

                        <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                              setMenuOpenId(menuOpenId === task._id ? null : task._id);
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded-xl text-gray-300 hover:text-blue-600 transition-all"
                          >
                            <MoreHorizontal size={18} />
                          </button>

                          {menuOpenId === task._id && (
                            <div className="absolute right-0 top-8 w-44 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 py-2 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setMenuOpenId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-black text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3"
                              >
                                <Pencil size={14} strokeWidth={2.5} /> Modifier
                              </button>
                              <div className="mx-3 my-1 border-t border-gray-50"></div>
                              <button
                                onClick={() => handleDeleteTask(task._id)}
                                className="w-full text-left px-4 py-2.5 text-xs font-black text-red-600 hover:bg-red-50 flex items-center gap-3"
                              >
                                <Trash2 size={14} strokeWidth={2.5} /> Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md">
                            {task.assignee?.name ? task.assignee.name[0].toUpperCase() : '?'}
                          </div>
                          <span className="text-[11px] font-black text-gray-500 truncate max-w-[80px]">
                            {task.assignee?.name || 'Inconnu'}
                          </span>
                        </div>

                        {task.dueDate && (
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border ${new Date(task.dueDate) < new Date() && task.status !== 'done'
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-gray-50 text-gray-400 border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors'
                            }`}>
                            <Calendar size={12} strokeWidth={2.5} />
                            {new Date(task.dueDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && !isAdding && (
                    <div className="text-center py-10 rounded-3xl border-2 border-dashed border-gray-100 bg-white/30">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Libre</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col h-auto min-h-[500px] rounded-xl bg-gray-50/10 border border-gray-200 shadow-sm"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Header Colonne */}
              <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-white rounded-t-xl">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-700 text-sm">{col.label}</h3>
                  <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {colTasks.length}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setIsAdding(col.id)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Zone de Tâches */}
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
                      <select
                        value={newTaskAssignee}
                        onChange={e => setNewTaskAssignee(e.target.value)}
                        className="text-xs text-gray-600 border border-gray-100 bg-gray-50 rounded p-1.5 outline-none focus:border-blue-300"
                      >
                        <option value="">-- Assigner --</option>
                        {members.map(m => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={e => setNewTaskDueDate(e.target.value)}
                        className="text-xs text-gray-600 border border-gray-100 bg-gray-50 rounded p-1.5 outline-none focus:border-blue-300"
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
                    className="group bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-transparent group-hover:bg-blue-500 rounded-r-full transition-all"></div>

                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h4 className="text-sm font-bold text-gray-800 leading-tight flex-1">
                        {task.title}
                      </h4>
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            setMenuOpenId(menuOpenId === task._id ? null : task._id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {menuOpenId === task._id && (
                          <div className="absolute right-0 top-6 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-10 py-1 text-xs text-left">
                            <button onClick={() => { setEditingTask(task); setMenuOpenId(null); }} className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2"><Pencil size={12} /> Modifier</button>
                            <button onClick={() => handleDeleteTask(task._id)} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} /> Supprimer</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-50 pt-3 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold border border-white">
                          {task.assignee?.name ? task.assignee.name[0] : '?'}
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold truncate max-w-[80px]">
                          {task.assignee?.name || 'Non assigné'}
                        </span>
                      </div>
                      {task.dueDate && (
                        <span className={`text-[10px] font-bold ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && !isAdding && <div className="text-center py-8 text-gray-300 text-[10px] font-bold uppercase tracking-widest">Aucune tâche</div>}
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
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-gray-700"
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
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 outline-none focus:border-blue-500 transition-all font-bold"
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
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-gray-700"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  onClick={() => setEditingTask(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUpdateTask(editingTask)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-200 transition"
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