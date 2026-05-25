'use client';

import { useParams } from 'next/navigation';
import CalendarView from '@/components/CalendarView';

export default function CalendarPage() {
    const params = useParams();
    const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

    return <CalendarView projectId={projectId} />;
}
