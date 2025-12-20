'use client';

import { useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { EvaluationGrid } from '@/components/EvaluationGrid';

export default function EvaluationsPage() {
  const params = useParams();
  const { user } = useAuthStore();
  // Sécurisation du type string
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="max-w-5xl mx-auto">
       {/* Le titre est déjà dans le Header du Layout, mais on peut mettre un sous-titre ou une intro si besoin */}
       <EvaluationGrid projectId={projectId} userRole={user?.role} />
    </div>
  );
}