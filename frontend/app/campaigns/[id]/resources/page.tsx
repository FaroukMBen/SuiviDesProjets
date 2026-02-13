'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import { useAuthStore } from '@/lib/store';
import { FileText, Download, Trash2, UploadCloud, ArrowLeft, Loader2, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/SimpleConfirmDialog';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

interface Resource {
    _id: string;
    name: string;
    type: string;
    size: number;
    path: string;
    uploadedAt: string;
}

export default function CampaignResourcesPage() {
    const params = useParams();
    const { user } = useAuthStore();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [campaign, setCampaign] = useState<any>(null);
    const [resources, setResources] = useState<Resource[]>([]);

    // Upload State
    const [uploading, setUploading] = useState(false);
    const resourceNameState = useState('');
    const resourceName = resourceNameState[0];
    const setResourceName = resourceNameState[1];

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Delete State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

    const fetchCampaign = async () => {
        try {
            const res = await api.get(`/api/campaigns/${params.id}`);
            setCampaign(res.data.campaign);
            setResources(res.data.campaign.resources || []);
        } catch (err: any) {
            console.error(err);
            showToast('Erreur lors du chargement de la campagne', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaign();
    }, [params.id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            // Auto-fill name if empty
            if (!resourceName) {
                setResourceName(file.name.split('.').slice(0, -1).join('.'));
            }
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', resourceName || selectedFile.name);

        try {
            await api.post(`/api/campaigns/${params.id}/resources`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showToast('Ressource ajoutée avec succès', 'success');
            setSelectedFile(null);
            setResourceName('');
            fetchCampaign(); // Refresh list
        } catch (err: any) {
            showToast(err.response?.data?.message || "Erreur lors de l'upload", 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (resource: Resource) => {
        try {
            // Assuming resource.path is like "api/..." or similar, the backend endpoint is actually /api/campaigns/resources/:filename
            // We extract filename from path
            const filename = resource.path.split('/').pop();

            const response = await api.get(`/api/campaigns/resources/${filename}`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            // Simple extension guess if missing
            const ext = resource.type.includes('pdf') ? '.pdf' : '';
            link.setAttribute('download', resource.name + ext);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download error:', error);
            showToast('Erreur lors du téléchargement', 'error');
        }
    };

    const handleDelete = async () => {
        if (!resourceToDelete) return;

        try {
            await api.delete(`/api/campaigns/${params.id}/resources/${resourceToDelete}`);
            showToast('Ressource supprimée', 'success');
            setResources(prev => prev.filter(r => r._id !== resourceToDelete));
            setDeleteConfirmOpen(false);
            setResourceToDelete(null);
        } catch (err: any) {
            showToast('Erreur lors de la suppression', 'error');
            setDeleteConfirmOpen(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-[#f3f4f6]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

    const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

    return (
        <ProtectedRoute allowedRoles={['instructor', 'admin', 'student']}>
            <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
                <Navbar />

                <div className="flex-1 ml-64 p-8">
                    <header className="mb-8">
                        <Link
                            href={isInstructor ? "/campaigns" : "/dashboard"}
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 mb-6 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Retour au tableau de bord
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2 truncate">{campaign?.title}</h1>
                                <div className="flex items-center gap-2 text-blue-600 font-medium">
                                    <LinkIcon size={20} />
                                    <h2>Ressources Pédagogiques</h2>
                                </div>
                                <p className="text-gray-500 mt-2 text-sm max-w-2xl leading-relaxed">
                                    Consultez et téléchargez les documents de référence, sujets de projet, et consignes mis à disposition pour cette campagne.
                                </p>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* FILE LIST SECTION */}
                        <div className={`space-y-6 ${isInstructor ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                            <Card className="overflow-hidden">
                                <div className="p-6 border-b border-gray-100 bg-white">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <FileText size={20} className="text-gray-400" />
                                        Documents disponibles
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold ml-2">
                                            {resources.length}
                                        </span>
                                    </h3>
                                </div>

                                {resources.length === 0 ? (
                                    <div className="p-12 bg-gray-50/50">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                            <FileText size={32} />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune ressource</h3>
                                        <p className="text-sm text-gray-500 max-w-sm">
                                            L'équipe pédagogique n'a pas encore ajouté de documents pour cette campagne. Reviens plus tard !
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {resources.map((resource) => (
                                            <li key={resource._id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between group">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={`p-3 rounded-xl flex-shrink-0 ${resource.type?.includes('pdf') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        <FileText size={24} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-gray-900 truncate pr-4">{resource.name}</h4>
                                                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                            <span>Ajouté le {new Date(resource.uploadedAt).toLocaleDateString()}</span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                            <span>{(resource.size / 1024).toFixed(1)} KB</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleDownload(resource)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Télécharger"
                                                    >
                                                        <Download size={20} />
                                                    </button>

                                                    {isInstructor && (
                                                        <button
                                                            onClick={() => {
                                                                setResourceToDelete(resource._id);
                                                                setDeleteConfirmOpen(true);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Card>
                        </div>

                        {/* UPLOAD FORM SECTION (INSTRUCTOR ONLY) */}
                        {isInstructor && (
                            <div className="lg:col-span-1">
                                <div className="sticky top-8 space-y-6">
                                    <Card className="p-6 border-blue-100 shadow-blue-50">
                                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                <UploadCloud size={20} />
                                            </div>
                                            Ajouter une ressource
                                        </h3>

                                        <form onSubmit={handleUpload} className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Titre du document</label>
                                                <input
                                                    type="text"
                                                    value={resourceName}
                                                    onChange={(e) => setResourceName(e.target.value)}
                                                    placeholder="Ex: Sujet du projet..."
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Fichier à importer</label>
                                                <div className="relative group">
                                                    <input
                                                        type="file"
                                                        onChange={handleFileChange}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    />
                                                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${selectedFile
                                                        ? 'border-blue-400 bg-blue-50/50'
                                                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                                                        }`}>
                                                        {selectedFile ? (
                                                            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-200">
                                                                <FileText size={32} className="text-blue-600 mb-2" />
                                                                <span className="text-sm font-medium text-gray-900 truncate max-w-[200px] mb-1">
                                                                    {selectedFile.name}
                                                                </span>
                                                                <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full">
                                                                    Prêt à envoyer
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center">
                                                                <UploadCloud className="text-gray-400 mb-3 group-hover:text-blue-500 transition-colors" size={32} />
                                                                <span className="text-sm font-medium text-blue-600 mb-1">
                                                                    Cliquez pour parcourir
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    PDF, DOC, ZIP (Max 10MB)
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={!selectedFile || uploading}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                                            >
                                                {uploading ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={18} />
                                                        Envoi...
                                                    </>
                                                ) : (
                                                    <>
                                                        <UploadCloud size={18} />
                                                        Publier la ressource
                                                    </>
                                                )}
                                            </button>
                                        </form>

                                        <div className="mt-6 bg-blue-50/80 p-4 rounded-xl flex gap-3 border border-blue-100">
                                            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                                            <div className="text-xs text-blue-800 leading-relaxed">
                                                <p className="font-semibold mb-1">Visibilité</p>
                                                Les fichiers ajoutés sont instantanément accessibles à tous les étudiants inscrits à cette campagne via leur espace projet.
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>

                    <ConfirmDialog
                        isOpen={deleteConfirmOpen}
                        onClose={() => setDeleteConfirmOpen(false)}
                        onConfirm={handleDelete}
                        title="Supprimer la ressource ?"
                        message="Cette action est irréversible. Le document ne sera plus accessible aux étudiants."
                        confirmLabel="Supprimer définitivement"
                        confirmVariant="danger"
                    />
                </div>
            </div>
        </ProtectedRoute>
    );
}
