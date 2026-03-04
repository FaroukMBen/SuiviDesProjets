'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/auth';
import { format, differenceInDays, addDays, startOfDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Trash2, Link as LinkIcon, Calendar, Edit2, X } from 'lucide-react';
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
}

export function GanttBoard({ projectId }: { projectId: string }) {
    const { user } = useAuthStore();
    const [tasks, setTasks] = useState<GanttTask[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskStartDate, setNewTaskStartDate] = useState('');
    const [newTaskEndDate, setNewTaskEndDate] = useState('');
    const [newTaskDependsOn, setNewTaskDependsOn] = useState<string[]>([]);
    const [newTaskStatus, setNewTaskStatus] = useState<GanttTask['status']>('todo');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/gantt-tasks/project/${projectId}`);
            setTasks(response.data.tasks);
        } catch (err) {
            console.error("Erreur chargement tâches Gantt", err);
            showToast("Erreur de chargement du Gantt", "error");
        } finally {
            setLoading(false);
        }
    };

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
    };

    const openEditForm = (task: GanttTask) => {
        setEditingTaskId(task._id);
        setNewTaskTitle(task.title);
        setNewTaskStartDate(format(new Date(task.startDate), 'yyyy-MM-dd'));
        setNewTaskEndDate(format(new Date(task.endDate), 'yyyy-MM-dd'));
        setNewTaskDependsOn(task.dependsOn ? task.dependsOn.map(d => d._id) : []);
        setNewTaskStatus(task.status);
        setIsAdding(true);
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

                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Dépendances (Maintenir Ctrl/Cmd)</label>
                                    <select
                                        multiple
                                        value={newTaskDependsOn}
                                        onChange={e => {
                                            const options = Array.from(e.target.selectedOptions, option => option.value);
                                            let validOptions = options;
                                            if (options.includes("")) validOptions = []; // (Aucune) overrides
                                            setNewTaskDependsOn(validOptions);

                                            if (validOptions.length > 0) {
                                                let maxEndDate: Date | null = null;
                                                validOptions.forEach(depId => {
                                                    const depTask = tasks.find(t => t._id === depId);
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
                                        className="w-full p-3 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all shadow-inner h-28"
                                    >
                                        <option value="" className="text-gray-500 italic p-1 rounded hover:bg-gray-50">(Aucune dépendance)</option>
                                        {tasks.filter(t => t._id !== editingTaskId).map(t => (
                                            <option key={t._id} value={t._id} className="p-1.5 my-0.5 rounded-md hover:bg-gray-100 cursor-pointer text-gray-700 font-medium">
                                                {t.title}
                                            </option>
                                        ))}
                                    </select>
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
                <div className="overflow-x-auto pb-4">
                    <div className="min-w-[800px]">
                        {/* Timeline Header */}
                        <div className="flex border-b border-gray-100 pb-2 mb-4 relative ml-[250px]">
                            {days.map((day, i) => {
                                const isToday = isSameDay(day, new Date());
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 min-w-[35px] flex flex-col items-center justify-end relative"
                                    >
                                        <span className={`text-[10px] ${isToday ? 'text-blue-600 font-black' : isWeekend ? 'text-gray-300 font-medium' : 'text-gray-500 font-bold'}`}>
                                            {format(day, 'd', { locale: fr })}
                                        </span>
                                        <span className={`text-[9px] uppercase ${isToday ? 'text-blue-500 font-bold' : 'text-gray-300'}`}>
                                            {format(day, 'MMM', { locale: fr })}
                                        </span>
                                        {/* Grid vertical line */}
                                        <div className="absolute top-full bottom-[-2000px] w-full border-r border-gray-100/60 z-[-1] h-[2000px] left-0 mt-2 pointer-events-none"></div>

                                        {isToday && (
                                            <div className="absolute top-full bottom-[-2000px] w-0.5 bg-blue-500/20 z-0 h-[2000px] left-1/2 transform -translate-x-1/2 mt-2 border-l-2 border-dashed border-blue-400 pointer-events-none"></div>
                                        )}
                                        {isWeekend && !isToday && (
                                            <div className="absolute top-full bottom-[-2000px] w-full bg-gray-50/50 z-[-1] h-[2000px] left-0 mt-2 pointer-events-none"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Tasks List */}
                        <div className="space-y-4 relative z-10">
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

                                return (
                                    <div key={task._id} className="flex items-center group relative mt-1">
                                        {/* Infos de gauche */}
                                        <div className="w-[250px] pr-4 shrink-0 bg-white z-20 group-hover:bg-gray-50/50 transition-colors py-1 rounded-l-lg flex justify-between items-center border-r border-gray-100">
                                            <div className="truncate">
                                                <div className="text-xs font-bold text-gray-800 truncate" title={task.title}>{task.title}</div>
                                                {task.dependsOn && task.dependsOn.length > 0 && (
                                                    <div className="flex items-center gap-1 text-[9px] text-orange-500 font-bold mt-0.5">
                                                        <LinkIcon size={10} />
                                                        Dépend de: {task.dependsOn.map(d => d.title).join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
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
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
