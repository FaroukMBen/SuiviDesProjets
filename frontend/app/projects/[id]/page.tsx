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
  files: Array<{
    _id: string;
    name: string;
    path: string;
    mimetype: string;
    uploadedAt: string;
  }>;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await api.post(`/api/projects/${projectId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setProject(response.data.project);
      // Reset input
      e.target.value = '';
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
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

            <div className="bg-white p-6 rounded-lg border border-[--color-border] md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[--color-foreground]">Documents</h3>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.txt,.doc,.docx"
                    className="hidden"
                    id="file-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all transform hover:scale-105 cursor-pointer font-bold flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {uploading ? 'Uploading...' : 'Upload Data'}
                  </label>
                </div>
              </div>

              {project.files && project.files.length > 0 ? (
                <div className="space-y-2">
                  {project.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[--color-surface] rounded border border-[--color-border]">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-[--color-muted]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-[--color-foreground]">{file.name}</p>
                          <p className="text-xs text-[--color-muted]">
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <a
                          href={`http://localhost:5000/${file.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[--color-primary] hover:underline"
                        >
                          Download
                        </a>
                        <button
                          onClick={async () => {
                            if (!confirm('Are you sure you want to delete this file?')) return;
                            try {
                              const response = await api.delete(`/api/projects/${projectId}/files/${file._id}`);
                              setProject(response.data.project);
                            } catch (err: any) {
                              alert(err.response?.data?.message || 'Failed to delete file');
                            }
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete file"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[--color-muted] italic">No documents uploaded yet.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
