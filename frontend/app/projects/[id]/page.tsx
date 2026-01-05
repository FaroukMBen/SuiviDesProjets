'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card'; // Ta carte existante
import { FileText, Download, Trash2, Calendar, Users, BarChart3, UploadCloud } from 'lucide-react';
import api from '@/lib/auth';
import { UserSearch } from '@/components/UserSearch';

export default function ProjectOverviewPage() {
  const params = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [params.id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await api.get(`/api/projects/${params.id}`);
      setProject(response.data.project);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      setUploading(true);
      await api.post(`/api/projects/${params.id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchProjectDetails(); // Rafraîchir
    } catch (err) {
      alert('Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Supprimer ce fichier ?')) return;
    try {
      await api.delete(`/api/projects/${params.id}/files/${fileId}`);
      fetchProjectDetails();
    } catch (err) {
      alert('Erreur suppression');
    }
  };

  if (loading || !project) return <div className="animate-pulse h-64 bg-gray-200 rounded-xl"></div>;

  return (
    <div className="space-y-6">
      {/* 1. Cartes d'infos (Statut, Deadline...) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Statut</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
              project.status === 'completed' ? 'bg-green-100 text-green-800' : 
              project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {project.status === 'in_progress' ? 'En cours' : project.status}
            </span>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <BarChart3 size={20} />
          </div>
        </Card>

        <Card className="p-6 flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Date limite</p>
            <p className="text-lg font-bold text-gray-900">
              {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Non définie'}
            </p>
          </div>
          <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
            <Calendar size={20} />
          </div>
        </Card>

        <Card className="p-6 flex items-start justify-between">
          <div>
             <p className="text-sm text-gray-500 font-medium mb-1">Livrables</p>
             <p className="text-lg font-bold text-gray-900">{project.files?.length || 0}</p>
          </div>
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <FileText size={20} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Membres de l'équipe</h3>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition"
                >
                  + Inviter
                </button>
              </div>
              <div className="space-y-2">
                {project.members?.map((member: any) => (
                  <div key={member._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Info</h3>
              <div className="space-y-3">
                {project.repositoryUrl && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Repository</p>
                    <a
                      href={project.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all text-sm"
                    >
                      {project.repositoryUrl}
                    </a>
                  </div>
                )}
                {project.tags?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
      </div>

        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Inviter un membre</h3>

              {inviteSuccess && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Invitation envoyée avec succès !
                </div>
              )}

              <p className="text-gray-500 text-sm mb-4">
                Recherchez un étudiant par son nom ou email pour l'ajouter au projet.
              </p>

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
                    alert(err.response?.data?.message || "Erreur lors de l'envoi de l'invitation");
                  }
                }}
                excludeIds={project?.members?.map((m: any) => m._id) || []}
                buttonText="Inviter"
              />

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}


      {/* 2. Section Documents / Livrables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des fichiers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Documents récents</h3>
            <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm ${uploading ? 'opacity-50' : ''}`}>
              <UploadCloud size={16} />
              {uploading ? 'Envoi...' : 'Ajouter un fichier'}
              <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>

          {project.files?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">Aucun document partagé pour le moment.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {project.files?.map((file: any) => (
                  <li key={file._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">Ajouté le {new Date(file.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a 
                        href={`http://localhost:5000/${file.path}`} 
                        target="_blank" 
                        className="p-2 text-gray-400 hover:text-blue-600 transition rounded-md hover:bg-blue-50"
                      >
                        <Download size={18} />
                      </a>
                      <button 
                        onClick={() => handleDeleteFile(file._id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition rounded-md hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Info latérale */}
        <div className="space-y-6">
           <Card className="p-6">
             <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Détails techniques</h3>
             
             <div className="space-y-4">
                <div>
                   <p className="text-xs text-gray-500 mb-1">Dépôt Git</p>
                   {project.repositoryUrl ? (
                     <a href={project.repositoryUrl} target="_blank" className="text-sm text-blue-600 hover:underline break-all block">
                       {project.repositoryUrl}
                     </a>
                   ) : <span className="text-sm text-gray-400">Non renseigné</span>}
                </div>

                <div>
                   <p className="text-xs text-gray-500 mb-2">Tags</p>
                   <div className="flex flex-wrap gap-2">
                     {project.tags?.map((tag: string) => (
                       <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium border border-gray-200">
                         {tag}
                       </span>
                     ))}
                   </div>
                </div>
             </div>
           </Card>
        </div>
      </div>
    </div>
  );
}