'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { NotificationBell } from '@/components/NotificationBell';
import { RecentProjects } from '@/components/project/RecentProjects';
import { RecentCampaigns } from '@/components/campaigns/RecentCampaigns';
import { QuickActions } from '@/components/QuickActions';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import api from '@/lib/auth';
import { GitActivity } from '@/components/GitActivity';
import {
  Clock,
  AlertTriangle,
  FileText,
  Folder,
  TrendingUp,
  Bell,
  Info,
  UserPlus,
  ArrowRight
} from 'lucide-react';


const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between transition hover:shadow-md">
    <div>
      <p className="text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">{title}</p>
      <h3 className={`text-2xl font-black ${color}`}>{value}</h3>
      {subtext && <p className="text-[10px] text-gray-400 mt-1 font-medium italic">{subtext}</p>}
    </div>
    <div className={`p-2.5 rounded-xl ${color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')}`}>
      <Icon className={`w-5 h-5 ${color}`} />
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, loading } = useDashboardStats();


  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);

  useEffect(() => {
    const fetchLatestNotifications = async () => {
      try {
        const { data } = await api.get('/api/notifications');
        // On ne garde que les 3 dernières
        setNotifications(data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setNotifLoading(false);
      }
    };

    if (user) {
      fetchLatestNotifications();
    }
  }, [user]);

  const isAdmin = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor';


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">

        {/* 1. Sidebar Fixe */}
        <Navbar />

        {/* 2. Contenu Principal */}
        <div className="flex-1 ml-64">

          {/* Header Commun (Top Bar) */}
          <header className="bg-white h-20 border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
            <h2 className="text-xl font-bold text-gray-800">
              {isAdmin ? 'Administration' : 'Tableau de bord'}
            </h2>


            <div className="flex items-center gap-4">
              <NotificationBell />
              <div className="h-8 w-px bg-gray-200 mx-2"></div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">
                  {user ? `${user.firstName} ${user.lastName || user.name}` : 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500">
                  {isAdmin ? 'Administrateur' : user?.role || 'Étudiant'}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm">
                {user?.firstName ? user.firstName[0] : (user?.name ? user.name[0] : 'U')}
              </div>
            </div>

          </header>

          <main className="p-6 max-w-[1600px] mx-auto space-y-6">

            {/* Logique d'affichage conditionnel */}

            {isAdmin ? (
              <AdminDashboard />
            ) : (
              <>
                {/* 1. Cartes Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Projets Actifs"
                    value={loading ? "..." : stats.activeProjects}
                    icon={Folder}
                    color="text-blue-600"
                    subtext="En cours"
                  />
                  <StatCard
                    title="Mes Tâches"
                    value={loading ? "..." : stats.myTasks}
                    icon={FileText}
                    color="text-emerald-500"
                    subtext="À faire ou en cours"
                  />
                  <StatCard
                    title="Prochains Rendus"
                    value={loading ? "..." : stats.upcomingDeadlines}
                    icon={Clock}
                    color="text-yellow-500"
                    subtext="7 prochains jours"
                  />
                  <StatCard
                    title="Prochain Point de Contrôle"
                    value={loading ? "..." : (stats.nextCheckpoint ? stats.nextCheckpoint.title : 'Aucun')}
                    icon={TrendingUp} // Or maybe a flag/milestone icon if available, but TrendingUp was requested to be replaced.
                    color="text-purple-600"
                    subtext={loading ? "..." : (stats.nextCheckpoint ? new Date(stats.nextCheckpoint.date).toLocaleDateString() : 'Aucun point de contrôle')}
                  />
                </div>

                {/* 2. Grille Principale */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                  {/* Colonne Gauche : Tableaux & Git */}
                  <div className="xl:col-span-2 flex flex-col gap-8">
                    {isInstructor ? <RecentCampaigns /> : <RecentProjects />}

                    {!isAdmin && <GitActivity />}
                  </div>

                  {/* Colonne Droite : Actions & Notifications */}
                  <div className="flex flex-col gap-6">
                    <QuickActions />

                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20">
                      <div className="flex justify-between items-end mb-6 px-1">
                        <div>
                          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                            <Bell size={20} className="text-blue-600" />
                            Notifications
                          </h3>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-1">Dernières alertes</p>
                        </div>
                        {notifications.length > 0 && (
                          <Link href="/notifications" className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest transition-all group">
                            Voir plus
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </Link>
                        )}
                      </div>

                      <div className="space-y-3">
                        {notifLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse"></div>
                            ))}
                          </div>
                        ) : notifications.length > 0 ? (
                          <>
                            {notifications.slice(0, 3).map((notif: any) => (
                              <div key={notif._id} className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl transition-all hover:border-blue-100 hover:bg-blue-50/30 group">
                                <div className="flex gap-4">
                                  <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${notif.type === 'INVITATION' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {notif.type === 'INVITATION' ? <UserPlus size={18} /> : <Info size={18} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                      {notif.message}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-tight">
                                      {new Date(notif.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(notif.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="py-10 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-50 text-gray-300 mb-3 border border-gray-100">
                              <Bell size={28} />
                            </div>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-tighter">Tout est à jour</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </main>
        </div>
      </div>
    </ProtectedRoute >
  );
}