'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl font-bold text-[--color-foreground] text-balance">
            Manage University Projects with Nexus
          </h1>
          
          <p className="text-xl text-[--color-muted] max-w-2xl mx-auto text-balance">
            A comprehensive platform for managing student projects with Kanban boards, evaluations, GitHub integration, and collaborative feedback.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-[--color-primary] text-white rounded-lg font-medium hover:bg-blue-600 transition"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 border border-[--color-border] text-[--color-foreground] rounded-lg font-medium hover:bg-[--color-surface] transition"
            >
              Login
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-[--color-border]">
              <h3 className="text-lg font-semibold text-[--color-foreground] mb-2">Project Management</h3>
              <p className="text-[--color-muted]">Create, organize, and manage multiple projects with team members</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-[--color-border]">
              <h3 className="text-lg font-semibold text-[--color-foreground] mb-2">Kanban Board</h3>
              <p className="text-[--color-muted]">Visual task management with drag-and-drop functionality</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-[--color-border]">
              <h3 className="text-lg font-semibold text-[--color-foreground] mb-2">Evaluations</h3>
              <p className="text-[--color-muted]">Create weighted scoring rubrics and evaluate projects</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
