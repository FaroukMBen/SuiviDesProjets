'use client';

import { useParams } from 'next/navigation';
import { KanbanBoard } from '@/components/KanbanBoard';

export default function KanbanPage() {
    const params = useParams();
    const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

    return (
        <div className="h-full">
            <KanbanBoard projectId={projectId} />
        </div>
    );
}
