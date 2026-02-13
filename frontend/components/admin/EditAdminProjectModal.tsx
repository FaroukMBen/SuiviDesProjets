'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth';
import { X, Save, Folder, Link as LinkIcon, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    project: any;
}

export function EditAdminProjectModal({ isOpen, onClose, onSuccess, project }: Props) {
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        repositoryUrl: '',
        deadline: '',
        status: 'active'
    });

    useEffect(() => {
        if (project) {
            setFormData({
                title: project.title || '',
                description: project.description || '',
                repositoryUrl: project.repositoryUrl || '',
                deadline: project.deadline ? project.deadline.split('T')[0] : '',
                status: project.status || 'active'
            });
        }
    }, [project]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.put(`/api/projects/${project._id}`, formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            showToast(err.response?.data?.message || "Erreur lors de la mise à jour", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Folder size={24} className="text-blue-600" />
                        Modifier le projet
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titre du projet</label>
                        <input
                            required type="text"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                            <select
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="active">En cours</option>
                                <option value="submitted">Soumis</option>
                                <option value="validated">Validé</option>
                                <option value="completed">Terminé</option>
                                <option value="archived">Archivé</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date limite (Deadline)</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-3 top-2.5 text-gray-400" />
                                <input
                                    type="date"
                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dépôt Git</label>
                        <div className="relative">
                            <LinkIcon size={18} className="absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="url"
                                placeholder="https://github.com/..."
                                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.repositoryUrl}
                                onChange={e => setFormData({ ...formData, repositoryUrl: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition">
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Enregistrement...' : <><Save size={18} /> Enregistrer</>}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
