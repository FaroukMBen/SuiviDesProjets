'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { CommitView } from '@/components/CommitView';

export default function CommitsPage() {
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