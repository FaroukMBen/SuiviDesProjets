'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/auth';
import {
    Users,
    Search,
    Mail,
    Bell,
    CheckCircle,
    AlertCircle,
    MoreVertical,
    ExternalLink,
    Copy
} from 'lucide-react';
import Link from 'next/link';

interface User {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    academicYear: string;
    group: string;
}

interface Project {
    _id: string;
    title: string;
    members: User[];
}

interface Campaign {
    _id: string;
    title: string;
    targetYear: string;
    targetGroups: string[];
    participants: string[];
    status: string;
}

export default function CampaignMembersPage() {
    const params = useParams();
    const campaignId = params.id as string;

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [students, setStudents] = useState<User[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'pending'>('all');
    const [selectedGroup, setSelectedGroup] = useState<string>('all');
    const [sendingReminders, setSendingReminders] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const campRes = await api.get(`/api/campaigns/${campaignId}`);
                const campData = campRes.data.campaign;
                setCampaign(campData);

                if (campData.targetYear) {
                    const studentsRes = await api.get(`/api/users/students?year=${campData.targetYear}`);
                    setStudents(studentsRes.data.students);
                }

                const projectsRes = await api.get(`/api/projects?campaign=${campaignId}&includeMembers=true`);
                setProjects(projectsRes.data.projects || []);

            } catch (err) {
                console.error("Erreur loading members:", err);
            } finally {
                setLoading(false);
            }
        };

        if (campaignId) fetchAllData();
    }, [campaignId]);

    const getStudentStatus = (studentId: string): { status: 'registered' | 'pending', project?: Project } => {
        const project = projects.find(p => p.members.some((m: any) => (m._id || m) === studentId));

        if (project) {
            return { status: 'registered', project };
        }
        return { status: 'pending' };
    };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase());


        const { status } = getStudentStatus(student._id);
        const matchesStatus = statusFilter === 'all' ? true : status === statusFilter;
        const matchesGroup = selectedGroup === 'all' ? true : student.group === selectedGroup;

        return matchesSearch && matchesStatus && matchesGroup;
    });

    const registeredCount = filteredStudents.filter(s => getStudentStatus(s._id).status === 'registered').length;
    const pendingCount = filteredStudents.length - registeredCount;

    // Récupérer les groupes uniques disponibles
    const availableGroups = Array.from(new Set(students.map(s => s.group))).filter(Boolean).sort();

    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        alert('Email copié : ' + email);
    };

    const handleSendInvite = async (student: User) => {
        if (!campaign) return;
        if (campaign.status === 'draft') {
            alert("La campagne est en brouillon. Veuillez l'activer dans les paramètres avant d'envoyer des invitations.");
            return;
        }
        if (!confirm(`Envoyer une notification à ${student.name} ?`)) return;

        try {
            const message = `Bonjour ${student.name}, tu as été invité(e) à la campagne "${campaign.title}". Tu as désormais accès pour créer ton projet.`;

            await api.post('/api/notifications/campaign-notify', {
                recipientId: student._id,
                campaignId: campaign._id,
                message
            });

            alert("Notification envoyée");

            setCampaign(prev => prev ? {
                ...prev,
                participants: [...(prev.participants || []), student._id]
            } : null);

        } catch (err: any) {
            console.error("Erreur envoi notif:", err);
            alert(err.response?.data?.message || "Erreur lors de l'envoi de la notification.");
        }
    };

    const handleRemindAll = async () => {
        if (!campaign) return;
        if (campaign.status === 'draft') {
            alert("La campagne est en brouillon. Veuillez l'activer dans les paramètres avant d'envoyer des invitations.");
            return;
        }
        const pendingStudents = filteredStudents.filter(s => getStudentStatus(s._id).status === 'pending');

        if (pendingStudents.length === 0) {
            alert("Aucun étudiant en attente à relancer pour cette sélection.");
            return;
        }

        if (!confirm(`Voulez-vous envoyer une notification de rappel à ${pendingStudents.length} étudiant(s) en attente ?`)) return;

        setSendingReminders(true);
        let successCount = 0;

        try {
            // On envoie les notifs une par une (ou mieux, via une route batch si elle existait)
            // Pour l'instant on boucle
            for (const student of pendingStudents) {
                try {
                    const message = `Rappel : Tu n'es pas encore inscrit dans un projet pour la campagne "${campaign.title}". Merci de faire le nécessaire.`;
                    await api.post('/api/notifications/campaign-notify', {
                        recipientId: student._id,
                        campaignId: campaign._id,
                        message
                    });
                    successCount++;
                } catch (e) {
                    console.error(`Erreur envoi à ${student.email}`, e);
                }
            }
            alert(`${successCount} rappel(s) envoyé(s) avec succès.`);
        } catch (err) {
            console.error(err);
            alert("Erreur générale lors de l'envoi des rappels.");
        } finally {
            setSendingReminders(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Chargement des participants...</div>;

    return (
        <div>
            {/* Header de la section */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="text-blue-600" size={24} />
                        Suivi des inscriptions
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">
                        {students.length} étudiants éligibles en {campaign?.targetYear}
                        {campaign?.targetGroups && campaign.targetGroups.length > 0 && ` (Groupes: ${campaign.targetGroups.join(', ')})`}
                    </p>
                </div>

                <div className="flex gap-2">
                    <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${statusFilter === 'all' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Tous
                        </button>
                        <button
                            onClick={() => setStatusFilter('registered')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${statusFilter === 'registered' ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            Inscrits
                        </button>
                        <button
                            onClick={() => setStatusFilter('pending')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${statusFilter === 'pending' ? 'bg-amber-50 text-amber-700' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            En attente
                        </button>
                    </div>
                </div>
            </div>

            {/* Barre de recherche et actions groupées */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou email..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filtre Groupe */}
                <div className="w-full md:w-40">
                    <select
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                    >
                        <option value="all">Tous les groupes</option>
                        {availableGroups.map(g => (
                            <option key={g} value={g}>Groupe {g}</option>
                        ))}
                    </select>
                </div>

                {/* Boutons d'action : Relancer tous les manquants */}
                {/* Boutons d'action : Relancer tous les manquants */}
                <button
                    onClick={handleRemindAll}
                    disabled={sendingReminders || pendingCount === 0 || campaign?.status === 'draft'}
                    className={`hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 font-medium rounded-xl transition ${campaign?.status === 'draft' || pendingCount === 0 ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    title={campaign?.status === 'draft' ? "Campagne en brouillon" : "Envoyer un rappel"}
                >
                    <Mail size={18} />
                    <span>
                        {sendingReminders ? 'Envoi...' : `Relancer tous (${pendingCount})`}
                    </span>
                </button>
            </div>

            {campaign?.status === 'draft' && (
                <div className="mb-6 bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm">
                        <span className="font-bold">Campagne en mode brouillon.</span> Les invitations et rappels sont désactivés.
                        Activez la campagne dans les paramètres pour pouvoir communiquer avec les étudiants.
                    </p>
                    <Link href={`/campaigns/${campaignId}/settings`} className="ml-auto text-sm font-semibold underline hover:text-orange-900 whitespace-nowrap">
                        Allez aux paramètres
                    </Link>
                </div>
            )}

            {/* Tableau des étudiants */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500 uppercase font-semibold">
                            <th className="px-6 py-4">Étudiant</th>
                            <th className="px-6 py-4">Groupe</th>
                            <th className="px-6 py-4">Statut</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map(student => {
                                const { status, project } = getStudentStatus(student._id);

                                return (
                                    <tr key={student._id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {student.profilePicture ? (
                                                    <img src={student.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-xs">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-900">{student.name}</p>
                                                    <p className="text-xs text-gray-500">{student.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                {student.group || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {status === 'registered' && project ? (
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                                                        <CheckCircle size={12} />
                                                        Projet créé
                                                    </span>
                                                    <Link href={`/projects/${project._id}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                        {project.title} <ExternalLink size={10} />
                                                    </Link>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                        <AlertCircle size={12} />
                                                        Sans projet
                                                    </span>
                                                    {campaign?.participants?.includes(student._id) && (
                                                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                            <CheckCircle size={10} /> Invité / Accès OK
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {status === 'pending' && !campaign?.participants?.includes(student._id) && (
                                                    <button
                                                        onClick={() => handleSendInvite(student)}
                                                        disabled={campaign?.status === 'draft'}
                                                        className={`p-2 rounded-lg transition ${campaign?.status === 'draft'
                                                                ? 'text-gray-300 cursor-not-allowed'
                                                                : 'text-blue-600 hover:bg-blue-50'
                                                            }`}
                                                        title={campaign?.status === 'draft' ? "Campagne en brouillon - Invitation désactivée" : "Inviter à rejoindre"}
                                                    >
                                                        <Bell size={18} />
                                                    </button>
                                                )}
                                                {campaign?.participants?.includes(student._id) && status === 'pending' && (
                                                    <button
                                                        className="p-2 text-green-600 cursor-default"
                                                        title="Invitation déjà envoyée"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleCopyEmail(student.email)}
                                                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                                                    title="Copier l'email"
                                                >
                                                    <Copy size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                                    Aucun étudiant trouvé pour cette sélection.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
