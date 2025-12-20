'use client';

import { useParams } from 'next/navigation';
import { FeedbackThread } from '@/components/FeedbackThread';

export default function FeedbackPage() {
  const params = useParams();
  // Sécurisation du type string
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="max-w-4xl mx-auto">
      <FeedbackThread projectId={projectId} />
    </div>
  );
}