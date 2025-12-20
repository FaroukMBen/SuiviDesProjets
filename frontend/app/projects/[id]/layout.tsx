'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProjectHeader } from '@/components/project/ProjectHeader'; // Import du header
import { Navbar } from '@/components/Navbar';
import api from '@/lib/auth';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // On récupère juste les infos nécessaires pour le header
  useEffect(() => {
    const fetchHeaderInfo = async () => {
      try {
        const response = await api.get(`/api/projects/${params.id}`);
        setProject(response.data.project);
      } catch (error) {
        console.error("Erreur chargement projet", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHeaderInfo();
  }, [params.id]);

  if (loading) return null; // Ou un skeleton loader
  if (!project) return <div>Projet introuvable</div>;

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
      {/* Sidebar globale */}
      <Navbar />

      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Header spécifique au projet (Titre + Tabs) */}
        <ProjectHeader project={project} />

        {/* Contenu de la page (Aperçu, Kanban, Git...) */}
        <main className="p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}