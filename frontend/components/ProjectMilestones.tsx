'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth';
import { Flag, Calendar, CheckCircle, Clock, AlertCircle, UploadCloud, FileText } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore, useThemeStore } from '@/lib/store';

interface Milestone {
  _id: string;
  title: string;
  description: string;
  date: string;
  type: 'livrable' | 'point_de_controle';
}

interface ProjectMilestonesProps {
  campaignId: string;
  projectId: string;
  projectFiles?: any[]; // Ajout des fichiers pour vérifier le statut
}

export function ProjectMilestones({ campaignId, projectId, projectFiles = [] }: ProjectMilestonesProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useThemeStore();

  const isModern = theme === 'modern';

  useEffect(() => {
    if (campaignId) {
      fetchMilestones();
    }
  }, [campaignId]);

  const fetchMilestones = async () => {
    try {
      const res = await api.get(`/api/milestones/campaign/${campaignId}`);
      const sorted = res.data.milestones.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setMilestones(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (dateString: string, isDone: boolean) => {
    if (isDone) return isModern ? 'text-emerald-600 bg-emerald-50' : 'text-emerald-700 bg-emerald-50 border border-emerald-100';

    const today = new Date();
    const deadline = new Date(dateString);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return isModern ? 'text-gray-400 bg-gray-50' : 'text-gray-500 bg-gray-100';
    if (diffDays <= 3) return isModern ? 'text-orange-600 bg-orange-50' : 'text-orange-700 bg-orange-100 border border-orange-200';
    return isModern ? 'text-blue-600 bg-blue-50' : 'text-blue-700 bg-blue-50 border border-blue-100';
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2].map(i => <div key={i} className={`h-16 bg-gray-50 ${isModern ? 'rounded-2xl' : 'rounded-xl'}`}></div>)}
    </div>
  );

  if (milestones.length === 0) return (
    <div className="text-center py-8">
      <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Aucun jalon défini</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {milestones.map((m, idx) => {
        const isPast = new Date(m.date) < new Date();
        const deliveredFile = projectFiles.find(f => f.milestoneId === m._id);
        const isDone = !!deliveredFile;
        const statusColor = getStatusColor(m.date, isDone);

        return (
          <div key={m._id} className={`flex gap-6 relative group ${idx !== milestones.length - 1 ? 'pb-8' : ''}`}>
            {/* Timeline Line */}
            {idx !== milestones.length - 1 && (
              <div className={`absolute left-[2.25rem] top-10 bottom-0 w-0.5 transition-colors ${isModern ? 'bg-gray-100 group-hover:bg-blue-100' : 'bg-gray-200 group-hover:bg-blue-200'} ${isDone ? 'bg-emerald-100' : ''}`}></div>
            )}

            {/* Date Circle/Box */}
            <div className={`shrink-0 w-16 h-16 border-2 flex flex-col items-center justify-center bg-white z-10 transition-all group-hover:scale-105 ${isModern
              ? `rounded-2xl ${isDone ? 'border-emerald-200 shadow-lg shadow-emerald-50' : isPast ? 'border-gray-100' : 'border-blue-50 shadow-lg shadow-blue-100'}`
              : `rounded-md ${isDone ? 'border-emerald-200 bg-emerald-50/30' : isPast ? 'border-gray-200 bg-gray-50' : 'border-blue-200 shadow-sm'}`
              }`}>
              {isDone ? (
                <CheckCircle size={24} className="text-emerald-500" />
              ) : (
                <>
                  <span className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">
                    {new Date(m.date).toLocaleDateString('fr-FR', { month: 'short' })}
                  </span>
                  <span className={`text-lg leading-none ${isModern ? 'font-black' : 'font-bold'} ${isPast ? 'text-gray-400' : 'text-gray-900'}`}>
                    {new Date(m.date).getDate()}
                  </span>
                </>
              )}
            </div>

            {/* Content Card */}
            <div className={`flex-1 p-5 border transition-all ${isModern
              ? `rounded-3xl ${isDone ? 'bg-white border-emerald-100' : isPast ? 'bg-gray-50/50 border-gray-100 opacity-60' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-gray-200/20'}`
              : `rounded-lg ${isDone ? 'bg-emerald-50/10 border-emerald-100' : isPast ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'}`
              }`}>
              <div className="flex justify-between items-start mb-1">
                <h4 className={`text-base tracking-tight ${isModern ? 'font-black' : 'font-bold'} ${isPast && !isDone ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                  {m.title}
                </h4>
                <div className="flex gap-2">
                  {isDone && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-200">
                      Terminé
                    </span>
                  )}
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${statusColor}`}>
                    {m.type === 'livrable' ? 'Livrable' : 'Point de contrôle'}
                  </span>
                </div>
              </div>
              <p className={`text-xs text-gray-400 tracking-tight line-clamp-2 leading-relaxed italic ${isModern ? 'font-bold' : 'font-semibold'}`}>
                {m.description || "Aucune description fournie pour ce jalon."}
              </p>

              {isDone && deliveredFile && (
                <div className="mt-4 flex items-center justify-between p-3 bg-white border border-emerald-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold text-gray-700 truncate max-w-[200px]">{deliveredFile.name}</span>
                  </div>
                  <Link href={`/projects/${projectId}/liverables`} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">
                    Détails
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
