'use client';

import { useParams } from 'next/navigation';
import { GanttBoard } from '@/components/GanttBoard';

export default function GanttPage() {
    const params = useParams();
    const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

    return (
        <div className="h-full">
            <GanttBoard projectId={projectId} />
        </div>
    );
}
