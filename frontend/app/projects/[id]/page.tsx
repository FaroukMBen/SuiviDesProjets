'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { ExportMenu } from '@/components/ExportMenu';
import api from '@/lib/auth';

interface Project {
  _id: string;
  title: string;
  description: string;
  status: string;
  owner: any;
  members: any[];
  deadline: string;
  repositoryUrl: string;
  tags: string[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/projects/${projectId}`);
      setProject(response.data.project);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[--color-surface]">
          <Navbar />
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[--color-primary]"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[--color-surface]">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <p className="text-[--color-muted]">Project not found</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[--color-surface]">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8 flex justify-between items-start gap-4">
            <div>
              <h1 className="text-4xl font-bold text-[--color-foreground] mb-2">{project.title}</h1>
              <p className="text-[--color-muted]">{project.description}</p>
            </div>
            <ExportMenu projectId={projectId} projectTitle={project.title} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-[--color-border]">
              <p className="text-sm text-[--color-muted] mb-1">Status</p>
              <p className="text-lg font-semibold text-[--color-foreground] capitalize">{project.status}</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[--color-border]">
              <p className="text-sm text-[--color-muted] mb-1">Members</p>
              <p className="text-lg font-semibold text-[--color-foreground]">{project.members?.length}</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[--color-border]">
              <p className="text-sm text-[--color-muted] mb-1">Deadline</p>
              <p className="text-lg font-semibold text-[--color-foreground]">
                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[--color-border]">
              <p className="text-sm text-[--color-muted] mb-1">Owner</p>
              <p className="text-lg font-semibold text-[--color-foreground]">{project.owner?.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-[--color-border]">
              <h3 className="text-lg font-semibold text-[--color-foreground] mb-4">Team Members</h3>
              <div className="space-y-2">
                {project.members?.map((member) => (
                  <div key={member._id} className="flex items-center gap-2 p-2 hover:bg-[--color-surface] rounded">
                    <div className="w-8 h-8 bg-[--color-primary] rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[--color-foreground]">{member.name}</p>
                      <p className="text-xs text-[--color-muted]">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[--color-border]">
              <h3 className="text-lg font-semibold text-[--color-foreground] mb-4">Project Info</h3>
              <div className="space-y-3">
                {project.repositoryUrl && (
                  <div>
                    <p className="text-xs text-[--color-muted] uppercase tracking-wide mb-1">Repository</p>
                    <a
                      href={project.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[--color-primary] hover:underline break-all text-sm"
                    >
                      {project.repositoryUrl}
                    </a>
                  </div>
                )}
                {project.tags?.length > 0 && (
                  <div>
                    <p className="text-xs text-[--color-muted] uppercase tracking-wide mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block px-2 py-1 bg-[--color-surface] text-[--color-foreground] rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
