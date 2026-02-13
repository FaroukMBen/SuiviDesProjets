'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/auth';
import { useProjectFiles } from '@/hooks/useProjectFiles';
import {
  FileText,
  Download,
  Trash2,
  Upload,
  Calendar,
  Loader2,
  X,
  Plus,
  Info,
  Flag,
  FileBox,
  ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';

interface FileItem {
  _id: string;
  name: string; // Titre du livrable
  description?: string;
  filename: string; // Nom physique du fichier
  path: string;
  mimetype: string;
  uploadedAt: string;
  milestoneId?: string;
}

interface Project {
  _id: string;
  title: string;
  files: FileItem[];
  owner: { _id: string };
  campaignId?: string;
}

interface Milestone {
  _id: string;
  title: string;
  description: string;
  date: string;
  type: string;
}

export default function LiverablesPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');

  const fetchProject = async () => {
    try {
      const response = await api.get(`/api/projects/${params.id}`);
      setProject(response.data.project);

      // Si le projet a une campagne, on récupère les jalons
      if (response.data.project.campaignId) {
        const mRes = await api.get(`/api/milestones/campaign/${response.data.project.campaignId}`);
        setMilestones(mRes.data.milestones || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { uploading, error: uploadError, uploadFile, deleteFile, downloadFile } = useProjectFiles(params.id as string, fetchProject);

  useEffect(() => {
    if (params.id) fetchProject();
  }, [params.id]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const success = await uploadFile(
      selectedFile,
      selectedMilestoneId || undefined,
      uploadTitle || selectedFile.name,
      uploadDescription
    );

    if (success) {
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadTitle('');
      setUploadDescription('');
      setSelectedMilestoneId('');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Chargement des livrables...</p>
      </div>
    );
  }

  if (!project) return <div className="p-8 text-center text-red-500 font-bold">Projet introuvable</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex items-end justify-between border-b-2 border-gray-100 pb-6">
        <div>
          <Link
            href={`/projects/${project._id}/milestones`}
            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 hover:text-blue-800 transition-colors mb-3 group"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
            Retour au Planning
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Livrables & Documents</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Gérez les rendus officiels et les documents bonus de votre projet.</p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          <span>Nouvel Envoi</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <FileBox size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Rendus</p>
            <p className="text-2xl font-bold text-gray-900">{project.files?.length || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Flag size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Jalons Complétés</p>
            <p className="text-2xl font-bold text-gray-900">
              {project.files?.filter(f => f.milestoneId).length || 0} / {milestones.length}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
            <Plus size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Documents Bonus</p>
            <p className="text-2xl font-bold text-gray-900">{project.files?.filter(f => !f.milestoneId).length || 0}</p>
          </div>
        </div>
      </div>

      {/* Files List */}
      {project.files && project.files.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Chronologie des dépôts</h3>
          <div className="grid grid-cols-1 gap-4">
            {project.files.slice().reverse().map((file) => {
              const matchedMilestone = milestones.find(m => m._id === file.milestoneId);

              return (
                <div key={file._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-blue-600 p-5 hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
                  {/* Icon & Title Area */}
                  <div className="flex-1 flex gap-4 min-w-0">
                    <div className="w-12 h-12 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl flex items-center justify-center shrink-0">
                      <FileText size={24} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="text-lg font-bold text-gray-900 truncate" title={file.name}>{file.name}</h4>
                        {matchedMilestone ? (
                          <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter">
                            Jalon: {matchedMilestone.title}
                          </span>
                        ) : (
                          <span className="text-[9px] font-black bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100 uppercase tracking-tighter">
                            Document Bonus
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-medium line-clamp-2 italic mb-2">
                        {file.description || "Aucune description fournie."}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(file.uploadedAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1 border-l pl-4 truncate max-w-[200px]">Fichier: {file.filename?.split('.')[0].substring(0, 15)}...</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={() => downloadFile(file.path, file.name)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all"
                    >
                      <Download size={16} />
                      Télécharger
                    </button>
                    <button
                      onClick={() => deleteFile(file._id)}
                      className="p-2.5 text-red-400 bg-red-50 border border-red-100 rounded-xl hover:text-red-600 hover:bg-red-100 transition-all"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-white text-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Upload size={36} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Pas encore de livrables</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto font-medium">
            Déposez vos fichiers pour les soumettre à évaluation ou pour les partager en interne.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-8 px-8 py-3 bg-white text-blue-600 border-2 border-blue-600/10 font-bold rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-blue-100"
          >
            Commencer un envoi
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl relative overflow-hidden animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900">Soumettre un document</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nouveau livrable de projet</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-white rounded-xl text-gray-400 hover:text-gray-900 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-8 space-y-6">
              {/* File Dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Fichier</label>
                {!selectedFile ? (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-blue-50/50 hover:border-blue-200 cursor-pointer transition-all group">
                    <Upload size={24} className="text-gray-400 group-hover:text-blue-600 mb-2" />
                    <span className="text-xs font-bold text-gray-500 group-hover:text-blue-700">Choisir un fichier</span>
                    <input type="file" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setSelectedFile(f);
                        if (!uploadTitle) setUploadTitle(f.name.split('.')[0]);
                      }
                    }} />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <FileText className="text-blue-600" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-blue-900 truncate">{selectedFile.name}</p>
                        <p className="text-[10px] font-bold text-blue-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedFile(null)} className="p-2 text-blue-400 hover:text-blue-700 transition-all">
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nom du livrable</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rapport Technique Final"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Jalon associé (optionnel)</label>
                    <span className="text-[9px] font-black italic text-gray-300">Laissez vide pour un document bonus</span>
                  </div>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium appearance-none"
                    value={selectedMilestoneId}
                    onChange={(e) => setSelectedMilestoneId(e.target.value)}
                  >
                    <option value="">Document Bonus / Supplémentaire</option>
                    {milestones.map(m => (
                      <option key={m._id} value={m._id}>{m.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief résumé du contenu du document..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium resize-none"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full h-14 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3"
              >
                {uploading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Finalisation...
                  </>
                ) : (
                  <>
                    <Upload size={24} />
                    Valider le dépôt
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
