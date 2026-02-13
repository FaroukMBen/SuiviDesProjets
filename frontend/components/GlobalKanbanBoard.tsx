'use client';

import { useEffect, useState } from 'react';
import { MoreHorizontal, Calendar, Pencil, Trash2, X, User } from 'lucide-react';
import api from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

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
    const { showToast } = useToast();
    const { confirm } = useConfirm();
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
        if (!await confirm({ title: "Supprimer la tâche", message: "Voulez-vous vraiment supprimer cette tâche ?", type: "danger" })) return;
        try {
            await api.delete(`/api/tasks/${taskId}`);
            setTasks(tasks.filter(t => t._id !== taskId));
            showToast("Tâche supprimée", "success");
        } catch (err) {
            showToast("Impossible de supprimer la tâche", "error");
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
            showToast("Tâche mise à jour", "success");
        } catch (err) {
            showToast("Impossible de modifier la tâche", "error");
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

    const isModern = user?.theme === 'modern';

    if (!isModern) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Toutes mes tâches (Mode Basique)</h2>
                    <button
                        onClick={() => setShowMyTasksOnly(!showMyTasksOnly)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${showMyTasksOnly ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        {showMyTasksOnly ? 'Mes tâches uniquement' : 'Toutes les tâches'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                                className="flex flex-col h-auto min-h-[500px] rounded-xl bg-gray-50/10 border border-gray-200 shadow-sm"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, col.id)}
                            >
                                {/* Column Header */}
                                <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-white rounded-t-xl">
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
                                                        <div className="absolute right-0 top-6 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-10 py-1 text-xs">
                                                            <button onClick={() => { setEditingTask(task); setMenuOpenId(null); }} className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2"><Pencil size={12} /> Modifier</button>
                                                            <button onClick={() => handleDeleteTask(task._id)} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={12} /> Supprimer</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[120px]">{task.projectId?.title}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold border border-white shadow-sm">
                                                        {task.assignee?.name ? task.assignee.name[0] : '?'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {colTasks.length === 0 && <div className="text-center py-8 text-gray-300 text-[10px] font-bold uppercase tracking-widest">Aucune tâche</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Tableau de <span className="text-blue-600">Bord</span>
                    </h1>
                    <p className="text-gray-500 mt-1">Gérez vos tâches et suivez votre progression en temps réel.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowMyTasksOnly(!showMyTasksOnly)}
                        className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border shadow-sm
                            ${showMyTasksOnly
                                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                                : 'bg-white text-gray-600 border-gray-100 hover:border-blue-200 hover:text-blue-600'
                            }`}
                    >
                        <User size={18} className={showMyTasksOnly ? 'text-white' : 'text-blue-500 group-hover:text-blue-600'} />
                        {showMyTasksOnly ? 'Mes tâches uniquement' : 'Toutes les tâches'}
                    </button>

                    <div className="h-10 w-px bg-gray-100 hidden md:block"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {COLUMNS.map((col) => {
                    const colTasks = tasks.filter(t => {
                        const matchesStatus = t.status === col.id;
                        const matchesUser = showMyTasksOnly
                            ? (t.assignee && user && t.assignee._id === user.id)
                            : true;
                        return matchesStatus && matchesUser;
                    });

                    // Dynamic colors for column headers
                    const colColors: Record<string, string> = {
                        'todo': 'bg-gray-100 text-gray-600',
                        'in-progress': 'bg-blue-100 text-blue-600',
                        'review': 'bg-purple-100 text-purple-600',
                        'done': 'bg-emerald-100 text-emerald-600'
                    };

                    return (
                        <div
                            key={col.id}
                            className="flex flex-col min-h-[650px] rounded-3xl bg-gray-50/50 border border-gray-100/50 p-4 transition-all"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <div className="flex items-center justify-between mb-5 px-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-wider">{col.label}</h3>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${colColors[col.id] || 'bg-gray-100 text-gray-600'}`}>
                                        {colTasks.length}
                                    </span>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                            </div>

                            <div className="flex-1 space-y-4">
                                {colTasks.map((task) => (
                                    <div
                                        key={task._id}
                                        draggable
                                        onDragStart={() => setDraggedTaskId(task._id)}
                                        className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 transition-all duration-300 cursor-grab active:cursor-grabbing relative overflow-hidden"
                                    >
                                        <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-transparent group-hover:bg-blue-500 rounded-r-full transition-all duration-300"></div>

                                        {/* Project Badge */}
                                        {task.projectId && (
                                            <div className="flex items-center gap-1.5 mb-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight truncate max-w-[150px]">
                                                    {task.projectId.title}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start gap-3 mb-4">
                                            <h4 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors">
                                                {task.title}
                                            </h4>

                                            <div className="relative" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.nativeEvent.stopImmediatePropagation();
                                                        setMenuOpenId(menuOpenId === task._id ? null : task._id);
                                                    }}
                                                    className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-all"
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>

                                                {menuOpenId === task._id && (
                                                    <div className="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                                        <button
                                                            onClick={() => {
                                                                setEditingTask(task);
                                                                if (task.projectId) fetchProjectMembers(task.projectId._id);
                                                                setMenuOpenId(null);
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5"
                                                        >
                                                            <Pencil size={14} /> Modifier Tâche
                                                        </button>
                                                        <div className="mx-2 my-1 border-t border-gray-50"></div>
                                                        <button
                                                            onClick={() => handleDeleteTask(task._id)}
                                                            className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                                                        >
                                                            <Trash2 size={14} strokeWidth={2.5} /> Supprimer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {task.description && (
                                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                    {task.description}
                                                </p>
                                            )}

                                            <div className="flex justify-between items-center pt-3 border-t border-gray-50 mt-1">
                                                <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 group-hover:bg-white group-hover:border-blue-100 transition-colors">
                                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm" title={task.assignee?.name}>
                                                        {task.assignee?.name ? task.assignee.name[0].toUpperCase() : '?'}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-600 truncate max-w-[80px]">
                                                        {task.assignee?.name || 'Inconnu'}
                                                    </span>
                                                </div>

                                                {task.dueDate && (
                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black tracking-tight ${new Date(task.dueDate) < new Date() && task.status !== 'done'
                                                        ? 'bg-red-50 text-red-600 border border-red-100'
                                                        : 'bg-gray-50 text-gray-500 border border-gray-100'
                                                        }`}>
                                                        <Calendar size={12} strokeWidth={2.5} />
                                                        {new Date(task.dueDate).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {colTasks.length === 0 && (
                                    <div className="border-2 border-dashed border-gray-200/50 rounded-2xl h-32 flex items-center justify-center">
                                        <p className="text-xs font-medium text-gray-300">Aucune tâche</p>
                                    </div>
                                )}
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
