'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth';
import Link from 'next/link';
import {
    Github,
    Settings,
    ExternalLink,
    RefreshCw,
    FolderGit2,
    GitBranch,
    Search,
    ChevronRight,
    ArrowRight
} from 'lucide-react';

interface ProjectRepo {
    _id: string;
    title: string;
    repositoryUrl: string;
    updatedAt: string;
}

export function GitActivity() {
    const [repos, setRepos] = useState<ProjectRepo[]>([]);
    const [totalRepos, setTotalRepos] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRepos = async () => {
            try {
                const res = await api.get('/api/projects');
                const projects = res.data.projects || [];
                const connected = projects.filter((p: any) => p.repositoryUrl);
                setTotalRepos(connected.length);

                const sorted = connected
                    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, 3);
                setRepos(sorted);
            } catch (err) {
                console.error("Erreur dépôts:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRepos();
    }, []);

    if (loading) return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm animate-pulse">
            <div className="h-6 w-48 bg-gray-100 rounded mb-6"></div>
            <div className="space-y-4">
                {[1, 2].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl"></div>)}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
            {/* Header Harmonisé */}
            <div className="px-8 pt-8 pb-4 flex items-end justify-between">
                <div>
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <Github size={20} className="text-gray-900" />
                        GitHub
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter mt-1">
                        {totalRepos} dépôts connectés
                    </p>
                </div>
                <Link
                    href="/projects"
                    className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest transition-all group"
                >
                    Voir tout
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            {/* List even more compact */}
            <div className="px-6 pb-4 pt-0">
                <div className="divide-y divide-gray-50">
                    {repos.map((repo) => (
                        <div key={repo._id} className="group py-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <FolderGit2 size={16} className="text-gray-300 shrink-0" />
                                <div className="min-w-0">
                                    <h4 className="text-base font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate tracking-tight">
                                        {repo.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 font-mono truncate max-w-[200px] opacity-70">
                                        {repo.repositoryUrl.replace('https://github.com/', '')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link
                                    href={`/projects/${repo._id}/commits`}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                                >
                                    <RefreshCw size={14} />
                                </Link>
                                <a
                                    href={repo.repositoryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {repos.length === 0 && (
                    <div className="py-8 text-center">
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-tighter">Aucun dépôt</p>
                    </div>
                )}
            </div>
        </div>
    );
}
