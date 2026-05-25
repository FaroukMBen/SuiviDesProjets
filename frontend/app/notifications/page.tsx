'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';
import {
    Bell,
    Info,
    UserPlus,
    CheckCircle2,
    MessageSquare,
    Mail,
    MailOpen,
    Trash2,
    RefreshCw,
    XCircle
} from 'lucide-react';
import { useThemeStore } from '@/lib/store';
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
    isDeleted?: boolean;
}

export default function NotificationsPage() {
    const { theme } = useThemeStore();
    const isModern = theme === 'modern';

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'trash'>('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);

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

    const toggleReadStatus = async (id: string) => {
        try {
            await api.put(`/api/notifications/${id}/toggle`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, status: n.status === 'read' ? 'unread' : 'read' } : n)
            );
        } catch (error) {
            console.error('Error toggling read status:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/api/notifications/${id}`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isDeleted: true } : n)
            );
            showToast("Notification envoyée à la corbeille", "success");
        } catch (error) {
            console.error('Error deleting notification:', error);
            showToast("Erreur lors de la suppression", "error");
        }
    };

    const restoreNotification = async (id: string) => {
        try {
            await api.put(`/api/notifications/${id}/restore`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isDeleted: false } : n)
            );
            showToast("Notification restaurée", "success");
        } catch (error) {
            console.error('Error restoring notification:', error);
            showToast("Erreur lors de la restauration", "error");
        }
    };

    const permanentDelete = async (id: string) => {
        if (!globalThis.confirm("Supprimer définitivement cette notification ?")) return;
        try {
            await api.delete(`/api/notifications/${id}/permanent`);
            setNotifications(prev => prev.filter(n => n._id !== id));
            showToast("Notification supprimée définitivement", "success");
        } catch (error) {
            console.error('Error permanent delete:', error);
            showToast("Erreur lors de la suppression définitive", "error");
        }
    };

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
                {/* Animated Background Elements for Modern Theme */}
                {isModern && (
                    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden flex items-center justify-center">
                        <div className="absolute w-[800px] h-[800px] bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-[100px] animate-[spin_60s_linear_infinite] opacity-50"></div>
                        <div className="absolute w-[600px] h-[600px] bg-gradient-to-bl from-indigo-400/20 to-cyan-400/20 rounded-full blur-[80px] animate-[spin_40s_linear_infinite_reverse] opacity-50" style={{ animationDelay: '-5s' }}></div>
                    </div>
                )}

                <Navbar />

                <div className="flex-1 ml-64 p-12 relative overflow-y-auto h-screen">

                    {/* --- PREMIUM HEADER --- */}
                    <div className={`sticky top-0 z-30 mb-10 -mx-4 px-4 py-4 ${isModern ? 'bg-[#f8fafc]/80 backdrop-blur-md' : 'bg-white/95 backdrop-blur-sm'} border-b border-gray-200/60`}>
                        <div className="max-w-4xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-10">
                                <h1 className={`${isModern ? 'text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600' : 'text-2xl font-bold text-gray-800'}`}>
                                    Notifications
                                </h1>
                                
                                <div className="flex items-center gap-2">
                                    {(['all', 'unread'] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`group relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                                                filter === f
                                                    ? (isModern ? 'text-blue-600 bg-blue-50/50' : 'text-blue-600 bg-blue-50')
                                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                                            }`}
                                        >
                                            <span className="relative z-10 flex items-center gap-2 uppercase tracking-wide text-[11px]">
                                                {f === 'all' ? 'Toutes' : 'Non lues'}
                                                {f === 'unread' && unreadCount > 0 && (
                                                    <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-lg text-[10px] font-black transition-all ${
                                                        filter === f 
                                                            ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' 
                                                            : 'bg-gray-200 text-gray-600'
                                                    }`}>
                                                        {unreadCount}
                                                    </span>
                                                )}
                                            </span>
                                            {filter === f && (
                                                <div className="absolute inset-0 rounded-xl border-2 border-blue-600/10 animate-pulse"></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setFilter(filter === 'trash' ? 'all' : 'trash')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all group ${
                                    filter === 'trash' 
                                        ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/20 scale-95' 
                                        : 'bg-white border-2 border-gray-100 text-gray-500 hover:border-red-100 hover:text-red-500 hover:shadow-lg'
                                }`}
                            >
                                <Trash2 size={18} className={`${filter !== 'trash' ? 'group-hover:rotate-12 transition-transform' : ''}`} /> 
                                <span>{filter === 'trash' ? 'Retour' : 'Corbeille'}</span>
                            </button>
                        </div>
                    </div>

                    {/* --- LISTE DES NOTIFICATIONS --- */}
                    <div className="max-w-4xl mx-auto">
                        {loading ? (
                            <div className="space-y-6">
                                {new Array(3).fill(null).map((_, i) => (
                                    <div key={`skeleton-${i}`} className="bg-white/50 backdrop-blur-sm p-10 rounded-3xl border border-white shadow-sm animate-pulse h-40"></div>
                                ))}
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="space-y-4">
                                {notifications
                                    .filter(n => {
                                        if (filter === 'trash') return n.isDeleted;
                                        if (n.isDeleted) return false;
                                        if (filter === 'unread') return n.status === 'unread';
                                        return true;
                                    })
                                    .map((notification) => (
                                    <div
                                        key={notification._id}
                                        onClick={() => {
                                            setSelectedId(notification._id !== selectedId ? notification._id : null);
                                            if (notification.status === 'unread' && filter !== 'trash') {
                                                markAsRead(notification._id);
                                            }
                                        }}
                                        className={`group relative p-6 transition-all duration-400 ease-out cursor-pointer outline-none w-full
                                        ${selectedId === notification._id ? 'z-20' : 'z-10'}
                                        ${isModern
                                            // Modern Look
                                            ? `rounded-[1.5rem] overflow-hidden backdrop-blur-xl border
                                                ${selectedId === notification._id 
                                                    ? 'bg-white shadow-[0_30px_60px_-15px_rgba(37,99,235,0.2)] border-blue-200 scale-[1.02] -translate-y-1' 
                                                    : selectedId 
                                                        ? 'bg-white/40 border-white/20 opacity-50 scale-95 hover:opacity-100 hover:scale-100' // Another is selected
                                                        : notification.status === 'unread' 
                                                            ? 'bg-white/90 border-white/50 shadow-[0_10px_30px_-15px_rgba(37,99,235,0.15)] hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.2)] hover:-translate-y-1'
                                                            : 'bg-white/60 border-slate-200/50 hover:bg-white/80 hover:shadow-lg'
                                                }
                                                ${filter === 'trash' ? 'grayscale-[0.6] opacity-70 hover:grayscale-0 hover:opacity-100' : ''}`
                                            
                                            // Classic Look
                                            : `rounded-xl border
                                                ${selectedId === notification._id
                                                    ? 'bg-blue-50 border-blue-300 shadow-md transform -translate-y-0.5'
                                                    : selectedId
                                                        ? 'bg-gray-50 border-gray-200 opacity-60'
                                                        : notification.status === 'unread'
                                                            ? 'bg-white border-blue-200 shadow-sm'
                                                            : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
                                                }
                                                ${filter === 'trash' ? 'bg-gray-100 opacity-75' : ''}`
                                        }
                                `}
                                    >
                                        {/* Left Accent Bar (Modern only) */}
                                        {isModern && notification.status === 'unread' && filter !== 'trash' && (
                                            <div className={`absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 shadow-[2px_0_15px_rgba(59,130,246,0.5)] transition-opacity ${selectedId && selectedId !== notification._id ? 'opacity-30' : 'opacity-100'}`}></div>
                                        )}
                                        
                                        <div className="flex gap-5 relative z-10 w-full">
                                            {/* Icon Box */}
                                            <div className={`shrink-0 w-14 h-14 flex items-center justify-center transition-all duration-300 ${
                                                isModern 
                                                    ? `rounded-[1.25rem] ${selectedId === notification._id ? 'shadow-md scale-110' : 'shadow-sm'}` 
                                                    : `rounded-full ${selectedId === notification._id ? 'ring-4 ring-blue-100' : ''}`
                                            } ${
                                                notification.status === 'unread' || selectedId === notification._id
                                                    ? (notification.type === 'INVITATION' ? `text-purple-600 ${isModern ? 'bg-gradient-to-tr from-purple-100 to-white' : 'bg-purple-100'}` :
                                                       notification.type === 'MESSAGE' ? `text-indigo-600 ${isModern ? 'bg-gradient-to-tr from-indigo-100 to-white' : 'bg-indigo-100'}` :
                                                       `text-blue-600 ${isModern ? 'bg-gradient-to-tr from-blue-100 to-white' : 'bg-blue-100'}`)
                                                    : `text-slate-400 ${isModern ? 'bg-slate-100/80 shadow-inner' : 'bg-slate-100'}`
                                            }`}>
                                                {notification.type === 'INVITATION' && <UserPlus size={selectedId === notification._id ? 24 : 22} />}
                                                {notification.type === 'MESSAGE' && <MessageSquare size={selectedId === notification._id ? 24 : 22} />}
                                                {notification.type === 'INFO' && <Info size={selectedId === notification._id ? 24 : 22} />}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex flex-col truncate pr-4">
                                                        <h4 className={`text-[16px] truncate ${notification.status === 'unread' || selectedId === notification._id ? 'text-slate-900 font-bold' : 'text-slate-700 font-semibold'}`}>
                                                            {notification.type === 'INVITATION' ? 'Nouvelle invitation' :
                                                                notification.type === 'MESSAGE' ? 'Nouveau message' : 'Mise à jour'}
                                                            {notification.status === 'unread' && isModern && (
                                                                <span className="ml-2 inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse relative -top-0.5 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                                                            )}
                                                        </h4>
                                                        <span className={`text-[12px] font-medium mt-0.5 ${selectedId === notification._id ? 'text-blue-600/70' : 'text-slate-400'}`}>
                                                            {format(new Date(notification.createdAt), "d MMM yyyy '•' HH:mm", { locale: fr })}
                                                        </span>
                                                    </div>

                                                    {/* Quick Actions (only visible when not hovered/selected or always visible in classic) */}
                                                    <div className={`flex items-center gap-1 transition-opacity duration-200 ${(selectedId && selectedId !== notification._id) ? 'opacity-0' : 'opacity-100'}`}>
                                                        {filter === 'trash' ? (
                                                            <>
                                                                <button onClick={(e) => { e.stopPropagation(); restoreNotification(notification._id); }} className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-all" title="Restaurer"><RefreshCw size={18} /></button>
                                                                <button onClick={(e) => { e.stopPropagation(); permanentDelete(notification._id); }} className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Supprimer définitivement"><XCircle size={18} /></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={(e) => { e.stopPropagation(); toggleReadStatus(notification._id); }} className={`p-2 rounded-xl transition-all ${notification.status === 'unread' ? `text-blue-600 ${isModern ? 'hover:bg-blue-50' : 'hover:bg-blue-50'}` : `text-slate-400 hover:text-blue-600 hover:bg-blue-50`}`} title="Statut lu/non lu">{notification.status === 'unread' ? <Mail size={18} /> : <MailOpen size={18} />}</button>
                                                                <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }} className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Mettre à la corbeille"><Trash2 size={18} /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className={`text-[14px] leading-relaxed transition-colors duration-300 ${selectedId === notification._id ? 'text-slate-800' : notification.status === 'unread' ? 'text-slate-700' : 'text-slate-500'}`}>
                                                    {notification.message}
                                                </div>

                                                {/* Expanded Actions (Only show clearly when selected or always for important actions) */}
                                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${selectedId === notification._id ? 'max-h-24 opacity-100 mt-4' : 'max-h-20 opacity-90 mt-3'}`}>
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        {notification.type === 'INVITATION' && (!notification.actionStatus || notification.actionStatus === 'pending') && (
                                                            <>
                                                                <button onClick={(e) => { e.stopPropagation(); handleInvitation(notification._id, 'accept'); }} className={`flex items-center gap-1.5 px-5 py-2.5 text-white rounded-xl text-sm font-bold transition-all ${isModern ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_4px_15px_rgba(37,99,235,0.4)] hover:shadow-[0_8px_25px_rgba(37,99,235,0.5)] hover:-translate-y-0.5' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'}`}>
                                                                    <CheckCircle2 size={16} /> Accepter l'invitation
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleInvitation(notification._id, 'decline'); }} className={`px-4 py-2.5 text-sm font-semibold transition-all ${isModern ? 'bg-white/80 border-2 border-slate-200 text-slate-700 rounded-xl hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5' : 'bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50'}`}>
                                                                    Décliner
                                                                </button>
                                                            </>
                                                        )}

                                                        {notification.actionStatus === 'accepted' && (
                                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border ${isModern ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 backdrop-blur' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                                                <CheckCircle2 size={16} /> Invitation acceptée
                                                            </div>
                                                        )}
                                                        {notification.actionStatus === 'declined' && (
                                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border ${isModern ? 'bg-slate-100/80 text-slate-600 border-slate-200 backdrop-blur' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                                Invitation déclinée
                                                            </div>
                                                        )}

                                                        {notification.type === 'MESSAGE' && (
                                                            <Link href="/messagerie" onClick={(e) => { e.stopPropagation(); markAsRead(notification._id); }} className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-bold transition-all ${isModern ? 'bg-slate-900 shadow-[0_4px_15px_rgba(15,23,42,0.3)] hover:shadow-[0_8px_25px_rgba(15,23,42,0.4)] hover:-translate-y-0.5' : 'bg-slate-900 hover:bg-slate-800'}`}>
                                                                <MessageSquare size={16} /> Répondre
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
                </div>
            </div>
        </ProtectedRoute>
    );
}