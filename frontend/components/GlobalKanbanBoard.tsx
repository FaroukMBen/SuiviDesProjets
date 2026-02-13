'use client';

import { useEffect, useState } from 'react';
import { MoreHorizontal, Calendar, Pencil, Trash2, X, User } from 'lucide-react';
import api from '@/lib/auth';

interface Member {
    _id: string;
    name: string;
    email: string;
}

interface Project {
    _id: string;
    title: string;
}

interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    priority: string;
    type?: 'feature' | 'bug' | 'objectif';
    assignee?: Member;
    dueDate?: string;
    projectId?: Project; // Populated from backend
}

const COLUMNS = [
    { id: 'todo', label: 'À faire' },
    { id: 'in-progress', label: 'En cours' },
    { id: 'review', label: 'En revue' },
    { id: 'done', label: 'Terminé' }
];

import { useAuthStore } from '@/lib/store';

// ... (other imports)

export function GlobalKanbanBoard() {
    const { user } = useAuthStore();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [showMyTasksOnly, setShowMyTasksOnly] = useState(false);

    // Pour l'édition, on a besoin des membres du projet de la tâche.
    // C'est complexe car chaque tâche vient d'un projet différent.
    // Pour la version simple globale, on va peut-être limiter l'édition de l'assigné 
    // OU on fetch les membres du projet spécifique quand on ouvre l'edit.
    const [currentProjectMembers, setCurrentProjectMembers] = useState<Member[]>([]);

    useEffect(() => {
        fetchGlobalTasks();
    }, []);

    useEffect(() => {
        const handleClickOutside = () => setMenuOpenId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchGlobalTasks = async () => {
        try {
            const response = await api.get('/api/tasks/my-global-tasks');
            setTasks(response.data.tasks);
            setLoading(false);
        } catch (err) {
            console.error("Erreur chargement tâches globales", err);
            setLoading(false);
        }
    };

    const fetchProjectMembers = async (projectId: string) => {
        try {
            const response = await api.get(`/api/projects/${projectId}`);
            const project = response.data.project;
            const allMembers = [project.owner, ...project.members].filter((v, i, a) => a.findIndex(v2 => (v2._id === v._id)) === i);
            setCurrentProjectMembers(allMembers);
        } catch (err) {
            console.error("Erreur chargement membres projet", err);
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette tâche ?")) return;
        try {
            await api.delete(`/api/tasks/${taskId}`);
            setTasks(tasks.filter(t => t._id !== taskId));
        } catch (err) {
            alert("Impossible de supprimer la tâche");
        }
    };

    const handleUpdateTask = async (updatedTask: Task) => {
        try {
            const payload = {
                ...updatedTask,
                assignee: (updatedTask.assignee as any)?._id || updatedTask.assignee
            };
            const response = await api.put(`/api/tasks/${updatedTask._id}`, payload);
            // On update en gardant le projectId car l'API update ne le renvoie peut être pas peuplé comme on veut
            // ou on re-fetch, mais optimiste c'est mieux.
            // Le backend renvoie la task à jour. On doit s'assurer que projectId est bien un objet si on veut l'afficher.

            const newTask = response.data.task;
            // Patch pour garder le titre du projet si l'API ne le repeuple pas tout de suite
            if (updatedTask.projectId && !newTask.projectId?.title) {
                newTask.projectId = updatedTask.projectId;
            }

            setTasks(tasks.map(t => t._id === updatedTask._id ? newTask : t));
            setEditingTask(null);
        } catch (err) {
            alert("Impossible de modifier la tâche");
        }
    };

    const handleDrop = async (e: React.DragEvent, status: string) => {
        e.preventDefault();
        if (!draggedTaskId) return;

        const updatedTasks = tasks.map(t =>
            t._id === draggedTaskId ? { ...t, status: status as any } : t
        );
        setTasks(updatedTasks);
        setDraggedTaskId(null);

        try {
            await api.put(`/api/tasks/${draggedTaskId}`, { status });
        } catch (err) {
            fetchGlobalTasks();
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement des tâches...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Toutes mes Tâches & Non Assignées</h1>

                <button
                    onClick={() => setShowMyTasksOnly(!showMyTasksOnly)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${showMyTasksOnly
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    <User size={16} />
                    {showMyTasksOnly ? 'Mes tâches' : 'Toutes les tâches'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                {COLUMNS.map((col) => {
                    const colTasks = tasks.filter(t => {
                        const matchesStatus = t.status === col.id;
                        const matchesUser = showMyTasksOnly
                            ? (t.assignee && user && t.assignee._id === user.id)
                            : true;
                        return matchesStatus && matchesUser;
                    });

                    return (
                        <div
                            key={col.id}
                            className="flex flex-col h-auto min-h-[500px] rounded-xl bg-white border border-gray-200 shadow-sm"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <div className="p-4 flex items-center justify-between border-b border-gray-50">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-700 text-sm">{col.label}</h3>
                                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                                        {colTasks.length}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 space-y-3">
                                {colTasks.map((task) => (
                                    <div
                                        key={task._id}
                                        draggable
                                        onDragStart={() => setDraggedTaskId(task._id)}
                                        style={{ zIndex: menuOpenId === task._id ? 20 : 0 }}
                                        className="group bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing relative"
                                    >
                                        {/* Badge Projet */}
                                        {task.projectId && (
                                            <div className="mb-2">
                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 font-medium">
                                                    {task.projectId.title}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-2 gap-2">
                                            <h4 className="text-sm font-bold text-gray-800 leading-tight flex-1 pt-1">
                                                {task.title}
                                            </h4>

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

                                                {menuOpenId === task._id && (
                                                    <div className="absolute right-0 top-6 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-10 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left">
                                                        <button
                                                            onClick={() => {
                                                                setEditingTask(task);
                                                                if (task.projectId) fetchProjectMembers(task.projectId._id);
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

                                        <div className="flex justify-between items-center border-t border-gray-50 pt-3 mt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold border border-white shadow-sm" title={task.assignee?.name}>
                                                    {task.assignee?.name ? task.assignee.name[0] : '?'}
                                                </div>
                                                <span className="text-xs text-gray-400 truncate max-w-[80px]">
                                                    {task.assignee?.name || 'Non assigné'}
                                                </span>
                                            </div>

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

            {/* Edit Modal */}
            {editingTask && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Modifier la tâche</h3>
                            <button onClick={() => setEditingTask(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Titre</label>
                                <input
                                    type="text"
                                    value={editingTask.title}
                                    onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-200 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Assigné à</label>
                                <select
                                    value={(editingTask.assignee as any)?._id || (typeof editingTask.assignee === 'string' ? editingTask.assignee : '') || ''}
                                    onChange={e => {
                                        const memberId = e.target.value;
                                        const member = currentProjectMembers.find(m => m._id === memberId);
                                        setEditingTask({ ...editingTask, assignee: member });
                                    }}
                                    className="w-full p-2 rounded-lg border border-gray-200 bg-white"
                                >
                                    <option value="">-- Non assigné --</option>
                                    {currentProjectMembers.map(m => (
                                        <option key={m._id} value={m._id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Échéance</label>
                                <input
                                    type="date"
                                    value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                                    onChange={e => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                                    className="w-full p-2 rounded-lg border border-gray-200 outline-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                                <button onClick={() => setEditingTask(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600">Annuler</button>
                                <button onClick={() => handleUpdateTask(editingTask)} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white shadow-md">Enregistrer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
