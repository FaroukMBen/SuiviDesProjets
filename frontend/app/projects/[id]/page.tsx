'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  FileText,
  Download,
  Calendar,
  Users,
  BarChart3,
  UploadCloud,
  ChevronRight,
  GitCommit,
  ArrowRight,
  ExternalLink,
  Plus,
  LayoutDashboard,
  Settings,
  FolderGit2,
  Clock,
  UserPlus,
  CheckCircle
} from 'lucide-react';
import api from '@/lib/auth';
import { UserSearch } from '@/components/UserSearch';
import { useProjectFiles } from '@/hooks/useProjectFiles';
import { ProjectMilestones } from '@/components/ProjectMilestones';
import { useToast } from '@/components/ui/Toast';
import { useThemeStore, useAuthStore } from '@/lib/store';

export default function ProjectOverviewPage() {
  const { showToast } = useToast();
  const params = useParams();
  const { user } = useAuthStore();
  // const { theme } = useThemeStore();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commits, setCommits] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const isModern = user?.theme === 'modern';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, commitRes] = await Promise.all([
        api.get(`/api/projects/${params.id}`),
        api.get(`/api/commits/project/${params.id}`).catch(() => ({ data: { commits: [] } }))
      ]);
      setProject(projRes.data.project);
      setCommits(commitRes.data.commits?.slice(0, 3) || []);
    } finally {
      setLoading(false);
    }
  };

  const { uploading, uploadFile, downloadFile } = useProjectFiles(params.id as string, fetchData);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  if (loading || !project) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className={`h-24 bg-gray-100 ${isModern ? 'rounded-[2rem]' : 'rounded-xl'}`}></div>)}
      </div>
      <div className="grid grid-cols-3 gap-8">
        <div className={`col-span-2 h-96 bg-gray-100 ${isModern ? 'rounded-[2rem]' : 'rounded-xl'}`}></div>
        <div className={`h-96 bg-gray-100 ${isModern ? 'rounded-[2rem]' : 'rounded-xl'}`}></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* 1. Dashboard-style Cards Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`bg-white p-6 border transition-all flex items-center justify-between group ${isModern ? 'rounded-[2rem] border-gray-100 shadow-sm hover:shadow-md' : 'rounded-lg border-gray-200 hover:border-blue-300'
          }`}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isModern ? 'text-gray-400' : 'text-gray-500'}`}>Status Actuel</p>
            <h3 className={`text-xl ${isModern ? 'font-black' : 'font-bold'} ${project.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>
              {project.status === 'in_progress' ? 'En cours' : project.status === 'completed' ? 'Terminé' : 'En attente'}
            </h3>
          </div>
          <div className={`p-3 transition-transform group-hover:scale-110 ${isModern ? 'rounded-2xl bg-blue-50 text-blue-600' : 'rounded-md bg-gray-50 text-gray-700 border border-gray-200'}`}>
            <BarChart3 size={24} />
          </div>
        </div>

        <div className={`bg-white p-6 border transition-all flex items-center justify-between group ${isModern ? 'rounded-[2rem] border-gray-100 shadow-sm hover:shadow-md' : 'rounded-lg border-gray-200 hover:border-blue-300'
          }`}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isModern ? 'text-gray-400' : 'text-gray-500'}`}>Date Limite</p>
            <h3 className={`text-xl text-gray-900 ${isModern ? 'font-black' : 'font-bold'}`}>
              {project.deadline ? new Date(project.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Non définie'}
            </h3>
          </div>
          <div className={`p-3 transition-transform group-hover:scale-110 ${isModern ? 'rounded-2xl bg-orange-50 text-orange-600' : 'rounded-md bg-gray-50 text-gray-700 border border-gray-200'}`}>
            <Calendar size={24} />
          </div>
        </div>

        <div className={`bg-white p-6 border transition-all flex items-center justify-between group ${isModern ? 'rounded-[2rem] border-gray-100 shadow-sm hover:shadow-md' : 'rounded-lg border-gray-200 hover:border-blue-300'
          }`}>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isModern ? 'text-gray-400' : 'text-gray-500'}`}>Livrables</p>
            <h3 className={`text-xl text-gray-900 ${isModern ? 'font-black' : 'font-bold'}`}>{project.files?.length || 0} partagé(s)</h3>
          </div>
          <div className={`p-3 transition-transform group-hover:scale-110 ${isModern ? 'rounded-2xl bg-emerald-50 text-emerald-600' : 'rounded-md bg-gray-50 text-gray-700 border border-gray-200'}`}>
            <FileText size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLONNE GAUCHE - CONTENU PRINCIPAL */}
        <div className="lg:col-span-2 space-y-8">

          {/* Timeline / Milestones */}
          {project.campaignId && (
            <div className={`bg-white p-8 border ${isModern ? 'rounded-[2rem] border-gray-100 shadow-sm' : 'rounded-lg border-gray-200'}`}>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className={`text-lg text-gray-900 uppercase tracking-tight ${isModern ? 'font-black' : 'font-bold'}`}>Objectifs & Jalons</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-1">Timeline de la campagne</p>
                </div>
                <Link href={`/projects/${project._id}/milestones`} className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest group">
                  Détails <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <ProjectMilestones campaignId={project.campaignId} projectId={project._id} />
            </div>
          )}

          {/* GitHub Activity Preview */}
          {project.repositoryUrl && (
            <div className={`bg-white p-8 border ${isModern ? 'rounded-[2rem] border-gray-100 shadow-sm' : 'rounded-lg border-gray-200'}`}>
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className={`text-lg text-gray-900 flex items-center gap-2 uppercase tracking-tight ${isModern ? 'font-black' : 'font-bold'}`}>
                    <GitCommit size={20} className={isModern ? 'text-gray-900' : 'text-blue-600'} />
                    Derniers Commits
                  </h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-1">Activité GitHub</p>
                </div>
                <Link href={`/projects/${project._id}/commits`} className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest group">
                  Voir tout <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="divide-y divide-gray-100">
                {commits.length > 0 ? (
                  commits.map(commit => (
                    <div key={commit._id} className="py-3 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center transition-colors ${isModern ? 'rounded-lg bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600' : 'rounded-md bg-white border border-gray-200 text-gray-500 group-hover:border-blue-300 group-hover:text-blue-600'}`}>
                          <GitCommit size={16} />
                        </div>
                        <div>
                          <p className={`text-sm text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors ${isModern ? 'font-bold' : 'font-semibold'}`}>{commit.message.split('\n')[0]}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Par {commit.githubAuthor?.login} • {new Date(commit.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">+{commit.insertions}</span>
                        <span className="text-[10px] font-mono text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">-{commit.deletions}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 py-4 italic text-center">Aucun commit synchronisé</p>
                )}
              </div>
            </div>
          )}

          {/* Documents / Files Preview */}
          <div className={`bg-white p-8 border ${isModern ? 'rounded-[2rem] border-gray-100 shadow-sm' : 'rounded-lg border-gray-200'}`}>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className={`text-lg text-gray-900 uppercase tracking-tight ${isModern ? 'font-black' : 'font-bold'}`}>Derniers Livrables</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-1">Documents partagés</p>
              </div>
              <div className="flex items-center gap-4">
                <label className={`cursor-pointer text-xs font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 uppercase tracking-widest transition-all ${uploading ? 'opacity-50' : ''}`}>
                  <Plus size={14} />
                  {uploading ? 'Envoi...' : 'Ajouter'}
                  <input type="file" className="hidden" onChange={async (e) => {
                    if (e.target.files?.[0]) await uploadFile(e.target.files[0]);
                  }} disabled={uploading} />
                </label>
                <Link href={`/projects/${project._id}/liverables`} className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest group">
                  Voir tout <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.files?.slice(-4).reverse().map((file: any) => (
                <div key={file._id} className={`p-4 border flex items-center justify-between group transition-all ${isModern ? 'bg-gray-50/50 rounded-2xl border-gray-100 hover:border-blue-200' : 'bg-white rounded-md border-gray-200 hover:bg-gray-50 hover:border-blue-300'
                  }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 text-blue-600 ${isModern ? 'rounded-xl bg-white shadow-sm' : 'rounded-md bg-blue-50 border border-blue-100'}`}>
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm text-gray-900 truncate ${isModern ? 'font-bold' : 'font-semibold'}`}>{file.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => downloadFile(file.path, file.name)} className={`p-2 transition-all ${isModern ? 'text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md'}`}>
                    <Download size={18} />
                  </button>
                </div>
              ))}
              {(!project.files || project.files.length === 0) && (
                <p className="col-span-2 text-sm text-gray-400 text-center py-8 italic font-medium">Aucun document pour le moment</p>
              )}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE - RACCOURCIS & INFOS */}
        <div className="space-y-8">
          {/* Raccourcis / Quick Actions */}
          <div className={`bg-white p-8 border transition-all ${isModern ? 'rounded-[2rem] border-gray-100 shadow-xl shadow-gray-200/20' : 'rounded-lg border-gray-200'
            }`}>
            <h3 className={`text-base text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight ${isModern ? 'font-black' : 'font-bold'}`}>
              <LayoutDashboard size={20} className="text-blue-600" />
              Raccourcis
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Kanban', href: 'kanban', icon: <ArrowRight className={`w-6 h-6 rotate-[-45deg] group-hover:rotate-0 transition-transform`} /> },
                { label: 'Git Code', href: 'commits', icon: <GitCommit size={24} /> },
                { label: 'Évaluation', href: 'evaluations', icon: <BarChart3 size={24} /> },
                { label: 'Config', href: 'settings', icon: <Settings size={24} /> }
              ].map(action => (
                <Link key={action.label} href={`/projects/${project._id}/${action.href}`} className={`flex flex-col items-center justify-center p-4 transition-all group gap-2 ${isModern ? 'bg-gray-50 rounded-2xl hover:bg-blue-50 hover:text-blue-600' : 'bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 text-gray-700'
                  }`}>
                  {action.icon}
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div className={`bg-white p-8 border ${isModern ? 'rounded-[2rem] border-gray-100 shadow-sm' : 'rounded-lg border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-base text-gray-900 flex items-center gap-2 uppercase tracking-tight ${isModern ? 'font-black' : 'font-bold'}`}>
                <Users size={20} className="text-blue-600" />
                Équipe
              </h3>
              <button
                onClick={() => setShowInviteModal(true)}
                className={`p-2 transition-all ${isModern ? 'text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100' : 'text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300'}`}
              >
                <UserPlus size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {project.members?.map((member: any) => (
                <div key={member._id} className={`flex items-center gap-3 p-2 transition-all ${isModern ? 'bg-gray-50/50 rounded-2xl border border-gray-100/50' : 'bg-white border border-gray-200 rounded-lg hover:bg-gray-50'}`}>
                  <div className={`w-10 h-10 flex items-center justify-center text-[10px] transition-all ${isModern ? 'bg-white rounded-xl text-blue-600 font-black shadow-sm border border-gray-100' : 'bg-slate-100 rounded-md text-slate-600 font-bold border border-slate-200'
                    }`}>
                    {member.firstName?.[0] || member.name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm text-gray-900 truncate leading-none mb-1 ${isModern ? 'font-bold' : 'font-semibold'}`}>{member.firstName} {member.lastName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter truncate">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Info */}
          <div className={`bg-white p-8 border relative overflow-hidden ${isModern ? 'rounded-[2rem] border-gray-100 shadow-sm' : 'rounded-lg border-gray-200'}`}>
            {!isModern && <div className="absolute top-0 right-0 w-1 h-full bg-blue-600"></div>}
            {isModern && <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-blue-600 pointer-events-none"><FolderGit2 size={120} /></div>}

            <h3 className={`text-base text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight ${isModern ? 'font-black' : 'font-bold'}`}>
              <FolderGit2 size={20} className="text-blue-600" />
              Infos Techniques
            </h3>
            <div className="space-y-4">
              {project.repositoryUrl ? (
                <div className={`p-4 border transition-all ${isModern ? 'bg-blue-50/50 rounded-2xl border-blue-100' : 'bg-white rounded-lg border-gray-200'}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isModern ? 'text-blue-600' : 'text-gray-500'}`}>Dépôt GitHub</p>
                  <a href={project.repositoryUrl} target="_blank" className={`text-xs font-black hover:underline break-all flex items-center gap-2 ${isModern ? 'text-blue-900' : 'text-blue-600'}`}>
                    {project.repositoryUrl.replace('https://github.com/', '')}
                    <ExternalLink size={12} />
                  </a>
                </div>
              ) : (
                <div className={`p-4 rounded-lg text-center ${isModern ? 'bg-gray-50 rounded-2xl' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className="text-xs text-gray-400 font-bold">Aucun dépôt lié</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {project.tags?.map((tag: any) => (
                  <span key={tag} className={`px-3 py-1 text-[10px] uppercase transition-all ${isModern ? 'rounded-lg bg-gray-100 text-gray-600 font-black' : 'rounded-md bg-white border border-gray-200 text-gray-600 font-bold'
                    }`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={() => setShowInviteModal(false)}>
          <div className={`bg-white shadow-2xl w-full p-8 relative transition-all ${isModern ? 'rounded-[2rem] max-w-md' : 'rounded-lg max-w-lg border border-gray-200'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-xl text-gray-900 mb-2 ${isModern ? 'font-black' : 'font-bold'}`}>Inviter un membre</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-6">Ajouter un collaborateur</p>

            {inviteSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in zoom-in duration-300">
                <CheckCircle size={20} />
                Invitation envoyée avec succès !
              </div>
            )}

            <UserSearch
              onSelect={async (user) => {
                try {
                  await api.post(`/api/notifications/invite`, {
                    recipientId: user._id,
                    projectId: params.id
                  });
                  setInviteSuccess(true);
                  setTimeout(() => {
                    setInviteSuccess(false);
                    setShowInviteModal(false);
                  }, 1500);
                } catch (err: any) {
                  showToast(err.response?.data?.message || "Erreur lors de l'envoi de l'invitation", "error");
                }
              }}
              excludeIds={project?.members?.map((m: any) => m._id) || []}
              buttonText="Inviter"
              role={user?.role === 'student' ? 'student' : undefined}
            />

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowInviteModal(false)}
                className={`px-6 py-2 text-xs font-black uppercase tracking-widest transition-colors ${isModern ? 'text-gray-500 hover:text-gray-900' : 'bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200'}`}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
