'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import { 
  Bell, 
  Check, 
  X, 
  Info, 
  UserPlus, 
  Calendar, 
  CheckCircle2 
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
  _id: string;
  type: 'INVITATION' | 'INFO';
  message: string;
  status: 'unread' | 'read';
  project?: {
    _id: string;
    title: string;
  };
  sender?: {
    name: string;
  };
  createdAt: string;
  actionStatus?: 'pending' | 'accepted' | 'declined';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, status: 'read' } : n)
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleInvitation = async (id: string, action: 'accept' | 'decline') => {
    try {
      // On suppose que ta route API gère ça (ex: /api/notifications/:id/respond)
      await api.post(`/api/notifications/${id}/respond`, { action });
      
      // Mise à jour optimiste de l'UI
      setNotifications(prev => 
        prev.map(n => n._id === id ? { 
            ...n, 
            actionStatus: action === 'accept' ? 'accepted' : 'declined',
            status: 'read' 
        } : n)
      );
    } catch (error) {
      alert("Une erreur est survenue lors de la réponse à l'invitation.");
    }
  };

  // Compteur de non-lues
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
        
        {/* 1. SIDEBAR */}
        <Navbar />

        {/* 2. CONTENU PRINCIPAL */}
        <div className="flex-1 ml-64 p-8">
            
            {/* --- HEADER --- */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Centre de Notifications</h1>
                    <p className="text-gray-500">Gérez vos invitations et restez informé des mises à jour.</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm border ${
                    unreadCount > 0 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-500 border-gray-200'
                }`}>
                    <Bell size={18} />
                    {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est lu'}
                </div>
            </div>

            {/* --- LISTE DES NOTIFICATIONS --- */}
            <div className="space-y-4 max-w-4xl">
                
                {loading ? (
                    // SKELETON
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-24"></div>
                    ))
                ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                        <div 
                            key={notification._id} 
                            className={`group relative bg-white rounded-xl p-6 border transition-all duration-200
                                ${notification.status === 'unread' 
                                    ? 'border-blue-200 shadow-md shadow-blue-50' 
                                    : 'border-gray-100 shadow-sm opacity-80 hover:opacity-100'
                                }
                            `}
                        >
                            <div className="flex gap-5">
                                
                                {/* 1. Icône Latérale */}
                                <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                                    ${notification.type === 'INVITATION' 
                                        ? 'bg-purple-100 text-purple-600' 
                                        : 'bg-blue-100 text-blue-600'
                                    }
                                `}>
                                    {notification.type === 'INVITATION' ? <UserPlus size={24} /> : <Info size={24} />}
                                </div>

                                {/* 2. Contenu Texte */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-gray-900 font-bold text-lg mb-1">
                                            {notification.type === 'INVITATION' ? 'Invitation reçue' : 'Information'}
                                        </h4>
                                        <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                            <Calendar size={12} />
                                            {format(new Date(notification.createdAt), "d MMM à HH:mm", { locale: fr })}
                                        </span>
                                    </div>
                                    
                                    <p className="text-gray-600 leading-relaxed">
                                        {notification.message}
                                    </p>

                                    {/* 3. Zone d'Actions (Conditionnelle) */}
                                    <div className="mt-4 flex flex-wrap gap-3 items-center">
                                        
                                        {/* CAS INVITATION EN ATTENTE */}
                                        {notification.type === 'INVITATION' && (!notification.actionStatus || notification.actionStatus === 'pending') && (
                                            <>
                                                <button 
                                                    onClick={() => handleInvitation(notification._id, 'accept')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm hover:shadow-md"
                                                >
                                                    <Check size={16} /> Accepter
                                                </button>
                                                <button 
                                                    onClick={() => handleInvitation(notification._id, 'decline')}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                                                >
                                                    <X size={16} /> Refuser
                                                </button>
                                            </>
                                        )}

                                        {/* CAS INVITATION DÉJÀ TRAITÉE */}
                                        {notification.actionStatus === 'accepted' && (
                                            <span className="text-green-600 bg-green-50 px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2 border border-green-100">
                                                <CheckCircle2 size={16} /> Invitation acceptée
                                            </span>
                                        )}
                                        {notification.actionStatus === 'declined' && (
                                            <span className="text-red-600 bg-red-50 px-3 py-1 rounded-lg text-sm font-medium border border-red-100">
                                                Invitation refusée
                                            </span>
                                        )}

                                        {/* BOUTON MARQUER COMME LU (Pour les Infos non lues) */}
                                        {notification.type === 'INFO' && notification.status === 'unread' && (
                                            <button 
                                                onClick={() => markAsRead(notification._id)}
                                                className="text-sm text-gray-500 hover:text-blue-600 underline decoration-gray-300 underline-offset-4 transition"
                                            >
                                                Marquer comme lu
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Indicateur point bleu (Non lu) */}
                            {notification.status === 'unread' && (
                                <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                            )}
                        </div>
                    ))
                ) : (
                    // EMPTY STATE
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Bell className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Aucune notification</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-1">
                            Vous êtes à jour ! Tout est calme pour le moment.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}