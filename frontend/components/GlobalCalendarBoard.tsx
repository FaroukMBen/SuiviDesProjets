'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X, Flag, UploadCloud, CheckCircle2, Clock, GanttChartSquare, CornerDownRight, LayoutDashboard } from 'lucide-react';
import api from '@/lib/auth';
import { useAuthStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';


interface Member {
  _id: string;
  name: string;
}

interface Project {
  _id: string;
  title: string;
}

interface Item {
  id: string;
  type: 'kanban' | 'gantt' | 'milestone';
  title: string;
  date?: Date;
  endDate?: Date;
  status?: string;
  category?: 'livrable' | 'point_de_controle';
  ganttTaskId?: string;
  assignee?: Member;
  projectId?: Project;
}

export function GlobalCalendarBoard() {
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');

  const isModern = user?.theme === 'modern';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, ganttRes] = await Promise.all([
        api.get('/api/tasks/my-global-tasks'),
        api.get('/api/gantt-tasks/my-global-gantt-tasks')
      ]);

      const allItems: Item[] = [];

      if (tasksRes.data.tasks) {
        tasksRes.data.tasks.forEach((t: { _id: string; title: string; dueDate?: string; status?: string; assignee?: Member; ganttTaskId?: string; ganttTask?: string; projectId?: Project }) => {
          allItems.push({
            id: t._id,
            type: 'kanban',
            title: t.title,
            date: t.dueDate ? new Date(t.dueDate) : undefined,
            status: t.status,
            assignee: t.assignee,
            ganttTaskId: t.ganttTaskId || t.ganttTask || undefined,
            projectId: t.projectId
          });
        });
      }

      if (ganttRes.data.tasks) {
        ganttRes.data.tasks.forEach((t: { _id: string; title: string; endDate?: string; status?: string; projectId?: Project }) => {
          allItems.push({
            id: t._id,
            type: 'gantt',
            title: t.title,
            endDate: t.endDate ? new Date(t.endDate) : undefined,
            status: t.status,
            projectId: t.projectId
          });
        });
      }

      setItems(allItems);
    } catch (err) {
      console.error("Erreur chargement agenda global", err);
      showToast("Erreur de chargement de l'agenda global", "error");
    } finally {
      setLoading(false);
    }
  };

  const getItemColorAndIcon = (item: Item) => {
    let colorClass = 'bg-blue-50 text-blue-600 border-blue-100';
    let Icon = Clock;

    if (item.type === 'milestone') {
      if (item.category === 'livrable') {
        colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-100 saturate-[1.2]';
        Icon = UploadCloud;
      } else {
        colorClass = 'bg-purple-50 text-purple-600 border-purple-100';
        Icon = Flag;
      }
    } else if (item.type === 'gantt') {
      colorClass = 'bg-indigo-50 text-indigo-600 border-indigo-100 uppercase tracking-widest text-[8px]';
      Icon = GanttChartSquare;
    } else if (item.status === 'done') {
      colorClass = 'bg-gray-50 text-gray-400 border-gray-100 line-through opacity-70';
      Icon = CheckCircle2;
    }

    return { colorClass, Icon };
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div>
          <h2 className={`text-2xl transition-all ${isModern ? 'font-black text-gray-900 tracking-tight' : 'font-bold text-gray-800'}`}>
            Agenda Global
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-medium italic">
            Cliquez sur un jour pour voir les détails de tous vos projets.
          </p>
        </div>

        <div className={`flex items-center gap-2 p-1.5 rounded-2xl border ${isModern ? 'bg-white shadow-xl shadow-gray-200/40 border-gray-100' : 'bg-gray-100 border-gray-200'}`}>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-blue-600">
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          <div className="px-4 min-w-[150px] text-center">
            <span className={`text-sm uppercase tracking-widest ${isModern ? 'font-black text-gray-900' : 'font-bold text-gray-700'}`}>
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </span>
          </div>

          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-blue-600">
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>

          <div className="w-px h-6 bg-gray-100 mx-1" />

          <button
            onClick={() => setCurrentMonth(new Date())}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${isModern
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700'
              : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50'
              }`}
          >
            Aujourd&apos;hui
          </button>
        </div>
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const filteredItems = items.filter(item => {
      if (viewMode === 'all') return true;
      if (item.type !== 'kanban') return true;
      const isMine = item.assignee?._id === user?.id;
      const isUnassigned = !item.assignee || !item.assignee._id;
      return isMine || isUnassigned;
    });

    return (
      <div className={`grid grid-cols-7 border-t border-l ${isModern ? 'border-gray-100' : 'border-gray-200'} rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50 bg-white`}>
        {calendarDays.map((day, i) => {

          const dayItems = filteredItems.filter(item => {
            const checkDay = startOfDay(day);
            if (item.type === 'milestone' && item.date && isSameDay(item.date, checkDay)) return true;
            if (item.type === 'gantt' && item.endDate && isSameDay(item.endDate, checkDay)) return true;
            if (item.type === 'kanban' && item.date && isSameDay(item.date, checkDay)) return true;
            return false;
          });

          dayItems.sort((a, b) => {
            const priority = { milestone: 1, gantt: 2, kanban: 3 };
            return priority[a.type] - priority[b.type];
          });

          const MAX_ITEMS = 3;
          const displayItems = dayItems.slice(0, MAX_ITEMS);
          const hiddenCount = dayItems.length - MAX_ITEMS;

          return (
            <div
              key={i}
              onClick={() => setSelectedDay(day)}
              className={`h-[135px] overflow-hidden p-2 border-r border-b cursor-pointer flex flex-col transition-all hover:bg-blue-50/50 group ${isModern ? 'border-gray-100' : 'border-gray-200'
                } ${!isSameMonth(day, monthStart) ? 'bg-gray-50/70' : 'bg-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-lg transition-all ${isToday(day)
                  ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/30'
                  : !isSameMonth(day, monthStart)
                    ? 'text-gray-300 font-medium'
                    : 'text-gray-600 font-extrabold group-hover:text-blue-600'
                  }`}>
                  {format(day, 'd')}
                </span>
                {isToday(day) && <span className="text-[8px] font-black uppercase text-blue-500 hidden xl:inline-block">Auj.</span>}
              </div>

              <div className="space-y-1 overflow-hidden">
                {displayItems.map((item, idx) => {
                  const { colorClass, Icon } = getItemColorAndIcon(item);

                  return (
                    <div
                      key={idx}
                      className={`flex flex-col gap-0.5 px-1.5 py-1 rounded border shadow-sm transition-transform ${colorClass}`}
                      title={`${item.title} - ${item.projectId?.title || 'Global'}`}
                    >
                      <div className="flex items-center gap-1">
                        <Icon size={9} className="shrink-0" />
                        <span className="text-[9px] font-bold truncate">{item.title}</span>
                      </div>
                      {item.projectId && (
                        <div className="text-[7px] font-black uppercase tracking-tight truncate opacity-80 pl-[13px]">
                          {item.projectId.title}
                        </div>
                      )}
                    </div>
                  );
                })}

                {hiddenCount > 0 && (
                  <div className="text-[9px] font-black text-gray-400 text-center uppercase tracking-widest pt-0.5">
                    + {hiddenCount} autre{hiddenCount > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderModal = () => {
    if (!selectedDay) return null;

    const filteredItems = items.filter(item => {
      if (viewMode === 'all') return true;
      if (item.type !== 'kanban') return true;
      const isMine = item.assignee?._id === user?.id;
      const isUnassigned = !item.assignee || !item.assignee._id;
      return isMine || isUnassigned;
    });

    const checkDay = startOfDay(selectedDay);

    const dayMilestones = filteredItems.filter(i => i.type === 'milestone' && i.date && isSameDay(i.date, checkDay));

    const dayGantts = filteredItems.filter(i => i.type === 'gantt' && i.endDate && isSameDay(i.endDate, checkDay));

    const independentDayKanbans = filteredItems.filter(i => {
      if (i.type !== 'kanban' || !i.date || !isSameDay(i.date, checkDay)) return false;
      if (i.ganttTaskId && dayGantts.some(g => g.id === i.ganttTaskId)) return false;
      return true;
    });

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in"
        onClick={() => setSelectedDay(null)}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
            <div>
              <h3 className="text-xl font-black text-gray-900">
                {format(selectedDay, 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Détail des événements</p>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-2 bg-white rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm border border-gray-100"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">

            {/* Milestones */}
            {dayMilestones.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  Jalons & Livrables
                </h4>
                <div className="grid gap-2">
                  {dayMilestones.map(m => {
                    const { colorClass, Icon } = getItemColorAndIcon(m);
                    return (
                      <div key={m.id} className={`flex flex-col gap-1 p-3 rounded-xl border ${colorClass}`}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                            <Icon size={16} />
                          </div>
                          <span className="font-bold text-sm truncate">{m.title}</span>
                        </div>
                        {m.projectId && (
                          <span className="text-[9px] font-black uppercase text-gray-500 ml-[46px]">{m.projectId.title}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gantts + Subtasks Kanban */}
            {dayGantts.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  Tâches Gantt (Deadlines)
                </h4>
                <div className="space-y-4">
                  {dayGantts.map(gantt => {

                    const subTasks = filteredItems.filter(i => i.type === 'kanban' && i.ganttTaskId === gantt.id);

                    return (
                      <div key={gantt.id} className="border border-indigo-100 rounded-2xl p-4 bg-indigo-50/40 relative overflow-hidden">
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500"></div>

                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <GanttChartSquare size={18} className="text-indigo-600 shrink-0" />
                              <span className="font-black text-indigo-900 text-sm leading-tight">{gantt.title}</span>
                            </div>
                            {gantt.projectId && (
                              <span className="text-[10px] font-black uppercase text-indigo-500 ml-[30px]">{gantt.projectId.title}</span>
                            )}
                          </div>
                          <Link href={`/projects/${gantt.projectId?._id || ''}/gestion/gantt`} className="shrink-0 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 bg-white/50 hover:bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100 shadow-sm transition-all hover:scale-105">
                            <GanttChartSquare size={10} /> Aller
                          </Link>
                        </div>

                        {subTasks.length > 0 ? (
                          <div className="ml-5 pl-4 border-l-2 border-indigo-200/60 space-y-2">
                            {subTasks.map(sub => (
                              <Link href={`/projects/${sub.projectId?._id || ''}/gestion/kanban`} key={sub.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-indigo-50 shadow-sm transition-all hover:border-indigo-200 group cursor-pointer hover:shadow-md hover:scale-[1.01]">
                                <div className="flex items-center gap-2">
                                  <CornerDownRight size={12} className="text-gray-300 group-hover:text-indigo-400" />
                                  <Clock size={12} className={sub.status === 'done' ? 'text-gray-300' : 'text-blue-500'} />
                                  <span className={`text-[11px] font-bold truncate ${sub.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                    {sub.title}
                                  </span>
                                </div>
                                <span className="text-[8px] font-bold uppercase text-gray-400 group-hover:text-blue-500 flex items-center gap-1">
                                  <LayoutDashboard size={8} /> Kanban
                                </span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] font-semibold text-gray-400 ml-8 uppercase tracking-wider">
                            Aucune sous-tâche associée
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Independent Kanbans */}
            {independentDayKanbans.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  Tâches Kanban
                </h4>
                <div className="grid gap-2">
                  {independentDayKanbans.map(k => {
                    const { colorClass, Icon } = getItemColorAndIcon(k);
                    return (
                      <Link href={`/projects/${k.projectId?._id || ''}/gestion/kanban`} key={k.id} className={`flex flex-col gap-1 p-3 rounded-xl border opacity-90 transition-all hover:opacity-100 hover:shadow-md hover:scale-[1.01] ${colorClass}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon size={14} className="shrink-0" />
                            <span className="font-bold text-xs truncate">{k.title}</span>
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0 ml-2">
                            <LayoutDashboard size={8} /> Kanban
                          </span>
                        </div>
                        {k.projectId && (
                          <span className="text-[9px] font-black uppercase opacity-70 ml-[26px]">{k.projectId.title}</span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {dayMilestones.length === 0 && dayGantts.length === 0 && independentDayKanbans.length === 0 && (
              <div className="text-center py-12 rounded-3xl border-2 border-dashed border-gray-100 bg-gray-50/50">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Rien de prévu à cette date</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-16 bg-gray-100 rounded-2xl w-full"></div>
        <div className="grid grid-cols-7 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="h-24 bg-gray-50 rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-12">
      {renderHeader()}

      {/* Filtres et Légende combinés en haut */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 bg-gray-50/50 p-1 rounded-2xl border border-gray-100">
          <button
            onClick={() => setViewMode('all')}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-500 hover:text-blue-600 hover:bg-white'
              }`}
          >Tout le monde</button>
          <button
            onClick={() => setViewMode('mine')}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'mine'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-gray-500 hover:text-blue-600 hover:bg-white'
              }`}
          >Pour moi</button>
        </div>

        <div className="flex flex-wrap gap-5 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm" />
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><UploadCloud size={10} /> Livrables</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-sm" />
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><Flag size={10} /> Points de contrôle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-sm" />
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><GanttChartSquare size={10} /> Tâches Gantt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm" />
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5"><Clock size={10} /> Tâches Kanban</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, h) => (
          <div key={h} className="text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{day}</span>
          </div>
        ))}
      </div>

      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 blur-3xl opacity-30 -z-10 rounded-full" />
        {renderCells()}
      </div>

      {renderModal()}
    </div>
  );
}
