'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';
import api from '@/lib/auth';

interface Project {
  _id: string;
  title: string;
  description: string;
  status: string;
  owner: any;
  members: any[];
  deadline: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/projects');
      setProjects(response.data.projects);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[--color-surface]">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[--color-foreground]">Dashboard</h1>
              <p className="text-[--color-muted] mt-1">Welcome back, {user?.name}</p>
            </div>
            <Link
              href="/projects/new"
              className="px-6 py-2 bg-[--color-primary] text-white rounded-lg font-medium hover:bg-blue-600 transition"
            >
              New Project
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--color-primary]"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white p-12 rounded-lg border border-[--color-border] text-center">
              <p className="text-[--color-muted] mb-4">No projects yet</p>
              <Link
                href="/projects/new"
                className="text-[--color-primary] hover:underline font-medium"
              >
                Create your first project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link key={project._id} href={`/projects/${project._id}`}>
                  <div className="bg-white p-6 rounded-lg border border-[--color-border] hover:shadow-lg transition cursor-pointer h-full">
                    <h3 className="text-lg font-semibold text-[--color-foreground] mb-2 line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-sm text-[--color-muted] mb-4 line-clamp-2">
                      {project.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'active'
                            ? 'bg-green-50 text-green-700'
                            : project.status === 'completed'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        {project.status}
                      </span>
                      <span className="text-xs text-[--color-muted]">
                        {project.members?.length || 0} members
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
