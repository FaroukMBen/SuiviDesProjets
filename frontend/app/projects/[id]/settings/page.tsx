'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/auth';
import { useAuthStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Card } from '@/components/ui/Card';
import {
    Settings,
    Save,
    Trash2,
    GitBranch,
    Calendar,
    Tag,
    FileText,
    Users,
    Globe,
    Lock,
    AlertTriangle
} from 'lucide-react';

interface Project {
    _id: string;
    title: string;
    description?: string;
    status: string;
    repositoryUrl?: string;
    deadline?: string;
    startDate?: string;
    tags: string[];
    visibility: string;
    owner: { _id: string; name: string; email?: string };
    members: { _id: string; name: string; email?: string; profilePicture?: string }[];
    campaignId?: { _id: string; title: string };
}

export default function ProjectSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'active',
        repositoryUrl: '',
        deadline: '',
        startDate: '',
        tags: '',
        visibility: 'private',
    });

    const projectId = params.id as string;

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await api.get(`/api/projects/${projectId}`);
                const p = res.data.project;
                setProject(p);
                setFormData({
                    title: p.title || '',
                    description: p.description || '',
                    status: p.status || 'active',
                    repositoryUrl: p.repositoryUrl || '',
                    deadline: p.deadline ? new Date(p.deadline).toISOString().split('T')[0] : '',
                    startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
                    tags: (p.tags || []).join(', '),
                    visibility: p.visibility || 'private',
                });
            } catch (err) {
                console.error('Erreur chargement projet', err);
                showToast('Impossible de charger le projet.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId]);

    const isOwner = project?.owner?._id === user?.id;
    const isAdmin = user?.role === 'admin';
    const canEdit = isOwner || isAdmin;

    const handleSave = async () => {
        if (!canEdit) return;
        try {
            setSaving(true);
            const payload: any = {
                title: formData.title,
                description: formData.description,
                status: formData.status,
                deadline: formData.deadline || undefined,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            };
            if (formData.repositoryUrl) payload.repositoryUrl = formData.repositoryUrl;

            await api.put(`/api/projects/${projectId}`, payload);
            showToast('Paramètres du projet enregistrés.', 'success');

            // Refresh
            const res = await api.get(`/api/projects/${projectId}`);
            setProject(res.data.project);
        } catch (err) {
            console.error('Erreur sauvegarde', err);
            showToast('Erreur lors de la sauvegarde.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProject = async () => {
        const ok = await confirm({
            title: 'Supprimer le projet',
            message: 'Cette action est irréversible. Toutes les données du projet (tâches, commits, fichiers) seront supprimées définitivement.',
            confirmText: 'Supprimer définitivement',
            cancelText: 'Annuler',
            type: 'danger',
        });
        if (!ok) return;
        try {
            await api.delete(`/api/projects/${projectId}`);
            showToast('Projet supprimé avec succès.', 'success');
            router.push('/projects');
        } catch (err) {
            console.error('Erreur suppression', err);
            showToast('Erreur lors de la suppression du projet.', 'error');
        }
    };

    const handleRemoveMember = async (memberId: string, memberName: string) => {
        const ok = await confirm({
            title: 'Retirer un membre',
            message: `Voulez-vous retirer ${memberName} du projet ?`,
            confirmText: 'Retirer',
            cancelText: 'Annuler',
            type: 'warning',
        });
        if (!ok) return;
        try {
            await api.delete(`/api/projects/${projectId}/members`, { data: { userId: memberId } });
            showToast(`${memberName} a été retiré du projet.`, 'success');
            const res = await api.get(`/api/projects/${projectId}`);
            setProject(res.data.project);
        } catch (err) {
            showToast('Erreur lors du retrait du membre.', 'error');
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse h-8 w-48 bg-gray-200 rounded-lg" />
                <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-500 text-lg">Projet introuvable.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl">

            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-100 text-gray-600 rounded-xl">
                    <Settings size={22} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Paramètres du projet</h2>
                    <p className="text-sm text-gray-500">Gérez les informations et les options de votre projet.</p>
                </div>
            </div>

            {!canEdit && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">
                        Seul le propriétaire du projet ou un administrateur peut modifier ces paramètres.
                    </p>
                </div>
            )}

            {/* Informations générales */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-gray-400" />
                    Informations générales
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nom du projet</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            disabled={!canEdit}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-400 transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            disabled={!canEdit}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-400 transition resize-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Statut</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                disabled={!canEdit}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-400 transition"
                            >
                                <option value="active">Actif</option>
                                <option value="completed">Terminé</option>
                                <option value="archived">Archivé</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Visibilité</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={!canEdit}
                                    onClick={() => setFormData({ ...formData, visibility: 'private' })}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition ${formData.visibility === 'private'
                                            ? 'border-gray-900 bg-gray-900 text-white'
                                            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                        } disabled:opacity-50`}
                                >
                                    <Lock size={14} />
                                    Privé
                                </button>
                                <button
                                    type="button"
                                    disabled={!canEdit}
                                    onClick={() => setFormData({ ...formData, visibility: 'public' })}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition ${formData.visibility === 'public'
                                            ? 'border-blue-600 bg-blue-600 text-white'
                                            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                        } disabled:opacity-50`}
                                >
                                    <Globe size={14} />
                                    Public
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Dates & Tags */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-gray-400" />
                    Dates & Étiquettes
                </h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Date de début</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                disabled={!canEdit}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-400 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Date limite</label>
                            <input
                                type="date"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                disabled={!canEdit}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-400 transition"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            <div className="flex items-center gap-2">
                                <Tag size={14} />
                                Étiquettes
                            </div>
                        </label>
                        <input
                            type="text"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            disabled={!canEdit}
                            placeholder="react, typescript, api (séparés par des virgules)"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-400 transition"
                        />
                        <p className="text-xs text-gray-400 mt-1">Séparez les étiquettes par des virgules.</p>
                    </div>
                </div>
            </Card>

            {/* Dépôt GitHub */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <GitBranch size={18} className="text-gray-400" />
                    Dépôt GitHub
                </h3>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">URL du dépôt</label>
                    <input
                        type="url"
                        value={formData.repositoryUrl}
                        onChange={(e) => setFormData({ ...formData, repositoryUrl: e.target.value })}
                        disabled={!canEdit}
                        placeholder="https://github.com/utilisateur/repo"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-400 transition"
                    />
                    {project.repositoryUrl && (
                        <p className="text-xs text-gray-500 mt-2">
                            Actuellement lié à : <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{project.repositoryUrl}</a>
                        </p>
                    )}
                </div>
            </Card>

            {/* Membres */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-gray-400" />
                    Membres ({project.members?.length || 0})
                </h3>
                <div className="space-y-2">
                    {/* Propriétaire */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                                {project.owner?.name?.[0] || 'P'}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{project.owner?.name}</p>
                                <p className="text-xs text-gray-500">{project.owner?.email}</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">Propriétaire</span>
                    </div>

                    {/* Membres */}
                    {project.members?.map((member) => (
                        <div key={member._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                {member.profilePicture ? (
                                    <img src={member.profilePicture} alt={member.name} className="w-9 h-9 rounded-full object-cover" />
                                ) : (
                                    <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
                                        {member.name?.[0] || 'M'}
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                                    <p className="text-xs text-gray-500">{member.email}</p>
                                </div>
                            </div>
                            {canEdit && member._id !== project.owner._id && (
                                <button
                                    onClick={() => handleRemoveMember(member._id, member.name)}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                                >
                                    Retirer
                                </button>
                            )}
                        </div>
                    ))}

                    {(!project.members || project.members.length === 0) && (
                        <p className="text-sm text-gray-400 text-center py-4">Aucun membre dans ce projet.</p>
                    )}
                </div>
            </Card>

            {/* Info campagne */}
            {project.campaignId && (
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Campagne</h3>
                    <p className="text-sm text-gray-600">
                        Ce projet est lié à la campagne <strong>{project.campaignId.title}</strong>.
                    </p>
                </Card>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
                {canEdit && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gray-900/10"
                    >
                        <Save size={16} />
                        {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                )}
                {canEdit && (
                    <button
                        onClick={handleDeleteProject}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-xl transition"
                    >
                        <Trash2 size={16} />
                        Supprimer le projet
                    </button>
                )}
            </div>
        </div>
    );
}
