'use client';

import { useParams } from 'next/navigation';
import { KanbanBoard } from '@/components/KanbanBoard';

export default function KanbanPage() {
  const params = useParams();
  // Sécurisation du type pour s'assurer que c'est une string
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="h-full">
        {/* On passe le projectId au composant */}
        <KanbanBoard projectId={projectId} />
    </div>
  );
}