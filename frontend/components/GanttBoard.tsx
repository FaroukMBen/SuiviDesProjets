'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/auth';
import { format, differenceInDays, addDays, startOfDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Trash2, Link as LinkIcon, Calendar, Edit2, X, Check, ChevronRight, ChevronDown, ListTodo, User as UserIcon } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Member {
    _id: string;
    name: string;
}

interface GanttTask {
    _id: string;
    title: string;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    assignee?: Member;
    startDate: string;
    endDate: string;
    dependsOn: { _id: string; title: string; startDate: string; endDate: string; status: string }[];
    kanbanTasks?: { _id: string; title: string; status: string; assignee?: Member; dueDate?: string }[];
}

export function GanttBoard({ projectId }: { projectId: string }) {
    const { user } = useAuthStore();
    const [tasks, setTasks] = useState<GanttTask[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [hasScrolled, setHasScrolled] = useState(false);

    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskStartDate, setNewTaskStartDate] = useState('');
    const [newTaskEndDate, setNewTaskEndDate] = useState('');
    const [newTaskDependsOn, setNewTaskDependsOn] = useState<string[]>([]);
    const [newTaskStatus, setNewTaskStatus] = useState<GanttTask['status']>('todo');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [isDependenciesModalOpen, setIsDependenciesModalOpen] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);

    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
    const [addingKanbanTo, setAddingKanbanTo] = useState<string | null>(null);
    const [newKanbanTitle, setNewKanbanTitle] = useState('');
    const [newKanbanAssignee, setNewKanbanAssignee] = useState<string>('');
    const [newKanbanDueDate, setNewKanbanDueDate] = useState<string>('');

    const [editingKanbanTaskId, setEditingKanbanTaskId] = useState<string | null>(null);
    const [editingKanbanTitle, setEditingKanbanTitle] = useState('');
    const [editingKanbanAssignee, setEditingKanbanAssignee] = useState<string>('');
    const [editingKanbanDueDate, setEditingKanbanDueDate] = useState<string>('');
    const [linkingKanbanTo, setLinkingKanbanTo] = useState<string | null>(null);
    const [freeKanbanTasks, setFreeKanbanTasks] = useState<{ _id: string, title: string }[]>([]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/gantt-tasks/project/${projectId}`);
            setTasks(response.data.tasks);

            const kResponse = await api.get(`/api/tasks/project/${projectId}`);
            const kTasks = kResponse.data.tasks;
            setFreeKanbanTasks(kTasks.filter((t: any) => !t.ganttTaskId));

            const projResponse = await api.get(`/api/projects/${projectId}`);
            const project = projResponse.data.project;
            const allMembers = [project.owner, ...project.members].filter((v: any, i: number, a: any) => a.findIndex((v2: any) => v2._id === v._id) === i);
            setMembers(allMembers);
        } catch (err) {
            console.error("Erreur chargement tâches Gantt", err);
            showToast("Erreur de chargement du Gantt", "error");
        } finally {
            setLoading(false);
        }
    };


    const toggleExpand = (taskId: string) => {
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) newExpanded.delete(taskId);
        else newExpanded.add(taskId);
        setExpandedTasks(newExpanded);
    };

    const handleAddKanban = async (ganttTaskId: string) => {
        if (!newKanbanTitle.trim()) return;
        try {
            const payload: any = {
                projectId,
                ganttTaskId,
                title: newKanbanTitle,
                status: 'todo',
                type: 'objectif'
            };
            if (newKanbanAssignee) payload.assignee = newKanbanAssignee;
            if (newKanbanDueDate) payload.dueDate = newKanbanDueDate;

            await api.post('/api/tasks', payload);
            fetchTasks();
            setNewKanbanTitle('');
            setNewKanbanAssignee('');
            setNewKanbanDueDate('');
            setAddingKanbanTo(null);
            showToast("Sous-tâche ajoutée", "success");
        } catch (err) {
            showToast("Erreur ajout sous-tâche", "error");
        }
    };

    const handleUpdateKanbanStatus = async (taskId: string, newStatus: string) => {
        try {
            await api.put(`/api/tasks/${taskId}`, { status: newStatus });
            fetchTasks();
        } catch (err) {
            showToast("Erreur modification statut", "error");
        }
    };

    const saveEditKanban = async (taskId: string) => {
        if (!editingKanbanTitle.trim()) return;
        try {
            const payload: any = { title: editingKanbanTitle };
            if (editingKanbanAssignee !== undefined) payload.assignee = editingKanbanAssignee;
            if (editingKanbanDueDate !== undefined) payload.dueDate = editingKanbanDueDate;

            await api.put(`/api/tasks/${taskId}`, payload);
            setEditingKanbanTaskId(null);
            fetchTasks();
            showToast("Sous-tâche modifiée", "success");
        } catch (err) {
            showToast("Erreur modification", "error");
        }
    };

    const handleUnlinkKanbanTask = async (taskId: string) => {
        try {



            if (!confirm("Voulez-vous vraiment supprimer cette sous-tâche ?")) return;
            await api.delete(`/api/tasks/${taskId}`);
            fetchTasks();
            showToast("Sous-tâche supprimée", "success");
        } catch (err) {
            showToast("Erreur suppression", "error");
        }
    };

    const linkExistingKanban = async (ganttTaskId: string, kanbanTaskId: string) => {
        if (!kanbanTaskId) return;
        try {

            await api.put(`/api/tasks/${kanbanTaskId}`, { ganttTaskId });
            setLinkingKanbanTo(null);
            fetchTasks();
            showToast("Tâche liée", "success");
        } catch (err) {
            showToast("Erreur lors de la liaison", "error");
        }
    };


    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    let dates: Date[] = [];
    tasks.forEach(t => {
        dates.push(new Date(t.startDate));
        dates.push(new Date(t.endDate));
    });

    if (dates.length === 0) {
        dates = [new Date()];
    }

    const minDate = startOfDay(new Date(Math.min(...dates.map(d => d.getTime()))));
    const maxDate = startOfDay(new Date(Math.max(...dates.map(d => d.getTime()))));

    const timelineStart = addDays(minDate, -1);
    const timelineEnd = addDays(maxDate, 5);
    const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
    const days = Array.from({ length: totalDays }, (_, i) => addDays(timelineStart, i));

    useEffect(() => {
        if (!loading && tasks.length > 0 && scrollContainerRef.current && !hasScrolled) {
            const firstUnfinished = [...tasks]
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .find(t => t.status !== 'done');

            if (firstUnfinished) {
                const today = startOfDay(new Date());
                const taskEnd = startOfDay(new Date(firstUnfinished.endDate));
                const taskStart = startOfDay(new Date(firstUnfinished.startDate));

                let targetDate = taskStart;

                if (taskEnd >= today) {
                    targetDate = today;
                }

                const startOffsetDays = differenceInDays(targetDate, timelineStart);
                const scrollPos = Math.max(0, (startOffsetDays * 35) - 100);

                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft = scrollPos;

                    setTimeout(() => {
                        const taskElement = document.getElementById(`gantt-task-${firstUnfinished._id}`);
                        if (taskElement && scrollContainerRef.current) {
                            const containerRect = scrollContainerRef.current.getBoundingClientRect();
                            const taskRect = taskElement.getBoundingClientRect();
                            scrollContainerRef.current.scrollTop += (taskRect.top - containerRect.top) - 100;
                        }
                    }, 100);

                    setHasScrolled(true);
                }
            }
        }
    }, [loading, tasks, hasScrolled, timelineStart]);

    const handleSaveTask = async () => {
        if (!newTaskTitle || !newTaskStartDate || !newTaskEndDate) {
            showToast("Titre et dates requis", "error");
            return;
        }

        if (new Date(newTaskEndDate) < new Date(newTaskStartDate)) {
            showToast("La date de fin doit être après le début", "error");
            return;
        }

        for (const depId of newTaskDependsOn) {
            const depTask = tasks.find(t => t._id === depId);
            if (depTask && new Date(newTaskStartDate) < new Date(depTask.endDate)) {
                showToast(`La tâche ne peut commencer avant la fin de: ${depTask.title}`, "error");
                return;
            }
        }

        try {
            const payload = {
                projectId,
                title: newTaskTitle,
                startDate: newTaskStartDate,
                endDate: newTaskEndDate,
                status: newTaskStatus,
                dependsOn: newTaskDependsOn
            };

            if (editingTaskId) {
                const response = await api.put(`/api/gantt-tasks/${editingTaskId}`, payload);
                setTasks(tasks.map(t => t._id === editingTaskId ? response.data.task : t));
                showToast("Tâche modifiée", "success");
            } else {
                const response = await api.post('/api/gantt-tasks', payload);
                setTasks([...tasks, response.data.task]);
                showToast("Tâche ajoutée au Gantt", "success");
            }
            closeForm();
        } catch (err: any) {
            showToast(err.response?.data?.message || "Erreur lors de l'enregistrement", "error");
        }
    };

    const closeForm = () => {
        setIsAdding(false);
        setEditingTaskId(null);
        setNewTaskTitle('');
        setNewTaskStartDate('');
        setNewTaskEndDate('');
        setNewTaskDependsOn([]);
        setNewTaskStatus('todo');
        setIsDependenciesModalOpen(false);
    };

    const openEditForm = (task: GanttTask) => {
        setEditingTaskId(task._id);
        setNewTaskTitle(task.title);
        setNewTaskStartDate(format(new Date(task.startDate), 'yyyy-MM-dd'));
        setNewTaskEndDate(format(new Date(task.endDate), 'yyyy-MM-dd'));
        setNewTaskDependsOn(task.dependsOn ? task.dependsOn.map(d => d._id) : []);
        setNewTaskStatus(task.status);
        setIsAdding(true);
        setIsDependenciesModalOpen(false);
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm("Supprimer cette tâche du Gantt ?")) return;
        try {
            await api.delete(`/api/gantt-tasks/${taskId}`);
            setTasks(tasks.filter(t => t._id !== taskId));
            showToast("Tâche supprimée", "success");
        } catch (err) {
            showToast("Erreur suppression", "error");
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-12 bg-gray-100/80 rounded-xl w-full"></div>
                <div className="h-64 bg-gray-50/80 rounded-2xl w-full"></div>
            </div>
        );
    }


    const isModern = user?.theme === 'modern';

    return (
        <div className={`rounded-3xl border flex flex-col ${isModern ? 'bg-white shadow-xl shadow-gray-200/40 border-gray-100 p-6' : 'bg-gray-50 border-gray-200 p-4 shadow-sm'} `}>

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className={`text-lg transition-all ${isModern ? 'font-black text-gray-900 tracking-tight' : 'font-bold text-gray-800'}`}>
                        Diagramme de Gantt
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 font-medium">Planification temporelle et dépendances</p>
                </div>
                <button
                    onClick={() => {
                        if (isAdding) closeForm();
                        else setIsAdding(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
                >
                    <Plus size={16} />
                    Nouvelle Tâche
                </button>
            </div>

            {isAdding && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-black text-gray-800">
                                {editingTaskId ? "Modifier la tâche" : "Nouvelle tâche Gantt"}
                            </h3>
                            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Titre de la tâche</label>
                                <input
                                    type="text"
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all"
                                    placeholder="Ex: Refonte du footer..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date de début</label>
                                    <input
                                        type="date"
                                        min={(() => {
                                            if (newTaskDependsOn.length === 0) return undefined;
                                            let maxEndDate: Date | null = null;
                                            newTaskDependsOn.forEach(depId => {
                                                const depTask = tasks.find(t => t._id === depId);
                                                if (depTask) {
                                                    const dEndDate = new Date(depTask.endDate);
                                                    if (!maxEndDate || dEndDate > maxEndDate) maxEndDate = dEndDate;
                                                }
                                            });
                                            return maxEndDate ? format(maxEndDate, 'yyyy-MM-dd') : undefined;
                                        })()}
                                        value={newTaskStartDate}
                                        onChange={e => {
                                            const newStart = e.target.value;
                                            setNewTaskStartDate(newStart);
                                            if (newTaskEndDate && new Date(newTaskEndDate) < new Date(newStart)) {
                                                setNewTaskEndDate(newStart);
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date de fin</label>
                                    <input
                                        type="date"
                                        value={newTaskEndDate}
                                        onChange={e => setNewTaskEndDate(e.target.value)}
                                        min={newTaskStartDate}
                                        className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Statut</label>
                                    <div className="relative">
                                        <select
                                            value={newTaskStatus}
                                            onChange={e => setNewTaskStatus(e.target.value as GanttTask['status'])}
                                            className="w-full px-4 py-2.5 text-sm bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="todo">À faire</option>
                                            <option value="in-progress">En cours</option>
                                            <option value="review">À valider</option>
                                            <option value="done">Terminé</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1 relative">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Dépendances</label>
                                    <div className="min-h-[42px] p-1.5 bg-gray-50/50 border border-gray-200 rounded-xl flex items-center flex-wrap gap-1.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white">
                                        {newTaskDependsOn.length === 0 ? (
                                            <span className="text-sm text-gray-400 italic px-2 font-medium">Aucune dépendance</span>
                                        ) : (
                                            newTaskDependsOn.map(depId => {
                                                const dep = tasks.find(t => t._id === depId);
                                                return dep ? (
                                                    <div key={depId} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 text-[13px] font-bold px-2.5 py-1.5 rounded-lg shadow-sm">
                                                        <LinkIcon size={12} className="text-blue-500" />
                                                        <span className="truncate max-w-[120px]">{dep.title}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewTaskDependsOn(newTaskDependsOn.filter(id => id !== depId))}
                                                            className="ml-0.5 text-blue-400 hover:text-blue-600 bg-white/50 hover:bg-white p-0.5 rounded-md transition-colors"
                                                        >
                                                            <X size={12} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ) : null;
                                            })
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setIsDependenciesModalOpen(!isDependenciesModalOpen)}
                                            className="ml-auto w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
                                            title="Gérer les dépendances"
                                        >
                                            <Plus size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>

                                    {isDependenciesModalOpen && (
                                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                                            {/* Overlay pour fermer en cliquant à côté */}
                                            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" onClick={() => setIsDependenciesModalOpen(false)}></div>

                                            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-200 border border-gray-100">
                                                <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 rounded-t-2xl">
                                                    <span className="text-sm font-black text-gray-800 uppercase tracking-widest">Sélectionner les dépendances</span>
                                                    <button type="button" onClick={() => setIsDependenciesModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/50 transition-colors">
                                                        <X size={16} strokeWidth={3} />
                                                    </button>
                                                </div>
                                                <div className="overflow-y-auto p-3 space-y-1.5 custom-scrollbar bg-gray-50/30">
                                                    <div
                                                        onClick={() => {
                                                            setNewTaskDependsOn([]);
                                                            setIsDependenciesModalOpen(false);
                                                        }}
                                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${newTaskDependsOn.length === 0
                                                            ? 'bg-blue-50/80 border-blue-200 text-blue-800 shadow-sm'
                                                            : 'bg-white border-transparent text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        <div className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${newTaskDependsOn.length === 0
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'border-gray-300 bg-white'
                                                            }`}>
                                                            {newTaskDependsOn.length === 0 && <Check size={12} strokeWidth={3} />}
                                                        </div>
                                                        <span className="text-sm font-bold">
                                                            (Aucune dépendance)
                                                        </span>
                                                    </div>

                                                    {tasks.filter(t => t._id !== editingTaskId).length > 0 && (
                                                        <div className="h-px bg-gray-200 my-2"></div>
                                                    )}

                                                    {tasks.filter(t => t._id !== editingTaskId).map(t => {
                                                        const isSelected = newTaskDependsOn.includes(t._id);
                                                        return (
                                                            <div
                                                                key={t._id}
                                                                onClick={() => {
                                                                    let newDependsOn: string[];
                                                                    if (isSelected) {
                                                                        newDependsOn = newTaskDependsOn.filter(id => id !== t._id);
                                                                    } else {
                                                                        newDependsOn = [...newTaskDependsOn, t._id];
                                                                    }

                                                                    setNewTaskDependsOn(newDependsOn);

                                                                    if (newDependsOn.length > 0) {
                                                                        let maxEndDate: Date | null = null;
                                                                        newDependsOn.forEach(depId => {
                                                                            const depTask = tasks.find(tsk => tsk._id === depId);
                                                                            if (depTask) {
                                                                                const dEndDate = new Date(depTask.endDate);
                                                                                if (!maxEndDate || dEndDate > maxEndDate) maxEndDate = dEndDate;
                                                                            }
                                                                        });
                                                                        if (maxEndDate) {
                                                                            const currentStart = newTaskStartDate ? new Date(newTaskStartDate) : new Date(0);
                                                                            if (currentStart < maxEndDate) {
                                                                                const newStartStr = format(maxEndDate, 'yyyy-MM-dd');
                                                                                setNewTaskStartDate(newStartStr);
                                                                                if (!newTaskEndDate || new Date(newTaskEndDate) < maxEndDate) {
                                                                                    setNewTaskEndDate(newStartStr);
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }}
                                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected
                                                                    ? 'bg-blue-50/80 border-blue-200 shadow-sm'
                                                                    : 'bg-white border-transparent hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                <div className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected
                                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                                    : 'border-gray-300 bg-white'
                                                                    }`}>
                                                                    {isSelected && <Check size={12} strokeWidth={3} />}
                                                                </div>
                                                                <span className={`text-sm ${isSelected ? 'font-bold text-blue-800' : 'font-medium text-gray-700'
                                                                    }`}>
                                                                    {t.title}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end">
                                                    <button type="button" onClick={() => setIsDependenciesModalOpen(false)} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors">
                                                        Terminer
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3 z-10">
                            <button onClick={closeForm} className="px-5 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                                Annuler
                            </button>
                            <button onClick={handleSaveTask} className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-colors">
                                {editingTaskId ? "Enregistrer" : "Créer la tâche"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white/50 rounded-2xl border border-dashed border-gray-200">
                    <Calendar size={48} className="text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Le Gantt est vide</p>
                </div>
            ) : (
                <div
                    ref={scrollContainerRef}
                    className="overflow-auto max-h-[70vh] pb-4 custom-scrollbar rounded-xl border border-gray-200 bg-white relative shadow-inner"
                >
                    <div style={{ minWidth: `max(800px, ${totalDays * 35 + 350}px)` }}>
                        {/* Timeline Header */}
                        <div className="flex border-b border-gray-200 pb-2 sticky top-0 z-40 bg-white/95 backdrop-blur-md pt-3 shadow-sm">
                            {/* Coin supérieur gauche fixe */}
                            <div className="w-[350px] shrink-0 sticky left-0 z-50 bg-white/95 backdrop-blur-md flex items-end px-4 pb-1 border-r border-gray-100/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tâches</span>
                            </div>

                            {/* Jours */}
                            <div className="flex flex-1">
                                {days.map((day, i) => {
                                    const isToday = isSameDay(day, new Date());
                                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                    return (
                                        <div
                                            key={i}
                                            className="flex-1 flex flex-col items-center justify-end relative min-w-[35px]"
                                        >
                                            <span className={`text-[10px] ${isToday ? 'text-blue-600 font-black' : isWeekend ? 'text-gray-300 font-medium' : 'text-gray-500 font-bold'}`}>
                                                {format(day, 'd', { locale: fr })}
                                            </span>
                                            <span className={`text-[9px] uppercase ${isToday ? 'text-blue-500 font-bold' : 'text-gray-300'}`}>
                                                {format(day, 'MMM', { locale: fr })}
                                            </span>
                                            {/* Grid vertical line */}
                                            <div className="absolute top-full w-full border-r border-gray-100/60 z-[-1] h-[20000px] left-0 mt-2 pointer-events-none filter sepia-0"></div>

                                            {isToday && (
                                                <div className="absolute top-full w-0.5 bg-blue-500/20 z-0 h-[20000px] left-1/2 transform -translate-x-1/2 mt-2 border-l-2 border-dashed border-blue-400 pointer-events-none"></div>
                                            )}
                                            {isWeekend && !isToday && (
                                                <div className="absolute top-full w-full bg-gray-50/50 z-[-1] h-[20000px] left-0 mt-2 pointer-events-none"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tasks List */}
                        <div className="space-y-4 relative z-10 mt-4">
                            {tasks.map(task => {
                                const start = startOfDay(new Date(task.startDate));
                                const end = startOfDay(new Date(task.endDate));

                                const startOffsetDays = differenceInDays(start, timelineStart);
                                const durationDays = differenceInDays(end, start) + 1; // +1 to include end day

                                const startPercent = Math.max(0, (startOffsetDays / totalDays) * 100);
                                const widthPercent = Math.min(100 - startPercent, (durationDays / totalDays) * 100);

                                let statusColor = 'from-gray-400 to-gray-500 shadow-gray-400/30';
                                if (task.status === 'in-progress') statusColor = 'from-blue-500 to-indigo-500 shadow-blue-500/30';
                                if (task.status === 'review') statusColor = 'from-purple-500 to-fuchsia-500 shadow-purple-500/30';
                                if (task.status === 'done') statusColor = 'from-emerald-400 to-teal-500 shadow-emerald-500/30';

                                const displayStatus = {
                                    'todo': 'À faire',
                                    'in-progress': 'En cours',
                                    'review': 'À valider',
                                    'done': 'Fini'
                                }[task.status] || 'À faire';

                                const isExpanded = expandedTasks.has(task._id);

                                return (
                                    <div key={task._id} id={`gantt-task-${task._id}`} className="flex flex-col mt-1">
                                        <div className="flex items-center group relative">
                                            {/* Infos de gauche */}
                                            <div className="w-[350px] pr-4 shrink-0 bg-white/95 backdrop-blur-sm z-30 group-hover:bg-gray-50/90 transition-colors py-1 rounded-l-lg flex justify-between items-center border-r border-gray-100 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <div className="flex items-center pl-2 w-full overflow-hidden">
                                                    <button onClick={() => toggleExpand(task._id)} className="p-1 mr-1 text-gray-400 hover:text-gray-700 transition-colors shrink-0">
                                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </button>
                                                    <div className="truncate flex-1">
                                                        <div className="text-xs font-bold text-gray-800 truncate" title={task.title}>{task.title}</div>
                                                        {task.dependsOn && task.dependsOn.length > 0 && (
                                                            <div className="flex items-center gap-1 text-[9px] text-orange-500 font-bold mt-0.5">
                                                                <LinkIcon size={10} />
                                                                Dépend de: {task.dependsOn.map(d => d.title).join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 bg-white/80 group-hover:bg-gray-50/80 rounded-lg shrink-0">
                                                    <button onClick={() => openEditForm(task)} className="text-gray-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity p-1" title="Modifier">
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button onClick={() => handleDeleteTask(task._id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1" title="Supprimer">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Barre du Gantt */}
                                            <div className="flex-1 relative h-7 bg-transparent overflow-visible rounded-r-lg group-hover:bg-gray-50/30 transition-colors py-0.5">
                                                {/* Barre */}
                                                <div
                                                    className={`absolute top-0.5 bottom-0.5 rounded-md bg-gradient-to-r ${statusColor} shadow-md transition-all group-hover:brightness-110 flex items-center px-2 cursor-pointer z-10`}
                                                    style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                                                    title={`${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')} (Cliquez pour modifier)`}
                                                    onClick={() => openEditForm(task)}
                                                >
                                                    <span className="text-[9px] font-black text-white/90 truncate drop-shadow-sm leading-none flex items-center justify-between w-full">
                                                        <span>{displayStatus}</span>
                                                        <span>{durationDays} j</span>
                                                    </span>
                                                </div>

                                                {/* Visualiser une ligne de dépendance très basique (vers la gauche si dépendance) */}
                                                {task.dependsOn && task.dependsOn.length > 0 && (
                                                    <div
                                                        className="absolute h-[1px] bg-orange-400 top-1/2 -translate-y-1/2 z-0"
                                                        style={{
                                                            left: `${Math.max(0, startPercent - 5)}%`,
                                                            width: `5%`
                                                        }}
                                                    >
                                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-orange-400 rotate-45 transform bg-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded tasks underneath */}
                                        {isExpanded && (
                                            <div className="flex flex-col bg-gray-50/20 border-t border-gray-100/50 mt-[1px]">
                                                {(task.kanbanTasks || []).map(kt => (
                                                    <div key={kt._id} className="flex items-center group/kt relative h-[44px] border-b border-gray-100/40">
                                                        {/* Left Pane for Kanban Task */}
                                                        <div className="w-[350px] pr-3 shrink-0 bg-gray-50/70 backdrop-blur-sm z-30 group-hover/kt:bg-white transition-colors py-1 flex justify-between items-center border-r border-gray-100 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] pl-8">

                                                            {editingKanbanTaskId === kt._id ? (
                                                                <div className="flex-1 flex items-center pr-2 gap-2 w-full py-1">
                                                                    <input
                                                                        autoFocus
                                                                        className="flex-[2] text-[11px] font-medium text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
                                                                        value={editingKanbanTitle}
                                                                        onChange={e => setEditingKanbanTitle(e.target.value)}
                                                                        onKeyDown={e => { if (e.key === 'Enter') saveEditKanban(kt._id); if (e.key === 'Escape') setEditingKanbanTaskId(null); }}
                                                                    />
                                                                    <select
                                                                        className="flex-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded px-1 py-1 outline-none focus:border-blue-400 cursor-pointer"
                                                                        value={editingKanbanAssignee}
                                                                        onChange={e => setEditingKanbanAssignee(e.target.value)}
                                                                    >
                                                                        <option value="">Assigner...</option>
                                                                        {members.map(m => (
                                                                            <option key={m._id} value={m._id}>{m.name}</option>
                                                                        ))}
                                                                    </select>
                                                                    <input
                                                                        type="date"
                                                                        className="flex-1 w-[90px] text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded px-1 py-1 outline-none focus:border-blue-400 cursor-pointer"
                                                                        value={editingKanbanDueDate}
                                                                        onChange={e => setEditingKanbanDueDate(e.target.value)}
                                                                    />
                                                                    <div className="flex gap-1 shrink-0 ml-1">
                                                                        <button onClick={() => saveEditKanban(kt._id)} className="p-1 text-white bg-blue-500 hover:bg-blue-600 rounded shadow-sm border border-blue-600 transition-colors"><Check size={12} strokeWidth={3} /></button>
                                                                        <button onClick={() => setEditingKanbanTaskId(null)} className="p-1 text-gray-500 hover:text-white bg-gray-100 hover:bg-red-500 rounded shadow-sm border border-gray-200 hover:border-red-600 transition-colors"><X size={12} strokeWidth={3} /></button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="flex items-center w-full overflow-hidden pr-2">
                                                                        <ListTodo size={12} className="text-gray-400 mr-2 shrink-0 opacity-60" />
                                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                            <div className="text-[11px] font-bold text-gray-700 truncate" title={kt.title}>{kt.title}</div>
                                                                            {(kt.assignee || kt.dueDate) && (
                                                                                <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
                                                                                    {kt.assignee && (
                                                                                        <div className="text-[9.5px] font-black text-gray-400 truncate uppercase tracking-widest shrink-0">
                                                                                            {kt.assignee.name}
                                                                                        </div>
                                                                                    )}
                                                                                    {kt.assignee && kt.dueDate && (
                                                                                        <div className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                                                                    )}
                                                                                    {kt.dueDate && (
                                                                                        <div className={`text-[9.5px] font-bold flex items-center gap-1 shrink-0 ${new Date(kt.dueDate) < new Date() && kt.status !== 'done' ? 'text-red-500' : 'text-gray-500'}`}>
                                                                                            <Calendar size={9} strokeWidth={3} />
                                                                                            {new Date(kt.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center shrink-0">
                                                                        <div className="group-hover/kt:flex hidden items-center gap-0.5 mr-1.5 opacity-0 group-hover/kt:opacity-100 transition-opacity">
                                                                            <button onClick={() => { setEditingKanbanTaskId(kt._id); setEditingKanbanTitle(kt.title); setEditingKanbanAssignee((kt.assignee as any)?._id || ''); setEditingKanbanDueDate(kt.dueDate ? new Date(kt.dueDate).toISOString().split('T')[0] : ''); }} className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Modifier">
                                                                                <Edit2 size={12} strokeWidth={2.5} />
                                                                            </button>
                                                                            <button onClick={() => handleUnlinkKanbanTask(kt._id)} className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Supprimer">
                                                                                <Trash2 size={12} strokeWidth={2.5} />
                                                                            </button>
                                                                        </div>
                                                                        {/* Status switcher for Kanban task */}
                                                                        <div className="relative shrink-0">
                                                                            <select
                                                                                value={kt.status}
                                                                                onChange={(e) => handleUpdateKanbanStatus(kt._id, e.target.value)}
                                                                                className={`text-[9.5px] font-black border rounded-lg pl-2 pr-5 py-1 outline-none cursor-pointer transition-all shadow-sm appearance-none bg-none min-w-[85px] ${kt.status === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 focus:ring-2 focus:ring-emerald-200/50' :
                                                                                    kt.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border-blue-200 focus:ring-2 focus:ring-blue-200/50' :
                                                                                        kt.status === 'review' ? 'bg-purple-50 text-purple-600 border-purple-200 focus:ring-2 focus:ring-purple-200/50' :
                                                                                            'bg-white text-gray-600 border-gray-200 focus:ring-2 focus:ring-gray-200/50'
                                                                                    }`}
                                                                            >
                                                                                <option value="todo" className="font-bold text-gray-700">À faire</option>
                                                                                <option value="in-progress" className="font-bold text-blue-700">En cours</option>
                                                                                <option value="review" className="font-bold text-purple-700">À valider</option>
                                                                                <option value="done" className="font-bold text-emerald-700">Terminé</option>
                                                                            </select>
                                                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 opacity-60">
                                                                                <ChevronDown size={10} strokeWidth={3} className={
                                                                                    kt.status === 'done' ? 'text-emerald-700' :
                                                                                        kt.status === 'in-progress' ? 'text-blue-700' :
                                                                                            kt.status === 'review' ? 'text-purple-700' :
                                                                                                'text-gray-500'
                                                                                } />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 relative bg-transparent" />
                                                    </div>
                                                ))}

                                                {/* Actions container (Ajout / Liaison) */}
                                                <div className="flex items-center relative min-h-[40px] border-b border-gray-100/20">
                                                    <div className="w-[350px] pr-4 shrink-0 bg-gray-50/70 backdrop-blur-sm z-30 py-1 flex flex-col justify-center border-r border-gray-100 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] pl-8">

                                                        {addingKanbanTo === task._id ? (
                                                            <div className="flex items-center w-full gap-2 p-1.5 bg-gray-50/80 rounded-lg shadow-inner border border-gray-200/60 z-10 relative">
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    className="flex-[2] text-[11px] font-medium text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400"
                                                                    placeholder="Nom de la sous-tâche..."
                                                                    value={newKanbanTitle}
                                                                    onChange={e => setNewKanbanTitle(e.target.value)}
                                                                    onKeyDown={e => { if (e.key === 'Enter') handleAddKanban(task._id); if (e.key === 'Escape') setAddingKanbanTo(null); }}
                                                                />
                                                                <select
                                                                    className="flex-1 w-[80px] text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded px-1 py-1 outline-none focus:border-blue-400 cursor-pointer"
                                                                    value={newKanbanAssignee}
                                                                    onChange={e => setNewKanbanAssignee(e.target.value)}
                                                                >
                                                                    <option value="">Assigner...</option>
                                                                    {members.map(m => (
                                                                        <option key={m._id} value={m._id}>{m.name}</option>
                                                                    ))}
                                                                </select>
                                                                <input
                                                                    type="date"
                                                                    className="flex-1 w-[90px] text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded px-1 py-1 outline-none focus:border-blue-400 cursor-pointer"
                                                                    value={newKanbanDueDate}
                                                                    onChange={e => setNewKanbanDueDate(e.target.value)}
                                                                />
                                                                <div className="flex gap-1 shrink-0 ml-1">
                                                                    <button onClick={() => handleAddKanban(task._id)} className="p-1.5 text-white bg-blue-500 hover:bg-blue-600 rounded shadow-sm border border-blue-600 transition-colors"><Check size={12} strokeWidth={3} /></button>
                                                                    <button onClick={() => setAddingKanbanTo(null)} className="p-1.5 text-gray-500 hover:text-white bg-white hover:bg-gray-500 rounded shadow-sm border border-gray-200 hover:border-gray-500 transition-colors"><X size={12} strokeWidth={3} /></button>
                                                                </div>
                                                            </div>
                                                        ) : linkingKanbanTo === task._id ? (
                                                            <div className="flex items-center w-full gap-2 p-1.5 bg-gray-50/80 rounded-lg shadow-inner border border-gray-200/60 z-10 relative">
                                                                <div className="relative flex-1">
                                                                    <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none text-purple-500">
                                                                        <LinkIcon size={12} strokeWidth={2.5} />
                                                                    </div>
                                                                    <select
                                                                        autoFocus
                                                                        onChange={e => linkExistingKanban(task._id, e.target.value)}
                                                                        className="block w-full pl-7 pr-8 py-1.5 text-[11px] font-bold text-gray-700 bg-white border border-gray-200 rounded-md shadow-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 appearance-none bg-none cursor-pointer hover:border-gray-300 transition-all"
                                                                        defaultValue=""
                                                                    >
                                                                        <option value="" disabled>Sélectionnez une tâche à lier...</option>
                                                                        {freeKanbanTasks.map(fk => (
                                                                            <option key={fk._id} value={fk._id}>{fk.title}</option>
                                                                        ))}
                                                                        {freeKanbanTasks.length === 0 && (
                                                                            <option disabled>(Aucune tâche libre trouvée)</option>
                                                                        )}
                                                                    </select>
                                                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                                                                        <ChevronDown size={12} strokeWidth={3} />
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => setLinkingKanbanTo(null)} className="p-1.5 text-gray-400 hover:text-white bg-white hover:bg-gray-500 rounded-md shadow-sm border border-gray-200 hover:border-gray-500 transition-colors"><X size={12} strokeWidth={3} /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-1 w-full my-1">
                                                                <button onClick={() => { setAddingKanbanTo(task._id); setNewKanbanTitle(''); setLinkingKanbanTo(null); }} className="flex items-center text-[10.5px] text-gray-500 hover:text-blue-600 font-bold transition-all py-1 px-1.5 rounded-md hover:bg-white border border-transparent hover:border-blue-100 shadow-sm hover:shadow">
                                                                    <Plus size={11} className="mr-1.5" strokeWidth={3} /> Créer sous-tâche
                                                                </button>
                                                                <button onClick={() => { setLinkingKanbanTo(task._id); setAddingKanbanTo(null); }} className="flex items-center text-[10.5px] text-gray-500 hover:text-purple-600 font-bold transition-all py-1 px-1.5 rounded-md hover:bg-white border border-transparent hover:border-purple-100 shadow-sm hover:shadow">
                                                                    <LinkIcon size={11} className="mr-1.5" strokeWidth={3} /> Lier tâche existante
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 relative bg-transparent" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
