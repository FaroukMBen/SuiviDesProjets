'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function GestionRedirectPage() {
    const router = useRouter();
    const params = useParams();
    const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

    useEffect(() => {
        router.replace(`/projects/${projectId}/gestion/kanban`);
    }, [router, projectId]);

    return (
        <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
}
