'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import ProtectedRoute  from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import api from '@/lib/auth';
import { NotificationBell } from '@/components/NotificationBell';
import { RecentProjects } from '@/components/project/RecentProjects';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import {
  Clock,
  AlertTriangle,
  FileText,
  Folder,
  TrendingUp
} from 'lucide-react';
import { QuickActions } from '@/components/QuickActions';
import { RecentCampaigns } from '@/components/campaigns/RecentCampaigns';

// --- Composant Carte Statistique (Style Image Fournie) ---
const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between transition hover:shadow-md">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h3 className={`text-3xl font-bold ${color}`}>{value}</h3>
      {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')}`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { stats, loading } = useDashboardStats();

  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
        {/* 1. Sidebar Fixe à Gauche */}
        <Navbar />

        {/* 2. Contenu Principal (Décalé de 64 = 16rem = largeur sidebar) */}
        <div className="flex-1 ml-64">

          {/* Header (Top Bar) */}
          <header className="bg-white h-20 border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
            <h2 className="text-xl font-bold text-gray-800">Tableau de bord</h2>

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

            {/* 1. Cartes Statistiques (Top Row) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                title="Projets en cours" 
                value={loading ? "..." : stats.projects} 
                icon={Folder} 
                color="text-blue-600"
              />
              <StatCard 
                title="Livrables à valider" 
                value={loading ? "..." : stats.toValidate} 
                icon={FileText} 
                color="text-yellow-500" 
                subtext="Attention requise"
              />
              <StatCard 
                title="Tâches en retard" 
                value={loading ? "..." : stats.tasksLate} 
                icon={AlertTriangle} 
                color="text-red-500" 
                subtext="Critique"
              />
              <StatCard 
                title="Progression Globale" 
                value={loading ? "..." : `${stats.progress}%`} 
                icon={TrendingUp} 
                color="text-emerald-500" 
                subtext={loading ? "..." : `${stats.completedTasks} sur ${stats.totalTasks} tâches finies`}
              />
            </div>

            {/* 2. Grille Principale (Tableau + Actions) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

              {/* Colonne Gauche (Large) : Tableau des Projets Récents */}
              {/* Colonne Gauche (Large) */}
              <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  
                  {/* 👇 C'EST ICI QUE LA MAGIE OPÈRE */}
                  {isInstructor ? (
                    <RecentCampaigns />
                  ) : (
                    <RecentProjects />
                  )}

              </div>

              {/* Colonne Droite : Actions & Alertes */}
              <div className="space-y-8">
                
                {/* ✅ Ton nouveau composant */}
                <QuickActions />  

                {/* 👇 Les alertes doivent être DANS la div "space-y-8", pas après ! */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4">🔔 Alertes importantes</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800 flex gap-3">
                      <AlertTriangle className="shrink-0 w-5 h-5 text-red-500" />
                      <div>
                        <span className="font-bold block mb-1">Retard Critique</span>
                        Le groupe "App Santé" n'a pas commité depuis 5 jours.
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-sm text-yellow-800 flex gap-3">
                      <Clock className="shrink-0 w-5 h-5 text-yellow-600" />
                      <div>
                        <span className="font-bold block mb-1">Jalon Approche</span>
                        Rendu final SAE S3 attendu pour demain.
                      </div>
                    </div>
                  </div>
                </div>
                {/* 👆 C'est ICI qu'il faut fermer la colonne droite */}
              </div>

            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

