'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/auth';
import {
    Save,
    Trash2,
    AlertTriangle,
    Info,
    UserPlus,
    X,
    User
} from 'lucide-react';
import { EvaluationGridEditor } from '@/components/campaigns/EvaluationGridEditor';

const GROUPS_OPTIONS = ['G1', 'G2', 'G3', 'G4'];

export default function CampaignSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        academicYear: '2024-2025',
        targetYear: 'BUT3',
        status: 'draft',
        targetGroups: [] as string[],
        evaluationTemplate: [] as any[],
        coManagers: [] as any[] // Liste des IDs
    });

    // Co-Managers UI State
    const [coManagersList, setCoManagersList] = useState<any[]>([]); // Liste des objets utilisateurs complets
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<any[]>([]);

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const res = await api.get(`/api/campaigns/${id}`);
                const c = res.data.campaign;
                setCampaign(c);
                setFormData({
                    title: c.title,
                    description: c.description || '',
                    startDate: c.startDate ? c.startDate.split('T')[0] : '',
                    endDate: c.endDate ? c.endDate.split('T')[0] : '',
                    academicYear: c.academicYear,
                    targetYear: c.targetYear,
                    status: c.status,
                    targetGroups: c.targetGroups || [],
                    evaluationTemplate: c.evaluationTemplate || [],
                    coManagers: c.coManagers ? c.coManagers.map((m: any) => m._id) : []
                });
                setCoManagersList(c.coManagers || []);
            } catch (err) {
                console.error("Erreur chargement campagne:", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchCampaign();
    }, [id]);

    // Recherche d'utilisateurs (instructeurs)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (userSearchQuery.length >= 2) {
                try {
                    const res = await api.get(`/api/users/search?q=${userSearchQuery}&role=instructor`);
                    // Filtrer pour ne pas montrer le manager principal ou ceux déjà ajoutés
                    const filtered = res.data.users.filter((u: any) =>
                        u._id !== campaign?.manager?._id &&
                        !formData.coManagers.includes(u._id)
                    );
                    setUserSearchResults(filtered);
                } catch (err) {
                    console.error("Erreur recherche:", err);
                }
            } else {
                setUserSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [userSearchQuery, campaign, formData.coManagers]);

    const addCoManager = (user: any) => {
        setFormData(prev => ({
            ...prev,
            coManagers: [...prev.coManagers, user._id]
        }));
        setCoManagersList(prev => [...prev, user]);
        setUserSearchQuery('');
        setUserSearchResults([]);
    };

    const removeCoManager = (userId: string) => {
        setFormData(prev => ({
            ...prev,
            coManagers: prev.coManagers.filter(id => id !== userId)
        }));
        setCoManagersList(prev => prev.filter(u => u._id !== userId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/api/campaigns/${id}`, formData);
            alert("Modifications enregistrées avec succès !");
            router.refresh();
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement cette campagne et toutes ses données associées (jalons, projets, etc.) ? Cette action est irréversible.")) return;

        try {
            await api.delete(`/api/campaigns/${id}`);
            router.push('/campaigns');
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la suppression.");
        }
    };

    const toggleGroup = (group: string) => {
        setFormData(prev => {
            const currentGroups = prev.targetGroups || [];
            if (currentGroups.includes(group)) {
                return { ...prev, targetGroups: currentGroups.filter(g => g !== group) };
            } else {
                return { ...prev, targetGroups: [...currentGroups, group] };
            }
        });
    };

    if (loading) return null;
    if (!campaign) return <div>Campagne introuvable</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">

            {/* En-tête de page */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Paramètres de la campagne</h2>
                <p className="text-gray-500">Configurez les informations générales, la période et la grille d'évaluation.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* 1. Informations Générales */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Informations Générales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la campagne</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optionnelle)</label>
                            <textarea
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Contexte, attendus généraux..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="draft">Brouillon (Draft)</option>
                                <option value="active">Active (En cours)</option>
                                <option value="closed">Fermée</option>
                                <option value="archived">Archivée</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 1b. Gestion de l'équipe pédagogique (Co-Managers) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center justify-between">
                        <span>Équipe Pédagogique</span>
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            Co-gestionnaires
                        </span>
                    </h3>

                    <div className="space-y-4">
                        {/* Liste des co-managers actuels */}
                        <div className="space-y-2">
                            {coManagersList.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">Aucun co-gestionnaire ajouté.</p>
                            ) : (
                                coManagersList.map((user) => (
                                    <div key={user._id} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeCoManager(user._id)}
                                            className="text-gray-400 hover:text-red-600 transition p-1"
                                            title="Retirer cet enseignant"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Champ Recherche pour ajouter */}
                        <div className="relative pt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ajouter un enseignant</label>
                            <div className="relative">
                                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Rechercher par nom..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    value={userSearchQuery}
                                    onChange={(e) => setUserSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Résultats de recherche */}
                            {userSearchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {userSearchResults.map((user) => (
                                        <button
                                            key={user._id}
                                            type="button"
                                            onClick={() => addCoManager(user)}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition border-b border-gray-100 last:border-0"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold uppercase">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                            <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">Ajouter</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Info size={12} />
                            Les co-gestionnaires ont les mêmes droits que vous sur cette campagne (modification, évaluation, etc.).
                        </p>
                    </div>
                </div>

                {/* 2. Période & Cible */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Période & Cible</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Année Universitaire</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white outline-none"
                                value={formData.academicYear}
                                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                            >
                                <option value="2024-2025">2024-2025</option>
                                <option value="2025-2026">2025-2026</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Promo Cible</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white outline-none"
                                value={formData.targetYear}
                                onChange={(e) => setFormData({ ...formData, targetYear: e.target.value })}
                            >
                                <option value="BUT1">BUT1</option>
                                <option value="BUT2">BUT2</option>
                                <option value="BUT3">BUT3</option>
                                <option value="LP">Licence Pro</option>
                                <option value="Master">Master</option>
                            </select>
                        </div>

                        {/* SÉLECTEUR DE GROUPES */}
                        <div className="col-span-2 mt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Groupes Ciblés</label>
                            <div className="flex flex-wrap gap-2">
                                {/* Bouton "Tous (Aucune sélection)" non cliquable mais indicatif si vide */}
                                {(!formData.targetGroups || formData.targetGroups.length === 0) && (
                                    <span className="px-3 py-1.5 rounded-lg text-sm bg-blue-100 text-blue-700 font-medium border border-blue-200 cursor-default">
                                        Tous les groupes
                                    </span>
                                )}

                                {GROUPS_OPTIONS.map(group => {
                                    const isSelected = formData.targetGroups?.includes(group);
                                    return (
                                        <button
                                            type="button"
                                            key={group}
                                            onClick={() => toggleGroup(group)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all
                                            ${isSelected
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {group}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <Info size={12} />
                                {formData.targetGroups && formData.targetGroups.length > 0
                                    ? "Seuls les étudiants de ces groupes verront la campagne."
                                    : "Si aucun groupe n'est sélectionné, toute la promo est ciblée."
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Grille d'évaluation */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 border-b pb-2 flex items-center justify-between">
                        <span>Grille d'évaluation</span>
                    </h3>

                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mb-6 flex gap-3 text-orange-800 text-sm">
                        <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                        <p>
                            Attention : Modifier cette grille alors que des projets ont déjà été notés peut fausser les moyennes et les résultats existants.
                            Assurez-vous qu'aucune évaluation n'est en cours avant de restructurer les critères.
                        </p>
                    </div>

                    <EvaluationGridEditor
                        criteria={formData.evaluationTemplate}
                        onChange={(newCriteria) => setFormData({ ...formData, evaluationTemplate: newCriteria })}
                    />
                </div>

                <div className="flex items-center justify-end gap-3 sticky bottom-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70"
                    >
                        <Save size={20} />
                        {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                </div>

            </form>

            {/* Danger Zone */}
            <div className="border-t pt-8 mt-12">
                <h3 className="font-bold text-red-600 mb-2">Zone de danger</h3>
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <h4 className="font-bold text-gray-900">Supprimer la campagne</h4>
                        <p className="text-sm text-gray-600">Cette action est irréversible et supprimera toutes les données associées.</p>
                    </div>
                    <button
                        onClick={handleDelete}
                        className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition"
                    >
                        <Trash2 size={18} /> Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
}
