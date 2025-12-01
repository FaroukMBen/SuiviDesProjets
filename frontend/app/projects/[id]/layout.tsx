'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.id;

  return (
    <>
      <div className="bg-white border-b border-[--color-border]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto">
            <Link
              href={`/projects/${projectId}`}
              className="px-4 py-4 border-b-2 border-transparent hover:border-[--color-primary] text-[--color-muted] hover:text-[--color-foreground] transition whitespace-nowrap"
            >
              Overview
            </Link>
            <Link
              href={`/projects/${projectId}/kanban`}
              className="px-4 py-4 border-b-2 border-transparent hover:border-[--color-primary] text-[--color-muted] hover:text-[--color-foreground] transition whitespace-nowrap"
            >
              Kanban
            </Link>
            <Link
              href={`/projects/${projectId}/evaluations`}
              className="px-4 py-4 border-b-2 border-transparent hover:border-[--color-primary] text-[--color-muted] hover:text-[--color-foreground] transition whitespace-nowrap"
            >
              Evaluations
            </Link>
            <Link
              href={`/projects/${projectId}/feedback`}
              className="px-4 py-4 border-b-2 border-transparent hover:border-[--color-primary] text-[--color-muted] hover:text-[--color-foreground] transition whitespace-nowrap"
            >
              Feedback
            </Link>
            <Link
              href={`/projects/${projectId}/commits`}
              className="px-4 py-4 border-b-2 border-transparent hover:border-[--color-primary] text-[--color-muted] hover:text-[--color-foreground] transition whitespace-nowrap"
            >
              Commits
            </Link>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
