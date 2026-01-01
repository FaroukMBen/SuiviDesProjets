'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/auth'; // Ton instance axios configurée
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Clock, ArrowRight } from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  status: string;
  updatedAt: string; // La date de modif pour le tri
  owner: { name: string };
  tags?: string[];
}

export function RecentProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On appelle la route GET /api/projects
    // Grâce à ton backend, elle renvoie déjà les "Bons" projets triés
    const fetchProjects = async () => {
      try {
        const response = await api.get('/api/projects');
        // On prend juste les 3 premiers si le back ne limite pas déjà
        setProjects(response.data.projects.slice(0, 3)); 
        console.log(response)
      } catch (err) {
        console.error("Erreur chargement projets", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500">Vous ne faites partie d'aucun projet pour le moment.</p>
        <Link href="/projects/new" className="text-blue-600 font-medium hover:underline mt-2 inline-block">
          Créer un nouveau projet
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 m-5">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-lg font-bold text-gray-900">Projets récents</h2>
        <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
          Voir tout <ArrowRight size={14} />
        </Link>
      </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {projects.map((project) => (
        <Link key={project._id} href={`/projects/${project._id}`} className="block group">
        <Card className="h-full hover:shadow-md hover:border-blue-200 transition-all cursor-pointer relative flex flex-col">
            {/* Indicateur visuel d'activité récente */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>

            <div className="mb-4">
            <div className="flex gap-2 mb-3">
                <Badge variant="blue">{project.tags?.[0] || 'Projet'}</Badge>
            </div>
            
            <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-1">
                {project.title}
            </h3>
            
            <p className="text-xs text-gray-500 mt-1">
                Par {project.owner?.name}
            </p>
            </div>

            {/* Footer avec Date à gauche et Git à droite */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock size={12} />
                <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>

            {project.repositoryUrl && (
                <a 
                href={project.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()} // Empêche d'ouvrir le projet quand on clique sur Git
                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 z-10 relative"
                >
                Lien Git <span>→</span>
                </a>
            )}
            </div>
        </Card>
        </Link>
    ))}
    </div>
    </div>
  );
}