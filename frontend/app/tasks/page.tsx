'use client';
import { GlobalKanbanBoard } from '@/components/GlobalKanbanBoard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { NotificationBell } from '@/components/NotificationBell';
import { useAuthStore } from '@/lib/store';

export default function TasksPage() {
    const { user } = useAuthStore();

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
                {/* 1. Sidebar Fixe à Gauche */}
                <Navbar />

                {/* 2. Contenu Principal (Décalé de 64 = 16rem = largeur sidebar) */}
                <div className="flex-1 ml-64">

                    {/* Header (Top Bar) */}
                    <header className="bg-white h-20 border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
                        <h2 className="text-xl font-bold text-gray-800">Mes Tâches</h2>

                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <div className="h-8 w-px bg-gray-200 mx-2"></div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{user?.name || 'Utilisateur'}</p>
                                <p className="text-xs text-gray-500">{user?.role || 'Étudiant'}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm">
                                {user?.name ? user.name[0] : 'U'}
                            </div>
                        </div>
                    </header>

                    <main className="p-8 max-w-[1600px] mx-auto space-y-8">
                        <GlobalKanbanBoard />
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
