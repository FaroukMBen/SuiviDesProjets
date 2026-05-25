'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProjectHeader } from '@/components/project/ProjectHeader'; 
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

  if (loading) return (
    <div className="min-h-screen bg-[#f3f4f6] flex">
      <Navbar />
      <div className="flex-1 ml-64 p-8 space-y-6">
        <div className="h-40 bg-white rounded-3xl animate-pulse border border-gray-100 shadow-sm" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-white rounded-3xl animate-pulse border border-gray-100 shadow-sm" />
          <div className="h-96 bg-white rounded-3xl animate-pulse border border-gray-100 shadow-sm" />
        </div>
      </div>
    </div>
  );
  if (!project) return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
      <div className="text-center p-12 bg-white rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Projet introuvable</h2>
        <p className="text-gray-500 mb-6">Le projet que vous recherchez n'existe pas ou a été supprimé.</p>
        <Link href="/dashboard" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition">
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );

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