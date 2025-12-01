'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/auth';

interface Commit {
  _id: string;
  message: string;
  author: any;
  url: string;
  timestamp: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export function CommitView({ projectId }: { projectId: string }) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncForm, setSyncForm] = useState({ owner: '', repo: '' });

  useEffect(() => {
    fetchCommits();
    fetchStats();
  }, [projectId]);

  const fetchCommits = async () => {
    try {
      const response = await api.get(`/api/commits/project/${projectId}`);
      setCommits(response.data.commits);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch commits');
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/commits/project/${projectId}/stats`);
      setStats(response.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const syncGitHubCommits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncForm.owner || !syncForm.repo) return;

    try {
      setSyncing(true);
      const response = await api.post(`/api/commits/sync/${projectId}`, syncForm);
      setCommits([...response.data.commits, ...commits]);
      setSyncForm({ owner: '', repo: '' });
      await fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync commits');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--color-primary]"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-[--color-border]">
            <p className="text-sm text-[--color-muted] mb-1">Total Commits</p>
            <p className="text-2xl font-bold text-[--color-foreground]">{stats.totalCommits}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[--color-border]">
            <p className="text-sm text-[--color-muted] mb-1">Files Changed</p>
            <p className="text-2xl font-bold text-[--color-foreground]">{stats.totalFilesChanged}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[--color-border]">
            <p className="text-sm text-[--color-muted] mb-1">Insertions</p>
            <p className="text-2xl font-bold text-green-600">+{stats.totalInsertions}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-[--color-border]">
            <p className="text-sm text-[--color-muted] mb-1">Deletions</p>
            <p className="text-2xl font-bold text-red-600">-{stats.totalDeletions}</p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-[--color-border]">
        <h3 className="text-lg font-semibold text-[--color-foreground] mb-4">Sync from GitHub</h3>
        <form onSubmit={syncGitHubCommits} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Repository owner"
              value={syncForm.owner}
              onChange={(e) => setSyncForm({ ...syncForm, owner: e.target.value })}
              className="px-4 py-2 border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
            />
            <input
              type="text"
              placeholder="Repository name"
              value={syncForm.repo}
              onChange={(e) => setSyncForm({ ...syncForm, repo: e.target.value })}
              className="px-4 py-2 border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]"
            />
          </div>
          <button
            type="submit"
            disabled={syncing}
            className="px-6 py-2 bg-[--color-primary] text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync Commits'}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {commits.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-[--color-border] text-center">
            <p className="text-[--color-muted]">No commits yet</p>
          </div>
        ) : (
          commits.map((commit) => (
            <div key={commit._id} className="bg-white p-4 rounded-lg border border-[--color-border] hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <a
                    href={commit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[--color-primary] hover:underline"
                  >
                    {commit.message.split('\n')[0]}
                  </a>
                  <p className="text-sm text-[--color-muted] mt-1">
                    by {commit.author?.name} • {new Date(commit.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="text-[--color-muted]">{commit.filesChanged} files</span>
                <span className="text-green-600">+{commit.insertions}</span>
                <span className="text-red-600">-{commit.deletions}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
