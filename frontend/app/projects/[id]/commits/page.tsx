'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { CommitView } from '@/components/CommitView';
import { Suspense } from 'react';

function CommitsPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="space-y-6">
      <CommitView
        projectId={projectId}
        initialTab={searchParams.get('tab') as any}
        autoSync={searchParams.get('sync') === 'true'}
      />
    </div>
  );
}

export default function CommitsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-500 font-medium">Chargement des commits...</div>}>
      <CommitsPageInner />
    </Suspense>
  );
}