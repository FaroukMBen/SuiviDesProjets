'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import {
    Bell,
    Check,
    X,
    Info,
    UserPlus,
    Calendar,
    CheckCircle2,
    MessageSquare
} from 'lucide-react';
import { useAuthStore, useThemeStore } from '@/lib/store';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
    _id: string;
    type: 'INVITATION' | 'INFO' | 'MESSAGE';
    message: string;
    status: 'unread' | 'read';
    project?: {
        _id: string;
        title: string;
    };
    conversation?: {
        _id: string;
        name?: string;
        isGroup: boolean;
    };
    sender?: {
        name?: string;
        firstName?: string;
        lastName?: string;
        profilePicture?: string;
    };
    createdAt: string;
    actionStatus?: 'pending' | 'accepted' | 'declined';
}

export default function NotificationsPage() {
    const { user } = useAuthStore();
    const { theme } = useThemeStore();
    const isModern = theme === 'modern';

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const { showToast } = useToast();

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/api/notifications');
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string, redirectUrl?: string) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, status: 'read' } : n)
            );
            // Redirection is handled by Link usually
        } catch (error) {
            console.error(error);
        }
    };

    const handleInvitation = async (id: string, action: 'accept' | 'decline') => {
        try {
            await api.post(`/api/notifications/${id}/respond`, { action });
            setNotifications(prev =>
                prev.map(n => n._id === id ? {
                    ...n,
                    actionStatus: action === 'accept' ? 'accepted' : 'declined',
                    status: 'read'
                } : n)
            );
            showToast(action === 'accept' ? "Invitation acceptée" : "Invitation refusée", "success");
        } catch (error) {
            showToast("Une erreur est survenue lors de la réponse à l'invitation.", "error");
        }
    };

    const unreadCount = notifications.filter(n => n.status === 'unread').length;

    return (
        <ProtectedRoute>
            <div className={`min-h-screen ${isModern ? 'bg-[#f8fafc]' : 'bg-white'} flex font-sans overflow-hidden relative`}>
                {/* Animated Background Elements */}
                {isModern && (
                    <>
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
                    </>
                )}

                <Navbar />

                <div className="flex-1 ml-64 p-12 relative overflow-y-auto h-screen">

                    {/* --- HEADER --- */}
                    <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h1 className={`${isModern ? 'text-4xl font-black' : 'text-3xl font-bold'} text-gray-900 tracking-tight leading-none mb-3`}>
                                Centre de <span className="text-blue-600">Notifications</span>
                            </h1>
                            <p className="text-gray-500 text-lg">Suivez vos invitations et restez informé en temps réel.</p>
                        </div>
                        <div className={`${isModern ? 'px-5 py-2 rounded-2xl text-xs font-black shadow-lg shadow-blue-500/20' : 'px-4 py-1.5 rounded-lg text-[10px] font-bold shadow-sm'} flex items-center gap-2 transition-all duration-300 border ${unreadCount > 0
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-400 border-gray-100'
                            }`}>
                            <Bell size={isModern ? 16 : 14} className={unreadCount > 0 ? 'animate-bounce' : ''} />
                            {unreadCount > 0 ? `${unreadCount} nouveaux` : 'Tout est vu'}
                        </div>
                    </div>

                    {/* --- LISTE DES NOTIFICATIONS --- */}
                    {isModern ? (
                        <div className="max-w-4xl mx-auto">
                            {loading ? (
                                <div className="space-y-6">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="bg-white/50 backdrop-blur-sm p-10 rounded-3xl border border-white shadow-sm animate-pulse h-40"></div>
                                    ))}
                                </div>
                            ) : notifications.length > 0 ? (
                                <div className="space-y-4">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            className={`group relative bg-white/80 backdrop-blur-md rounded-[2rem] p-5 md:p-6 border transition-all duration-500 transform hover:scale-[1.01] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.06)]
                                        ${notification.status === 'unread'
                                                    ? 'border-blue-100 shadow-lg shadow-blue-500/5'
                                                    : 'border-white/50 shadow-sm opacity-90'
                                                }
                                    `}
                                        >
                                            <div className="flex flex-col md:flex-row gap-5">
                                                <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 group-hover:rotate-12 group-hover:scale-110
                                            ${notification.type === 'INVITATION'
                                                        ? 'bg-gradient-to-br from-purple-50 to-indigo-50 text-purple-600'
                                                        : notification.type === 'MESSAGE'
                                                            ? 'bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600'
                                                            : 'bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-600'
                                                    }
                                        `}>
                                                    {notification.type === 'INVITATION' ? <UserPlus size={24} strokeWidth={2.5} /> :
                                                        notification.type === 'MESSAGE' ? <MessageSquare size={24} strokeWidth={2.5} /> :
                                                            <Info size={24} strokeWidth={2.5} />}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-col">
                                                            <h4 className="text-gray-900 font-black text-lg tracking-tight leading-tight">
                                                                {notification.type === 'INVITATION' ? 'Invitation Projet' :
                                                                    notification.type === 'MESSAGE' ? 'Nouveau Message' : 'Nouvelle Information'}
                                                            </h4>
                                                            <span className="text-xs font-black uppercase tracking-widest text-gray-400 mt-2 flex items-center gap-2">
                                                                <Calendar size={14} className="text-blue-500" />
                                                                {format(new Date(notification.createdAt), "EEEE d MMMM 'à' HH:mm", { locale: fr })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="text-gray-600 text-sm leading-relaxed mt-4 bg-gray-50/30 p-4 rounded-2xl border border-gray-100/50 backdrop-blur-sm">
                                                        {notification.message}
                                                    </div>

                                                    <div className="mt-6 flex flex-wrap gap-3 items-center">
                                                        {notification.type === 'INVITATION' && (!notification.actionStatus || notification.actionStatus === 'pending') && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleInvitation(notification._id, 'accept')}
                                                                    className="group/btn flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-black hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 transform hover:-translate-y-1 active:translate-y-0"
                                                                >
                                                                    <CheckCircle2 size={18} /> Accepter
                                                                </button>
                                                                <button
                                                                    onClick={() => handleInvitation(notification._id, 'decline')}
                                                                    className="px-6 py-2.5 bg-white border border-gray-100 text-gray-400 rounded-xl text-sm font-bold hover:bg-gray-50 hover:text-red-500 transition-all"
                                                                >
                                                                    Plus tard
                                                                </button>
                                                            </>
                                                        )}

                                                        {notification.actionStatus === 'accepted' && (
                                                            <div className="flex items-center gap-4 px-8 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[15px] font-black border border-emerald-100 shadow-sm animate-in slide-in-from-left duration-300">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                Vous avez rejoint le projet
                                                            </div>
                                                        )}
                                                        {notification.actionStatus === 'declined' && (
                                                            <div className="flex items-center gap-4 px-8 py-3 bg-red-50 text-red-600 rounded-2xl text-[15px] font-black border border-red-100 shadow-sm">
                                                                Invitation déclinée
                                                            </div>
                                                        )}

                                                        {notification.type === 'MESSAGE' && (
                                                            <Link
                                                                href="/messagerie"
                                                                onClick={() => markAsRead(notification._id)}
                                                                className="group/btn flex items-center gap-2 px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-black hover:bg-indigo-100 transition-all border border-indigo-100"
                                                            >
                                                                <MessageSquare size={18} /> Répondre
                                                            </Link>
                                                        )}

                                                        {(notification.type === 'INFO' || (notification.type === 'MESSAGE' && false)) && notification.status === 'unread' && (
                                                            <button
                                                                onClick={() => markAsRead(notification._id)}
                                                                className="text-xs font-black text-blue-600 bg-blue-50/50 px-8 py-3 rounded-2xl hover:bg-blue-100/50 transition-all tracking-wider border border-blue-100"
                                                            >
                                                                MARQUER COMME VU
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {notification.status === 'unread' && (
                                                <div className="absolute top-6 right-6 w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/30">
                                                    <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-24 bg-white/50 backdrop-blur-md rounded-[3rem] border border-white shadow-xl flex flex-col items-center">
                                    <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mb-8 shadow-inner">
                                        <Bell className="text-gray-300" size={56} strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">C'est très calme ici...</h3>
                                    <p className="text-gray-500 text-lg max-w-sm mx-auto mt-4 px-6">
                                        Vous n'avez aucune nouvelle notification. <br />Revenez plus tard pour voir les mises à jour !
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* --- CLASSIC NOTIFICATIONS VIEW --- */
                        <div className="max-w-4xl mx-auto space-y-4">
                            {loading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white border border-gray-200 rounded-xl animate-pulse"></div>)}
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <div key={notification._id} className={`p-6 bg-white border rounded-xl shadow-sm flex justify-between items-center transition-all ${notification.status === 'unread' ? 'border-l-4 border-l-blue-600 border-blue-100 bg-blue-50/20' : 'border-gray-200'}`}>
                                        <div className="flex gap-4">
                                            <div className={`p-3 rounded-lg flex items-center justify-center h-fit ${notification.type === 'INVITATION' ? 'bg-purple-100 text-purple-600' :
                                                    notification.type === 'MESSAGE' ? 'bg-indigo-100 text-indigo-600' :
                                                        'bg-blue-100 text-blue-600'}`}>
                                                {notification.type === 'INVITATION' ? <UserPlus size={20} /> :
                                                    notification.type === 'MESSAGE' ? <MessageSquare size={20} /> :
                                                        <Info size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{notification.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">{format(new Date(notification.createdAt), "d MMMM 'à' HH:mm", { locale: fr })}</p>

                                                {notification.type === 'INVITATION' && (!notification.actionStatus || notification.actionStatus === 'pending') && (
                                                    <div className="flex gap-2 mt-4">
                                                        <button onClick={() => handleInvitation(notification._id, 'accept')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm">Accepter</button>
                                                        <button onClick={() => handleInvitation(notification._id, 'decline')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition">Refuser</button>
                                                    </div>
                                                )}
                                                {notification.actionStatus === 'accepted' && <p className="text-xs font-bold text-emerald-600 mt-2">✓ Vous avez rejoint le projet</p>}
                                                {notification.actionStatus === 'declined' && <p className="text-xs font-bold text-red-600 mt-2">✗ Invitation déclinée</p>}

                                                {notification.type === 'MESSAGE' && (
                                                    <div className="mt-4">
                                                        <Link
                                                            href="/messagerie"
                                                            onClick={() => markAsRead(notification._id)}
                                                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition inline-flex items-center gap-2"
                                                        >
                                                            <MessageSquare size={14} /> Répondre
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {notification.status === 'unread' && notification.type === 'INFO' && (
                                            <button onClick={() => markAsRead(notification._id)} className="p-2 hover:bg-blue-100 rounded-full text-blue-600 transition" title="Marquer comme lu">
                                                <Check size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-white border border-gray-200 rounded-3xl">
                                    <Bell size={48} className="mx-auto text-gray-200 mb-4" />
                                    <h3 className="text-xl font-bold text-gray-800">Aucune notification</h3>
                                    <p className="text-gray-500 mt-2">C'est très calme ici pour le moment.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}