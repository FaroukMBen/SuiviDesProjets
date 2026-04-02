'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/auth';
import { format, differenceInDays, addDays, startOfDay, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link as LinkIcon, Calendar, Edit2, X, ChevronRight, ChevronDown, ListTodo, Folder } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Member {
    _id: string;
    name: string;
}

interface Project {
    _id: string;
    title: string;
}

interface GanttTask {
    _id: string;
    title: string;
    status: 'todo' | 'in-progress' | 'review' | 'done';
    assignee?: Member;
    startDate: string;
    endDate: string;
    projectId: Project;
    dependsOn: { _id: string; title: string; startDate: string; endDate: string; status: string }[];
    kanbanTasks?: { _id: string; title: string; status: string; assignee?: Member; dueDate?: string }[];
}

export function GlobalGanttBoard() {
    const { user } = useAuthStore();
    const [tasks, setTasks] = useState<GanttTask[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [hasScrolled, setHasScrolled] = useState(false);

    const fetchGlobalTasks = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/gantt-tasks/my-global-gantt-tasks');
            setTasks(response.data.tasks);

            const projectIds = new Set(response.data.tasks.map((t: GanttTask) => t.projectId._id));
            setExpandedProjects(new Set(Array.from(projectIds) as string[]));
        } catch (err) {
            console.error("Erreur chargement Gantt Global", err);
            showToast("Erreur de chargement du récapitulatif", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGlobalTasks();
    }, []);
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
    const timelineStart = addDays(minDate, -2);
    const timelineEnd = addDays(maxDate, 7);
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
                    setHasScrolled(true);
                }
            }
        }
    }, [loading, tasks, hasScrolled, timelineStart]);

    const toggleExpandTask = (taskId: string) => {
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) newExpanded.delete(taskId);
        else newExpanded.add(taskId);
        setExpandedTasks(newExpanded);
    };

    const toggleExpandProject = (projectId: string) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectId)) newExpanded.delete(projectId);
        else newExpanded.add(projectId);
        setExpandedProjects(newExpanded);
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-12 bg-gray-100/80 rounded-xl w-full"></div>
                <div className="h-64 bg-gray-50/80 rounded-2xl w-full"></div>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
                <Calendar size={48} className="text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Aucune tâche planifiée</p>
            </div>
        );
    }


    const handleUpdateKanbanStatus = async (taskId: string, newStatus: string) => {
        try {
            await api.put(`/api/tasks/${taskId}`, { status: newStatus });
            await fetchGlobalTasks();
            showToast("Statut mis à jour", "success");
        } catch (err) {
            console.error("Erreur modification statut", err);
            showToast("Erreur modification statut", "error");
        }
    };

    const tasksByProject: Record<string, { project: Project; tasks: GanttTask[] }> = {};
    tasks.forEach(task => {
        if (!tasksByProject[task.projectId._id]) {
            tasksByProject[task.projectId._id] = { project: task.projectId, tasks: [] };
        }
        tasksByProject[task.projectId._id].tasks.push(task);
    });

    const isModern = user?.theme === 'modern';

    return (
        <div className={`rounded-3xl border flex flex-col ${isModern ? 'bg-white shadow-xl shadow-gray-200/40 border-gray-100 p-6' : 'bg-gray-50 border-gray-200 p-4 shadow-sm'} `}>
            <div className="mb-6">
                <h2 className={`text-lg transition-all ${isModern ? 'font-black text-gray-900 tracking-tight' : 'font-bold text-gray-800'}`}>
                    Récapitulatif Gantt Multi-Projets
                </h2>
                <p className="text-xs text-gray-500 mt-1 font-medium">Vue d'ensemble de la planification de tous vos projets actifs</p>
            </div>

            <div
                ref={scrollContainerRef}
                className="overflow-auto max-h-[75vh] pb-4 custom-scrollbar rounded-xl border border-gray-200 bg-white relative shadow-inner"
            >
                <div style={{ minWidth: `max(800px, ${totalDays * 35 + 350}px)` }}>
                    {/* Timeline Header */}
                    <div className="flex border-b border-gray-200 pb-2 sticky top-0 z-40 bg-white/95 backdrop-blur-md pt-3 shadow-sm">
                        <div className="w-[350px] shrink-0 sticky left-0 z-50 bg-white/95 backdrop-blur-md flex items-end px-4 pb-1 border-r border-gray-100/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Projets & Tâches</span>
                        </div>
                        <div className="flex flex-1">
                            {days.map((day, i) => {
                                const isToday = isSameDay(day, new Date());
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center justify-end relative min-w-[35px]">
                                        <span className={`text-[10px] ${isToday ? 'text-blue-600 font-black' : isWeekend ? 'text-gray-300 font-medium' : 'text-gray-500 font-bold'}`}>
                                            {format(day, 'd', { locale: fr })}
                                        </span>
                                        <span className={`text-[9px] uppercase ${isToday ? 'text-blue-500 font-bold' : 'text-gray-300'}`}>
                                            {format(day, 'MMM', { locale: fr })}
                                        </span>
                                        <div className="absolute top-full w-full border-r border-gray-100/60 z-[-1] h-[20000px] left-0 mt-2 pointer-events-none filter sepia-0"></div>
                                        {isToday && (
                                            <div className="absolute top-full w-0.5 bg-blue-500/20 z-0 h-[20000px] left-1/2 transform -translate-x-1/2 mt-2 border-l-2 border-dashed border-blue-400 pointer-events-none"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Liste des projets */}
                    <div className="relative z-10 mt-2">
                        {Object.values(tasksByProject).map(({ project, tasks: projectTasks }) => (
                            <div key={project._id} className="mb-4">
                                {/* Header Projet */}
                                <div
                                    onClick={() => toggleExpandProject(project._id)}
                                    className="flex items-center sticky left-0 z-[35] bg-gray-50/80 hover:bg-gray-100/80 transition-colors py-2 px-4 border-y border-gray-200/50 cursor-pointer w-[350px]"
                                >
                                    {expandedProjects.has(project._id) ? <ChevronDown size={14} className="mr-2 text-gray-500" /> : <ChevronRight size={14} className="mr-2 text-gray-500" />}
                                    <Folder size={14} className="mr-2 text-blue-500" />
                                    <span className="text-xs font-black text-gray-700 uppercase tracking-tight truncate">{project.title}</span>
                                    <span className="ml-auto bg-gray-200 text-gray-600 text-[9px] px-1.5 py-0.5 rounded-full font-bold">{projectTasks.length}</span>
                                </div>

                                {/* Tâches du projet */}
                                {expandedProjects.has(project._id) && projectTasks.map(task => {
                                    const start = startOfDay(new Date(task.startDate));
                                    const end = startOfDay(new Date(task.endDate));
                                    const startOffsetDays = differenceInDays(start, timelineStart);
                                    const durationDays = differenceInDays(end, start) + 1;
                                    const startPercent = Math.max(0, (startOffsetDays / totalDays) * 100);
                                    const widthPercent = Math.min(100 - startPercent, (durationDays / totalDays) * 100);

                                    let statusColor = 'from-gray-400 to-gray-500 shadow-gray-400/30';
                                    if (task.status === 'in-progress') statusColor = 'from-blue-500 to-indigo-500 shadow-blue-500/30';
                                    if (task.status === 'review') statusColor = 'from-purple-500 to-fuchsia-500 shadow-purple-500/30';
                                    if (task.status === 'done') statusColor = 'from-emerald-400 to-teal-500 shadow-emerald-500/30';

                                    const isExpanded = expandedTasks.has(task._id);

                                    return (
                                        <div key={task._id} className="flex flex-col mt-[1px]">
                                            <div className="flex items-center group relative h-9">
                                                {/* Gauche: Titre tâche */}
                                                <div className="w-[350px] pr-4 shrink-0 bg-white/95 backdrop-blur-sm z-30 group-hover:bg-gray-50/90 transition-colors h-full flex items-center border-r border-gray-100 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] pl-8">
                                                    <button onClick={() => toggleExpandTask(task._id)} className="p-1 mr-1 text-gray-400 hover:text-gray-700 transition-colors shrink-0">
                                                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                    </button>
                                                    <div className="truncate flex-1">
                                                        <div className="text-[11px] font-bold text-gray-800 truncate" title={task.title}>{task.title}</div>
                                                    </div>
                                                </div>

                                                {/* Droite: Barre Gantt */}
                                                <div className="flex-1 relative h-full bg-transparent overflow-visible group-hover:bg-gray-50/20 transition-colors">
                                                    <div
                                                        className={`absolute top-1 bottom-1 rounded bg-gradient-to-r ${statusColor} shadow-sm transition-all group-hover:brightness-105 flex items-center px-2 z-10 pointer-events-none`}
                                                        style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                                                    >
                                                        <span className="text-[8px] font-black text-white/90 truncate leading-none uppercase">
                                                            {durationDays} j
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sous-tâches Kanban */}
                                            {isExpanded && (task.kanbanTasks || []).map(kt => (
                                                <div key={kt._id} className="flex items-center h-8 group/kt relative">
                                                    <div className="w-[350px] pr-3 shrink-0 bg-gray-50/50 backdrop-blur-sm z-30 group-hover/kt:bg-white transition-colors h-full flex items-center border-r border-gray-100 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] pl-14">
                                                        <ListTodo size={10} className="text-gray-400 mr-2 shrink-0" />
                                                        <div className="text-[10px] font-medium text-gray-600 truncate" title={kt.title}>{kt.title}</div>
                                                        <div className="relative shrink-0 ml-auto">
                                                            <select
                                                                value={kt.status}
                                                                onChange={(e) => handleUpdateKanbanStatus(kt._id, e.target.value)}
                                                                className={`text-[9.5px] font-black border rounded-lg pl-2 pr-5 py-1 outline-none cursor-pointer transition-all shadow-sm appearance-none bg-none min-w-[85px] ${kt.status === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 focus:ring-2 focus:ring-emerald-200/50' :
                                                                    kt.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border-blue-200 focus:ring-2 focus:ring-blue-200/50' :
                                                                        kt.status === 'review' ? 'bg-purple-50 text-purple-600 border-purple-200 focus:ring-2 focus:ring-purple-200/50' :
                                                                            'bg-white text-gray-600 border-gray-200 focus:ring-2 focus:ring-gray-200/50'
                                                                    }`}
                                                            >
                                                                <option value="todo">À faire</option>
                                                                <option value="in-progress">En cours</option>
                                                                <option value="review">À valider</option>
                                                                <option value="done">Terminé</option>
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
                                                    <div className="flex-1 relative h-full" />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
