'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/auth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, ArrowRight, Filter } from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  status: string;
  updatedAt: string;
  owner: { name: string };
  members?: { name: string; profilePicture?: string }[];
  tags?: string[];
  banner?: string;
  repositoryUrl?: string;
  campaignId?: { _id: string; title: string; banner?: string };
}

export function RecentProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/api/projects');
        setProjects(response.data.projects.slice(0, 6));
      } catch (err) {
        console.error("Erreur chargement projets", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500">Vous ne faites partie d'aucun projet pour le moment.</p>
        <Link href="/projects/new" className="text-blue-600 font-medium hover:underline mt-2 inline-block">
          Créer un nouveau projet
        </Link>
      </div>
    );
  }

  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'active') return p.status === 'active';
    return p.status !== 'active';
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Actif', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      case 'completed':
        return { label: 'Terminé', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'archived':
        return { label: 'Archivé', color: 'bg-gray-100 text-gray-700 border-gray-200' };
      default:
        return { label: status || 'Inconnu', color: 'bg-gray-100 text-gray-600 border-gray-200' };
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 p-6 space-y-4">
      <div className="flex justify-between items-end px-1 pb-2">
        <div>
          <h2 className="text-lg font-black text-gray-900">Projets récents</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-1">Vos derniers travaux</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <Filter size={14} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 rounded-lg px-2 py-1 outline-none focus:border-blue-300 font-medium"
            >
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs / Terminés</option>
            </select>
          </div>

          <Link
            href="/projects"
            className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest transition-all group"
          >
            Voir tout
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredProjects.length > 0 ? filteredProjects.map((project) => {
          const statusInfo = getStatusInfo(project.status);
          const isCampaign = !!project.campaignId;
          const bannerUrl = project.campaignId?.banner || project.banner || "https://iut.lukamaret.com/img/Lyon-1-Claude-Bernard.png";

          return (
            <Link key={project._id} href={`/projects/${project._id}`} className="block group">
              <Card className={`h-full hover:shadow-md hover:border-blue-200 transition-all cursor-pointer relative flex flex-col p-4 border-t-4 ${project.status === 'active' ? 'border-t-emerald-500' : project.status === 'completed' ? 'border-t-blue-500' : 'border-t-gray-400'}`}>
                {project.status === 'active' && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full animate-pulse z-10 outline outline-2 outline-white"></div>
                )}

                {bannerUrl && (
                  <div className="-mx-4 -mt-4 mb-4 h-24 overflow-hidden rounded-t-[calc(0.75rem-1px)]">
                    <img
                      src={bannerUrl}
                      alt="banner"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                      {isCampaign ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-600 border-purple-200" title={`Campagne : ${project.campaignId?.title}`}>
                          Campagne
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
                          Libre
                        </span>
                      )}
                      {project.tags && project.tags.length > 0 && (
                        <Badge variant="blue">{project.tags[0]}</Badge>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-1">
                    {project.title}
                  </h3>

                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {isCampaign ? project.campaignId?.title : `Par ${project.owner?.name}`}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock size={12} />
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>

                  {/* Aperçu des membres */}
                  {project.members && project.members.length > 0 && (
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 3).map((member, idx) => (
                        <div
                          key={idx}
                          className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-sm"
                          title={member.name}
                        >
                          {member.profilePicture ? (
                            <img src={member.profilePicture} alt={member.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            member.name.charAt(0).toUpperCase()
                          )}
                        </div>
                      ))}
                      {project.members.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          );
        }) : (
          <div className="col-span-3 text-center py-6 text-sm text-gray-400 font-medium">
            Aucun projet ne correspond à ce filtre
          </div>
        )}
      </div>
    </div>
  );
}