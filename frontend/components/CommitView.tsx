'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/auth';
import { useAuthStore, useThemeStore } from '@/lib/store';
import {
  GitCommit,
  TrendingUp,
  TrendingDown,
  Users,
  GitPullRequest,
  GitBranch,
  Calendar,
  X,
  FileText,
  ExternalLink,
  Filter,
  AlertTriangle,
  Info,
  ShieldCheck,
  ShieldX,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface CommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
}

interface Commit {
  _id: string;
  githubCommitId: string;
  message: string;
  description: string;
  githubAuthor: {
    login: string;
    avatarUrl: string | null;
    name: string;
  };
  url: string;
  verified: boolean;
  timestamp: string;
  branch: string;
  branches: string[];
  filesChanged: number;
  insertions: number;
  deletions: number;
  files: CommitFile[];
}

type TimeFilter = 'week' | 'month' | 'all';

export function CommitView({
  projectId,
  initialTab = 'stats',
  autoSync = false
}: {
  projectId: string;
  initialTab?: 'history' | 'stats';
  autoSync?: boolean;
}) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'stats'>(initialTab);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [branches, setBranches] = useState<string[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set(['main']));
  const [allBranchesMode, setAllBranchesMode] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedAuthors, setSelectedAuthors] = useState<Set<string>>(new Set());
  const [allAuthorsMode, setAllAuthorsMode] = useState(true);
  const COMMITS_PER_PAGE = 20;
  useEffect(() => {
    fetchProjectAndCommits();
  }, [projectId]);

  const fetchProjectAndCommits = async () => {
    try {
      setLoading(true);
      const [projRes, commitRes] = await Promise.all([
        api.get(`/api/projects/${projectId}`),
        api.get(`/api/commits/project/${projectId}?limit=all`)
      ]);
      setRepoUrl(projRes.data.project?.repositoryUrl || null);
      setCommits(commitRes.data.commits || []);

      // Extraire les branches uniques des commits (depuis branches[] et branch)
      const allBranches = new Set<string>();
      (commitRes.data.commits || []).forEach((c: Commit) => {
        if (c.branches && c.branches.length > 0) {
          c.branches.forEach((b: string) => allBranches.add(b));
        } else if (c.branch) {
          allBranches.add(c.branch);
        }
      });
      const uniqueBranches = Array.from(allBranches);
      setBranches(uniqueBranches as string[]);
    } catch (err) {
      console.error("Erreur fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger autoSync if requested
  useEffect(() => {
    if (autoSync && repoUrl && !isSyncing) {
      handleSync();
    }
  }, [autoSync, repoUrl]);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncProgress(0);
      setSyncStatus('Connexion au serveur...');

      const token = localStorage.getItem('token');
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/api/commits/sync-progress/${projectId}?token=${token}`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.error) {
          showToast(data.error, 'error');
          eventSource.close();
          setIsSyncing(false);
          return;
        }

        if (data.progress !== undefined) {
          setSyncProgress(data.progress);
        }

        if (data.status) {
          setSyncStatus(data.status);
        }

        if (data.complete) {
          eventSource.close();
          setTimeout(async () => {
            await fetchProjectAndCommits();
            setIsSyncing(false);
            setSyncProgress(0);
            setSyncStatus('');
          }, 1000);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        showToast('Erreur de connexion au serveur.', 'error');
        setIsSyncing(false);
        setSyncProgress(0);
        setSyncStatus('');
      };

    } catch (err) {
      console.error("Erreur sync", err);
      showToast('Erreur lors de la synchronisation.', 'error');
      setIsSyncing(false);
      setSyncProgress(0);
      setSyncStatus('');
    }
  };

  const handleLinkRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    try {
      setLoading(true);
      await api.put(`/api/projects/${projectId}`, { repositoryUrl: linkUrl });
      setRepoUrl(linkUrl);
      await api.post(`/api/commits/sync/${projectId}`);
      await fetchProjectAndCommits();
    } catch (err) {
      console.error("Erreur link repo", err);
      showToast('Erreur lors de la liaison du dépôt.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkRepo = async () => {
    const ok = await confirm({
      title: 'Dissocier le dépôt GitHub',
      message: 'Voulez-vous vraiment dissocier ce dépôt GitHub ? Les commits synchronisés seront conservés.',
      confirmText: 'Dissocier',
      cancelText: 'Annuler',
      type: 'danger'
    });
    if (!ok) return;
    try {
      setLoading(true);
      await api.delete(`/api/projects/${projectId}/github`);
      setRepoUrl(null);
      showToast('Dépôt GitHub dissocié avec succès.', 'success');
    } catch (err) {
      console.error("Erreur unlink repo", err);
      showToast('Erreur lors de la dissociation du dépôt.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Extraire les auteurs uniques
  const uniqueAuthors = Array.from(
    new Map(commits.map(c => [c.githubAuthor?.login, c.githubAuthor])).values()
  ).filter(Boolean);

  // Toggle branche
  const toggleBranch = (b: string) => {
    setAllBranchesMode(false);
    setSelectedBranches(prev => {
      const next = new Set(prev);
      if (next.has(b)) {
        next.delete(b);
        if (next.size === 0) {
          setAllBranchesMode(true);
          return new Set();
        }
      } else {
        next.add(b);
      }
      return next;
    });
  };

  // Toggle auteur
  const toggleAuthor = (login: string) => {
    setAllAuthorsMode(false);
    setSelectedAuthors(prev => {
      const next = new Set(prev);
      if (next.has(login)) {
        next.delete(login);
        if (next.size === 0) setAllAuthorsMode(true);
      } else {
        next.add(login);
      }
      return next;
    });
  };

  // Sélectionner toutes les branches
  const selectAllBranches = () => {
    setAllBranchesMode(true);
    setSelectedBranches(new Set());
  };

  // Sélectionner tous les auteurs
  const selectAllAuthors = () => {
    setAllAuthorsMode(true);
    setSelectedAuthors(new Set());
  };

  // --- Filtrage par période, branche et auteur ---
  const getFilteredCommits = () => {
    let filtered = commits;

    // Filtre temporel
    if (timeFilter !== 'all') {
      const now = new Date();
      const limit = new Date();
      if (timeFilter === 'week') limit.setDate(now.getDate() - 7);
      if (timeFilter === 'month') limit.setMonth(now.getMonth() - 1);
      filtered = filtered.filter(c => new Date(c.timestamp) >= limit);
    }

    // Filtre par branches (multi-select)
    if (!allBranchesMode && selectedBranches.size > 0) {
      filtered = filtered.filter(c => {
        const commitBranches = c.branches && c.branches.length > 0 ? c.branches : [c.branch].filter(Boolean);
        return commitBranches.some(b => selectedBranches.has(b));
      });
    }

    // Filtre par auteur
    if (!allAuthorsMode && selectedAuthors.size > 0) {
      filtered = filtered.filter(c => selectedAuthors.has(c.githubAuthor?.login || ''));
    }

    // Tri
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };

  // Reset page quand un filtre change
  useEffect(() => {
    setHistoryPage(1);
  }, [timeFilter, allBranchesMode, selectedBranches, sortOrder, allAuthorsMode, selectedAuthors]);

  const filteredCommits = getFilteredCommits();

  // Pagination historique (client-side)
  const totalHistoryPages = Math.ceil(filteredCommits.length / COMMITS_PER_PAGE);
  const paginatedCommits = filteredCommits.slice(
    (historyPage - 1) * COMMITS_PER_PAGE,
    historyPage * COMMITS_PER_PAGE
  );

  // --- Calculs Stats ---
  const totalCommits = filteredCommits.length;
  const totalInsertions = filteredCommits.reduce((acc, c) => acc + (c.insertions || 0), 0);
  const totalDeletions = filteredCommits.reduce((acc, c) => acc + (c.deletions || 0), 0);

  // Commits par branche (utiliser branches[] pour compter un commit dans toutes ses branches)
  const commitsByBranch = filteredCommits.reduce((acc: Record<string, number>, c) => {
    const branchList = c.branches && c.branches.length > 0 ? c.branches : [c.branch || 'main'];
    for (const b of branchList) {
      acc[b] = (acc[b] || 0) + 1;
    }
    return acc;
  }, {});

  // Contributeurs avec vrais usernames GitHub
  const contributors = Object.values(filteredCommits.reduce((acc: any, commit) => {
    const login = commit.githubAuthor?.login || 'unknown';
    if (!acc[login]) {
      acc[login] = {
        login,
        name: commit.githubAuthor?.name || login,
        avatarUrl: commit.githubAuthor?.avatarUrl,
        commits: 0,
        insertions: 0,
        deletions: 0
      };
    }
    acc[login].commits += 1;
    acc[login].insertions += (commit.insertions || 0);
    acc[login].deletions += (commit.deletions || 0);
    return acc;
  }, {})).map((c: any) => ({
    ...c,
    totalChanges: c.insertions + c.deletions,
    percentage: totalCommits > 0 ? Math.round((c.commits / totalCommits) * 100) : 0
  })).sort((a: any, b: any) => b.commits - a.commits);

  const filterLabels: Record<TimeFilter, string> = {
    week: 'Cette semaine',
    month: 'Ce mois',
    all: 'Depuis le début'
  };

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl"></div>;

  return (
    <div className="space-y-6">

      {/* Tabs + Sync + Filtre */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Historique
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'stats'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Statistiques
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtre temporel */}
          {repoUrl && (
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              <Filter size={14} className="text-gray-400 ml-2" />
              {(['week', 'month', 'all'] as TimeFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeFilter === f
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>
          )}

          {repoUrl && (
            <>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${isSyncing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
              >
                <GitCommit size={16} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Sync...' : 'Synchroniser'}
              </button>
              <button
                onClick={handleUnlinkRepo}
                disabled={isSyncing || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all bg-red-50 text-red-700 hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                title="Dissocier le dépôt GitHub"
              >
                <GitPullRequest size={16} />
                Dissocier
              </button>
            </>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      {isSyncing && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-blue-900">{syncStatus || 'Synchronisation en cours...'}</span>
              <span className="font-bold text-blue-700">{syncProgress}%</span>
            </div>
            <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Pas de repo lié */}
      {!repoUrl ? (
        <Card className="p-8 bg-gray-50 border-dashed border-2">
          <div className="max-w-lg mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <GitPullRequest size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lier un dépôt GitHub</h3>
              <p className="text-gray-500 mb-6">Connectez ce projet à un dépôt GitHub pour suivre les commits et les statistiques en temps réel.</p>
            </div>

            <form onSubmit={handleLinkRepo} className="flex gap-2 mb-6">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://github.com/utilisateur/repo"
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Lier le dépôt
              </button>
            </form>

            {/* Alerte dépôts privés */}
            {!user?.githubUsername && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-1">Dépôt privé ?</p>
                  <p className="text-amber-700">
                    Les dépôts privés nécessitent une connexion GitHub. Connectez votre compte dans les <strong>Paramètres</strong> pour synchroniser vos repos privés.
                  </p>
                </div>
              </div>
            )}

            {/* Connexion GitHub */}
            <div className="flex items-start gap-3 p-4 bg-gray-100 border border-gray-200 rounded-xl">
              <Info size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-800 mb-1">Connexion GitHub</p>
                {user?.githubUsername ? (
                  <p className="text-xs text-emerald-700">
                    ✅ Connecté en tant que <strong>@{user.githubUsername}</strong> — les dépôts privés sont accessibles.
                  </p>
                ) : (
                  <div>
                    <p className="text-xs text-gray-600 mb-2">
                      Connectez GitHub pour accéder aux dépôts privés et obtenir des synchronisations illimitées.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await api.get('/api/github/connect-url');
                          if (res.data.url) window.location.href = res.data.url;
                        } catch (err: any) {
                          showToast(err.response?.data?.message || 'GitHub OAuth non configuré.', 'error');
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                      Connecter avec GitHub
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ) : activeTab === 'stats' ? (
        /* ============ VUE STATISTIQUES ============ */
        <div className="space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><GitCommit size={24} /></div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Commits</p>
                <p className="text-2xl font-bold text-gray-900">{totalCommits}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={24} /></div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Lignes ajoutées</p>
                <p className="text-2xl font-bold text-emerald-600">+{totalInsertions.toLocaleString()}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-500 rounded-xl"><TrendingDown size={24} /></div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Lignes supprimées</p>
                <p className="text-2xl font-bold text-red-500">-{totalDeletions.toLocaleString()}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Users size={24} /></div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase">Contributeurs</p>
                <p className="text-2xl font-bold text-gray-900">{contributors.length}</p>
              </div>
            </Card>
          </div>

          {/* Branches + Contributeurs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Commits par branche */}
            <Card className="lg:col-span-1 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GitBranch size={18} className="text-gray-400" />
                Branches
              </h3>
              <div className="space-y-3">
                {Object.entries(commitsByBranch)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([branch, count]) => {
                    const pct = totalCommits > 0 ? Math.round(((count as number) / totalCommits) * 100) : 0;
                    return (
                      <div key={branch}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 truncate">{branch}</span>
                          <span className="text-gray-500 font-mono text-xs">{count as number} commits</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                {Object.keys(commitsByBranch).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Aucune donnée</p>
                )}
              </div>
            </Card>

            {/* Détail par contributeur */}
            <Card className="lg:col-span-2 overflow-hidden !p-0">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Détail par contributeur</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3">Contributeur</th>
                      <th className="px-6 py-3 text-center">Commits</th>
                      <th className="px-6 py-3 text-center text-emerald-600">Ajouts</th>
                      <th className="px-6 py-3 text-center text-red-500">Suppr.</th>
                      <th className="px-6 py-3 text-right">Part</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {contributors.map((c: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-3 font-medium text-gray-900">
                          <div className="flex items-center gap-3">
                            {c.avatarUrl ? (
                              <img src={c.avatarUrl} alt={c.login} className="w-7 h-7 rounded-full" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                {c.login[0]?.toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold">{c.name}</p>
                              <p className="text-xs text-gray-400">@{c.login}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center font-medium">{c.commits}</td>
                        <td className="px-6 py-3 text-center font-medium text-emerald-600">+{c.insertions.toLocaleString()}</td>
                        <td className="px-6 py-3 text-center font-medium text-red-500">-{c.deletions.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {c.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {contributors.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                          Synchronisez le dépôt pour voir les contributeurs.
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
        /* ============ VUE HISTORIQUE ============ */
        <div className="space-y-3">
          {/* Barre de filtres */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            {/* Ligne 1 : Branches */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Branches</span>
              <button
                onClick={selectAllBranches}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${allBranchesMode
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Toutes
              </button>
              {branches.map(b => {
                const count = commits.filter(c =>
                  (c.branches && c.branches.length > 0) ? c.branches.includes(b) : c.branch === b
                ).length;
                const isActive = !allBranchesMode && selectedBranches.has(b);
                return (
                  <button
                    key={b}
                    onClick={() => toggleBranch(b)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                      }`}
                  >
                    <GitBranch size={12} /> {b} ({count})
                  </button>
                );
              })}
            </div>

            {/* Ligne 2 : Auteurs */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Auteurs</span>
              <button
                onClick={selectAllAuthors}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${allAuthorsMode
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                Tous
              </button>
              {uniqueAuthors.map(author => {
                if (!author) return null;
                const isActive = !allAuthorsMode && selectedAuthors.has(author.login);
                const count = commits.filter(c => c.githubAuthor?.login === author.login).length;
                return (
                  <button
                    key={author.login}
                    onClick={() => toggleAuthor(author.login)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                  >
                    {author.avatarUrl ? (
                      <img src={author.avatarUrl} alt="" className="w-4 h-4 rounded-full" />
                    ) : (
                      <Users size={12} />
                    )}
                    @{author.login} ({count})
                  </button>
                );
              })}
            </div>

            {/* Ligne 3 : Tri + infos */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ArrowUpDown size={12} />
                {sortOrder === 'desc' ? 'Plus récents d\'abord' : 'Plus anciens d\'abord'}
              </button>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>{filteredCommits.length} commit(s)</span>
                {totalHistoryPages > 1 && (
                  <span>Page {historyPage} / {totalHistoryPages}</span>
                )}
              </div>
            </div>
          </div>

          {filteredCommits.length === 0 && (
            <p className="text-center text-gray-400 py-12">Aucun commit sur cette période.</p>
          )}
          {paginatedCommits.map((commit) => (
            <div
              key={commit._id}
              onClick={() => setSelectedCommit(commit)}
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-3 min-w-0">
                  {commit.githubAuthor?.avatarUrl ? (
                    <img src={commit.githubAuthor.avatarUrl} alt="" className="w-8 h-8 rounded-full mt-0.5 flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 mt-0.5 flex-shrink-0">
                      {commit.githubAuthor?.login?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition truncate">
                      {commit.message}
                    </p>
                    {commit.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">
                        {commit.description.split('\n')[0]}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                      <span className="font-medium text-gray-700">@{commit.githubAuthor?.login}</span>
                      <span>•</span>
                      <span>{new Date(commit.timestamp).toLocaleDateString('fr-FR')} à {new Date(commit.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      {(commit.branches && commit.branches.length > 0 ? commit.branches : [commit.branch].filter(Boolean)).map(b => (
                        <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-medium">
                          <GitBranch size={10} /> {b}
                        </span>
                      ))}
                      {(commit.branches && commit.branches.length > 0 ? commit.branches : [commit.branch].filter(Boolean)).length > 0 && (
                        <span>•</span>
                      )}
                      {commit.verified && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium">
                            <ShieldCheck size={10} /> Vérifié
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono flex-shrink-0 ml-4">
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded">+{commit.insertions || 0}</span>
                  <span className="text-red-500 bg-red-50 px-2 py-1 rounded">-{commit.deletions || 0}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination controls */}
          {totalHistoryPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} /> Précédent
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalHistoryPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalHistoryPages || Math.abs(p - historyPage) <= 2)
                  .reduce((acc: (number | string)[], p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    typeof p === 'string' ? (
                      <span key={`dots-${idx}`} className="px-2 text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setHistoryPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${historyPage === p
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>
              <button
                onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                disabled={historyPage === totalHistoryPages}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============ MODAL DÉTAIL COMMIT ============ */}
      {selectedCommit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCommit(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Header modal */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-gray-900 leading-snug">{selectedCommit.message}</p>
                  {selectedCommit.verified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium flex-shrink-0">
                      <ShieldCheck size={14} /> Vérifié
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-400 rounded-lg text-xs font-medium flex-shrink-0">
                      <ShieldX size={14} /> Non vérifié
                    </span>
                  )}
                </div>
                {selectedCommit.description && (
                  <p className="text-sm text-gray-500 mt-2 whitespace-pre-line bg-gray-50 rounded-lg p-3 border border-gray-100">
                    {selectedCommit.description}
                  </p>
                )}
              </div>
              <button onClick={() => setSelectedCommit(null)} className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Infos commit */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                {selectedCommit.githubAuthor?.avatarUrl ? (
                  <img src={selectedCommit.githubAuthor.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {selectedCommit.githubAuthor?.login?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-gray-900">{selectedCommit.githubAuthor?.name}</p>
                  <p className="text-xs text-gray-500">@{selectedCommit.githubAuthor?.login}</p>
                </div>
                <div className="ml-auto text-right text-sm text-gray-500">
                  <p>{new Date(selectedCommit.timestamp).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-xs">{new Date(selectedCommit.timestamp).toLocaleTimeString('fr-FR')}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Fichiers modifiés</p>
                  <p className="text-xl font-bold text-gray-900">{selectedCommit.filesChanged || selectedCommit.files?.length || 0}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-600 mb-1">Ajouts</p>
                  <p className="text-xl font-bold text-emerald-600">+{selectedCommit.insertions || 0}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-red-500 mb-1">Suppressions</p>
                  <p className="text-xl font-bold text-red-500">-{selectedCommit.deletions || 0}</p>
                </div>
              </div>

              {/* Branche + SHA */}
              <div className="flex items-center gap-3 text-sm flex-wrap">
                {(selectedCommit.branches && selectedCommit.branches.length > 0
                  ? selectedCommit.branches
                  : [selectedCommit.branch].filter(Boolean)
                ).map(b => (
                  <span key={b} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg font-medium">
                    <GitBranch size={14} /> {b}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-mono text-xs">
                  {selectedCommit.githubCommitId?.substring(0, 7)}
                </span>
                <a
                  href={selectedCommit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition ml-auto"
                >
                  <ExternalLink size={14} /> Voir sur GitHub
                </a>
              </div>

              {/* Fichiers modifiés */}
              {selectedCommit.files && selectedCommit.files.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText size={14} className="text-gray-400" />
                    Fichiers modifiés ({selectedCommit.files.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-gray-100">
                    {selectedCommit.files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-2 text-xs hover:bg-gray-50 transition">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${file.status === 'added' ? 'bg-emerald-500'
                            : file.status === 'removed' ? 'bg-red-500'
                              : 'bg-amber-500'
                            }`} />
                          <span className="font-mono text-gray-700 truncate">{file.filename}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-emerald-600 font-medium">+{file.additions}</span>
                          <span className="text-red-500 font-medium">-{file.deletions}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}