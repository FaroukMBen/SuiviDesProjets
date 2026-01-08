'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/auth';
import { useProjectFiles } from '@/hooks/useProjectFiles';
import { FileText, Download, Trash2, Upload, Calendar, Loader2 } from 'lucide-react';


interface FileItem {
  _id: string;
  name: string;
  path: string;
  mimetype: string;
  uploadedAt: string;
}

interface Project {
  _id: string;
  files: FileItem[];
  owner: { _id: string };
}

export default function liverablesPage() {
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchProject = async () => {
    try {
      const response = await api.get(`/api/projects/${params.id}`);
      setProject(response.data.project);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { uploading, error: uploadError, uploadFile, deleteFile, downloadFile } = useProjectFiles(params.id as string, fetchProject);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await uploadFile(e.target.files[0]);
  };

  useEffect(() => {
    if (params.id) fetchProject();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!project) return <div>Projet introuvable</div>;

  return (
    <div className="max-w-5xl mx-auto">
      {/* En-tête de section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Livrables du projet</h2>
          <p className="text-gray-500 mt-1">Gérez les fichiers et documents rendus.</p>
        </div>

        <div>
           <label 
             htmlFor="file-upload" 
             className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             {uploading ? (
               <Loader2 size={20} className="animate-spin" />
             ) : (
               <Upload size={20} />
             )}
             <span>{uploading ? 'Upload en cours...' : 'Ajouter un fichier'}</span>
           </label>
           <input 
             id="file-upload" 
             type="file" 
             className="hidden" 
             onChange={handleFileChange}
             disabled={uploading}
           />
        </div>
      </div>

      {uploadError && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {uploadError}
        </div>
      )}

      {/* Liste des fichiers */}
      {project.files && project.files.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="min-w-full divide-y divide-gray-200">
             {/* Header Table */}
             <div className="bg-gray-50 px-6 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
               <div className="col-span-6">Nom du fichier</div>
               <div className="col-span-3">Date d'ajout</div>
               <div className="col-span-3 text-right">Actions</div>
             </div>

             {/* Body */}
             <div className="divide-y divide-gray-100 h-[600px] overflow-y-auto">
               {project.files.slice().reverse().map((file) => (
                 <div key={file._id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
                   
                   {/* Nom + Icone */}
                   <div className="col-span-6 flex items-center gap-3">
                     <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                       <FileText size={20} />
                     </div>
                     <div className="min-w-0">
                       <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                         {file.name}
                       </p>
                       <p className="text-xs text-gray-500 truncate">{file.mimetype}</p>
                     </div>
                   </div>

                   {/* Date */}
                   <div className="col-span-3 flex items-center gap-2 text-sm text-gray-500">
                     <Calendar size={14} className="text-gray-400" />
                     {new Date(file.uploadedAt).toLocaleString('fr-FR', { 
                       day: 'numeric', 
                       month: 'short', 
                       year: 'numeric', 
                       hour: '2-digit', 
                       minute: '2-digit' 
                     })}
                   </div>

                   {/* Actions */}
                   <div className="col-span-3 flex items-center justify-end gap-2">
                     <button 
                       onClick={() => downloadFile(file.path, file.name)}
                       className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                       title="Télécharger"
                     >
                       <Download size={18} />
                     </button>
                     <button 
                       onClick={() => deleteFile(file._id)}
                       className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                       title="Supprimer"
                     >
                       <Trash2 size={18} />
                     </button>
                   </div>

                 </div>
               ))}
             </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Aucun livrable</h3>
          <p className="text-gray-500 mt-1 max-w-sm mx-auto">
            Déposez des fichiers ici pour les partager avec votre équipe et vos enseignants.
          </p>
        </div>
      )}
    </div>
  );
}
