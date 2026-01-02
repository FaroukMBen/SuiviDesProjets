'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import api from '@/lib/auth';

interface Notification {
    _id: string;
    type: 'INVITATION' | 'INFO';
    message: string;
    status: 'unread' | 'read';
    project?: {
        _id: string;
        title: string;
    };
    sender: {
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
            console.error('Error marking as read:', error);
        }
    };

    const handleRespond = async (id: string, action: 'accept' | 'decline') => {
        try {
            await api.post(`/api/notifications/${id}/respond`, { action });
            fetchNotifications(); // Refresh to show updated status
        } catch (error) {
            console.error(`Error responding to invitation (${action}):`, error);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[--color-surface]">
                <Navbar />

                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ml-64">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-[--color-foreground]">Notifications</h1>
                        <p className="text-[--color-muted] mt-2">Gérez vos invitations et alertes.</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-[--color-border] overflow-hidden">
                        {loading ? (
                            <div className="p-8 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--color-primary]"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <p className="text-lg font-medium">Aucune notification</p>
                                <p className="text-sm mt-1">Vous êtes à jour !</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-6 transition-colors ${notification.status === 'unread' ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="flex gap-4 items-start">
                                            <div className="flex-shrink-0 mt-1">
                                                {notification.type === 'INVITATION' ? (
                                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-gray-900 font-medium">{notification.message}</p>
                                                        {notification.project && (
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                Projet concerné : <span className="font-semibold">{notification.project.title}</span>
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            Reçu le {new Date(notification.createdAt).toLocaleDateString()} à {new Date(notification.createdAt).toLocaleTimeString()}
                                                        </p>
                                                    </div>

                                                    {notification.status === 'unread' && notification.type === 'INVITATION' && notification.actionStatus === 'pending' && (
                                                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                                    )}
                                                </div>

                                                <div className="mt-4">
                                                    {notification.type === 'INVITATION' && notification.actionStatus === 'pending' && (
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => handleRespond(notification._id, 'accept')}
                                                                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
                                                            >
                                                                Accepter l'invitation
                                                            </button>
                                                            <button
                                                                onClick={() => handleRespond(notification._id, 'decline')}
                                                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                                                            >
                                                                Refuser
                                                            </button>
                                                        </div>
                                                    )}

                                                    {notification.type === 'INVITATION' && notification.actionStatus !== 'pending' && (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${notification.actionStatus === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {notification.actionStatus === 'accepted' ? 'Acceptée' : 'Refusée'}
                                                        </span>
                                                    )}

                                                    {(notification.type === 'INFO' || (notification.type === 'INVITATION' && notification.actionStatus !== 'pending')) && notification.status === 'unread' && (
                                                        <button
                                                            onClick={() => markAsRead(notification._id)}
                                                            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                                                        >
                                                            Marquer comme lu
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
