'use client';

import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { FeedbackThread } from '@/components/FeedbackThread';

export default function FeedbackPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[--color-surface]">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[--color-foreground]">Project Feedback</h1>
            <p className="text-[--color-muted] mt-1">Collaborate with your team through threaded discussions</p>
          </div>

          <FeedbackThread projectId={projectId} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
