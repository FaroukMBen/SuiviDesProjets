'use client';

import { useParams } from 'next/navigation';
import { CommitView } from '@/components/CommitView';

export default function CommitsPage() {
  const params = useParams();
  // Sécurisation du type string
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="space-y-6">
      <CommitView projectId={projectId} />
    </div>
  );
}