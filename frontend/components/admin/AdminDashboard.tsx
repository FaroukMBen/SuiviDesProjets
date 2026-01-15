'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/auth';
import { 
  Users, 
  FolderOpen, 
  FileText, 
  Settings, 
  Shield, 
  ArrowRight, 
  Activity 
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    usersCount: 0,
    campaignsCount: 0,
    projectsCount: 0, // Optionnel si tu as une route pour ça
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // On lance les requêtes en parallèle pour aller plus vite
        const [usersRes, campaignsRes, projectRes] = await Promise.all([
          api.get('/api/users'),       // On récupère la liste pour compter (optimisable plus tard)
          api.get('/api/campaigns'),
          api.get('/api/projects')
        ]);

        setStats({
          usersCount: usersRes.data.users.length,
          campaignsCount: campaignsRes.data.campaigns.length,
          projectsCount: projectRes.data.count, // À brancher quand on aura la route projets
        });
      } catch (err) {
        console.error("Erreur chargement stats admin", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Vue d'ensemble Système</h2>
            <p className="text-gray-500">Bienvenue dans le panneau d'administration Nexus.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
            <Activity size={16} />
            Système opérationnel
        </div>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Utilisateurs */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium">Utilisateurs Totaux</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                    {loading ? '...' : stats.usersCount}
                </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <Users size={24} />
            </div>
        </div>

        {/* Card Campagnes */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium">Campagnes Créées</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                    {loading ? '...' : stats.campaignsCount}
                </h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <FolderOpen size={24} />
            </div>
        </div>

        {/* Card Projets (Fake pour l'instant ou à brancher) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-500 text-sm font-medium">Projets Déposés</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                    {loading ? '...' : stats.projectsCount}
                </h3>
            </div>
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                <FileText size={24} />
            </div>
        </div>
      </div>

      {/* --- ACTIONS RAPIDES --- */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Gestion Administrative</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Lien vers Gestion Utilisateurs */}
            <Link 
                href="/admin/users" 
                className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">Gérer les Utilisateurs</h4>
                        <p className="text-sm text-gray-500">Ajouter, modifier ou supprimer des comptes.</p>
                    </div>
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-blue-600 transition-colors" />
            </Link>

            <Link 
                href="/admin/users" 
                className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">Gérer les Campagnes</h4>
                        <p className="text-sm text-gray-500">Ajouter, modifier ou supprimer des campagnes.</p>
                    </div>
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-blue-600 transition-colors" />
            </Link>

            <Link 
                href="/admin/users" 
                className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">Gérer les Projets</h4>
                        <p className="text-sm text-gray-500">Ajouter, modifier ou supprimer des projets étudiants.</p>
                    </div>
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-blue-600 transition-colors" />
            </Link>

            {/* Lien vers Campagnes (Admin peut aussi voir/créer) */}
            <Link 
                href="/campaigns" // On peut rediriger vers la page générale des campagnes
                className="group p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-purple-300 hover:shadow-md transition-all flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">Configuration Globale</h4>
                        <p className="text-sm text-gray-500">Accéder aux campagnes et grilles d'évaluation.</p>
                    </div>
                </div>
                <ArrowRight className="text-gray-300 group-hover:text-purple-600 transition-colors" />
            </Link>
        </div>
      </div>
      
      {/* --- LOGS / ALERTE SÉCURITÉ (Optionnel pour faire pro) --- */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-start gap-3">
          <Shield className="text-gray-400 mt-1" size={20} />
          <div>
              <h4 className="text-sm font-bold text-gray-700">Mode Super-Administrateur</h4>
              <p className="text-xs text-gray-500">
                  Vous avez les droits complets sur la plateforme. Toute suppression de données est définitive et irréversible. 
                  Soyez prudent lors de la modification des rôles utilisateurs.
              </p>
          </div>
      </div>

    </div>
  );
}