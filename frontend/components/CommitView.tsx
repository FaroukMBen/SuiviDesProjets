'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/auth';
import { 
  GitCommit, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  GitPullRequest, 
  Calendar 
} from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface Commit {
  _id: string;
  message: string;
  author: { name: string; email?: string };
  url: string;
  timestamp: string;
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
}

export function CommitView({ projectId }: { projectId: string }) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'stats'>('stats');

  useEffect(() => {
    fetchCommits();
  }, [projectId]);

  const fetchCommits = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/commits/project/${projectId}`);
      setCommits(response.data.commits);
    } catch (err) {
      console.error("Erreur fetch commits", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Calculs pour les Statistiques ---
  const totalCommits = commits.length;
  const totalAdditions = commits.reduce((acc, c) => acc + (c.stats?.additions || 0), 0);
  const totalDeletions = commits.reduce((acc, c) => acc + (c.stats?.deletions || 0), 0);
  
  // Grouper par contributeur
  const contributors = Object.values(commits.reduce((acc: any, commit) => {
    const name = commit.author?.name || 'Inconnu';
    if (!acc[name]) {
      acc[name] = { name, commits: 0, additions: 0, deletions: 0 };
    }
    acc[name].commits += 1;
    acc[name].additions += (commit.stats?.additions || 0);
    acc[name].deletions += (commit.stats?.deletions || 0);
    return acc;
  }, {})).map((c: any) => ({
    ...c,
    totalChanges: c.additions + c.deletions,
    percentage: totalCommits > 0 ? Math.round((c.commits / totalCommits) * 100) : 0
  })).sort((a: any, b: any) => b.commits - a.commits); // Trier par activité

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl"></div>;

  return (
    <div className="space-y-6">
      
      {/* 1. Toggle Switch (Historique / Statistiques) */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'history' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Historique commit
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'stats' 
              ? 'bg-gray-900 text-white shadow-sm' // Style "Noir" actif de la maquette
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Statistiques
        </button>
      </div>

      {activeTab === 'stats' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* 2. Cartes KPI */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <GitCommit size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Total Commits</p>
                <p className="text-2xl font-bold text-gray-900">{totalCommits}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Lignes ajoutées</p>
                <p className="text-2xl font-bold text-gray-900">{totalAdditions}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Lignes supprimées</p>
                <p className="text-2xl font-bold text-gray-900">{totalDeletions}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Contributeurs</p>
                <p className="text-2xl font-bold text-gray-900">{contributors.length}</p>
              </div>
            </Card>
          </div>

          {/* 3. Section Graphique & Détail (Split Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Graphique Simplifié (Simulation visuelle "Commits par semaine") */}
            <Card className="lg:col-span-1 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Activité récente</h3>
              <div className="space-y-6">
                {/* Simulation de barres de progression pour l'exemple visuel */}
                <div>
                   <div className="flex justify-between text-sm mb-2">
                     <span className="text-gray-500 flex items-center gap-2"><Calendar size={14}/> Semaine 1</span>
                     <span className="font-bold text-gray-900">615 commits</span>
                   </div>
                   <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-500" style={{ width: '45%' }}></div>
                      <div className="h-full bg-gray-900" style={{ width: '30%' }}></div>
                      <div className="h-full bg-red-500" style={{ width: '25%' }}></div>
                   </div>
                   <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                      <span>Ilias</span>
                      <span>Sara</span>
                      <span>Sofiane</span>
                   </div>
                </div>

                <div>
                   <div className="flex justify-between text-sm mb-2">
                     <span className="text-gray-500 flex items-center gap-2"><Calendar size={14}/> Semaine 2</span>
                     <span className="font-bold text-gray-900">429 commits</span>
                   </div>
                   <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-500" style={{ width: '30%' }}></div>
                      <div className="h-full bg-gray-900" style={{ width: '50%' }}></div>
                      <div className="h-full bg-red-500" style={{ width: '20%' }}></div>
                   </div>
                </div>
              </div>
            </Card>

            {/* Tableau Détail Contributeur */}
            <Card className="lg:col-span-2 overflow-hidden">
               <div className="p-6 border-b border-gray-100">
                 <h3 className="text-lg font-bold text-gray-900">Détail par contributeur</h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                     <tr>
                       <th className="px-6 py-4">Contributeur</th>
                       <th className="px-6 py-4 text-center">Commits</th>
                       <th className="px-6 py-4 text-center text-emerald-600">Additions</th>
                       <th className="px-6 py-4 text-center text-red-500">Suppressions</th>
                       <th className="px-6 py-4 text-center">Total</th>
                       <th className="px-6 py-4 text-right">Contribution</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {contributors.map((c: any, idx) => (
                       <tr key={idx} className="hover:bg-gray-50/50 transition">
                         <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white
                             ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-gray-900' : 'bg-red-500'}
                           `}>
                             {c.name[0]}
                           </div>
                           {c.name}
                         </td>
                         <td className="px-6 py-4 text-center font-medium text-gray-600">{c.commits}</td>
                         <td className="px-6 py-4 text-center font-medium text-emerald-600">+{c.additions}</td>
                         <td className="px-6 py-4 text-center font-medium text-red-500">-{c.deletions}</td>
                         <td className="px-6 py-4 text-center font-medium text-gray-900">{c.totalChanges}</td>
                         <td className="px-6 py-4 text-right">
                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                             {c.percentage}%
                           </span>
                         </td>
                       </tr>
                     ))}
                     {contributors.length === 0 && (
                       <tr>
                         <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                           Aucune donnée disponible. Synchronisez le dépôt Git pour voir les stats.
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </Card>
          </div>

        </div>
      ) : (
        /* 4. Vue Historique (Liste Classique mais stylisée) */
        <div className="space-y-4 animate-in fade-in duration-300">
          {commits.map((commit) => (
            <div key={commit._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition group">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                   <div className="mt-1">
                     <GitPullRequest className="text-gray-400 group-hover:text-blue-500 transition" size={20} />
                   </div>
                   <div>
                     <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition cursor-pointer">
                       {commit.message}
                     </p>
                     <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                       <span className="font-medium text-gray-700">{commit.author?.name}</span>
                       <span>•</span>
                       <span>{new Date(commit.timestamp).toLocaleDateString()} à {new Date(commit.timestamp).toLocaleTimeString()}</span>
                     </div>
                   </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">+{commit.stats?.additions || 0}</span>
                  <span className="text-red-500 bg-red-50 px-2 py-1 rounded">-{commit.stats?.deletions || 0}</span>
                  <a href={commit.url} target="_blank" className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600">
                    Hash: {commit._id.substring(0, 7)}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}