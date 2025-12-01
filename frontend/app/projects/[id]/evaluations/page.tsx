'use client';

import { useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { EvaluationGrid } from '@/components/EvaluationGrid';

export default function EvaluationsPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const projectId = params.id as string;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[--color-surface]">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[--color-foreground]">Project Evaluations</h1>
            <p className="text-[--color-muted] mt-1">
              {user?.role === 'instructor' || user?.role === 'admin'
                ? 'Create and manage project evaluations'
                : 'View project evaluations'}
            </p>
          </div>

          <EvaluationGrid projectId={projectId} userRole={user?.role} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
