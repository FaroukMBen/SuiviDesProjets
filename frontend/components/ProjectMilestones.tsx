'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth';
import { Flag, Calendar, CheckCircle, Clock, AlertCircle, UploadCloud, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

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
}

export function ProjectMilestones({ campaignId, projectId }: ProjectMilestonesProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      fetchMilestones();
    }
  }, [campaignId]);

  const fetchMilestones = async () => {
    try {
      const res = await api.get(`/api/milestones/campaign/${campaignId}`);
      // Trier par date croissante
      const sorted = res.data.milestones.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setMilestones(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (dateString: string) => {
    const today = new Date();
    const deadline = new Date(dateString);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'text-red-500 bg-red-50 border-red-100'; // En retard
    if (diffDays <= 3) return 'text-orange-500 bg-orange-50 border-orange-100'; // Urgent
    return 'text-blue-500 bg-blue-50 border-blue-100'; // OK
  };

  const getStatusText = (dateString: string) => {
    const today = new Date();
    const deadline = new Date(dateString);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Terminé / Passé';
    if (diffDays === 0) return "C'est aujourd'hui !";
    return `J - ${diffDays}`;
  };

  if (loading) return <div className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>;
  if (milestones.length === 0) return null;

  const today = new Date();
  today.setHours(0,0,0,0);
  const nextMilestone = milestones.find(m => new Date(m.date) >= today) || milestones[milestones.length - 1];

  return (
    <Card className="p-0 overflow-hidden border-blue-100 shadow-sm">
      <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
            <Flag size={18} className="text-blue-600" />
            Prochains Objectifs
            </h3>
            <Link 
                href={`/projects/${projectId}/milestones`}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
                Voir tout le planning →
            </Link>
        </div>
        {nextMilestone && (
           <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(nextMilestone.date)}`}>
              Prochain : {new Date(nextMilestone.date).toLocaleDateString()} ({getStatusText(nextMilestone.date)})
           </span>
        )}
      </div>
      
      <div className="p-0">
        <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
           {milestones.map((m) => {
             const isPast = new Date(m.date) < new Date();
             return (
               <div key={m._id} className={`p-4 flex gap-4 hover:bg-gray-50 transition ${isPast ? 'opacity-60 bg-gray-50/50' : ''}`}>
                  <div className="flex flex-col items-center min-w-[50px]">
                     <span className="text-xs text-gray-400 font-bold uppercase">{new Date(m.date).toLocaleDateString('fr-FR', {month: 'short'})}</span>
                     <span className={`text-xl font-bold ${isPast ? 'text-gray-400' : 'text-gray-800'}`}>
                        {new Date(m.date).getDate()}
                     </span>
                  </div>
                  
                  <div className="flex-1">
                     <div className="flex justify-between items-start">
                        <h4 className={`font-bold text-sm ${isPast ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                            {m.title}
                        </h4>
                        {m.type === 'livrable' && (
                           <span title="Livrable attendu" className="text-orange-500 bg-orange-50 p-1 rounded">
                              <UploadCloud size={14} />
                           </span>
                        )}
                     </div>
                     <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.description}</p>
                  </div>
               </div>
             );
           })}
        </div>
      </div>
    </Card>
  );
}
