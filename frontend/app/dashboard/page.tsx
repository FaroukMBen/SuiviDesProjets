'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar'; // Ton nouveau composant
import Link from 'next/link';
import api from '@/lib/auth';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Search,
  Plus
} from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  // Simulation de données (à remplacer par ton fetchProjects)
  const stats = {
    projects: 4,
    tasksLate: 6,
    toValidate: 15,
    avgScore: 14.5
  };

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
                value={stats.projects} 
                icon={Folder} 
                color="text-blue-600" 
              />
              <StatCard 
                title="Livrables à valider" 
                value={stats.toValidate} 
                icon={FileText} 
                color="text-yellow-500" 
                subtext="Attention requise"
              />
              <StatCard 
                title="Tâches en retard" 
                value={stats.tasksLate} 
                icon={AlertTriangle} 
                color="text-red-500" 
                subtext="Critique"
              />
              <StatCard 
                title="Moyenne Promo" 
                value={stats.avgScore} 
                icon={CheckCircle} 
                color="text-emerald-500" 
                subtext="/ 20"
              />
            </div>

            {/* 2. Grille Principale (Tableau + Actions) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Colonne Gauche (Large) : Tableau des Projets Récents */}
              <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                    Projets récents
                  </h3>
                  <button className="text-sm text-blue-600 hover:underline">Voir tout</button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-6 py-4">Projet</th>
                        <th className="px-6 py-4">Date limite</th>
                        <th className="px-6 py-4">Matière</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[1, 2, 3].map((i) => (
                        <tr key={i} className="hover:bg-gray-50/50 transition">
                          <td className="px-6 py-4 font-medium text-gray-900">SAE - Plateforme Web</td>
                          <td className="px-6 py-4">18/10/2025</td>
                          <td className="px-6 py-4">Informatique</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                              En cours
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <Link href="#" className="text-blue-600 font-medium hover:text-blue-800">Ouvrir</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Colonne Droite : Actions & Alertes */}
              <div className="space-y-8">
                
                {/* Actions Rapides */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    ⚡ Actions rapides
                  </h3>
                  <div className="space-y-3">
                    <Link href="/projects/new" className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                      <Plus size={18} />
                      Nouveau Projet
                    </Link>
                    <button className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition shadow-lg shadow-emerald-200">
                      <CheckCircle size={18} />
                      Valider Livrables
                    </button>
                    <button className="flex items-center justify-center gap-2 w-full py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-200">
                      <Search size={18} />
                      Rechercher Étudiant
                    </button>
                  </div>
                </div>

                {/* Alertes Importantes */}
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

              </div>
            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Petite correction d'import temporaire si tu n'as pas Folder importé
import { Folder } from 'lucide-react';