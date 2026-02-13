'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/auth';
import Link from 'next/link';
import {
  FileText,
  ChevronRight,
  Award,
  Clock,
  User as UserIcon,
  Calendar
} from 'lucide-react';

interface Project {
  _id: string;
  title: string;
  description: string;
  campaign?: {
    name: string;
  };
  members: { _id: string; name: string }[];
}

interface Evaluation {
  _id: string;
  projectId: string;
  grade?: number;
  feedback?: string;
  status: 'draft' | 'published';
  criteria?: { name: string; score: number; maxScore: number }[];
  evaluator?: { _id?: string; name?: string; firstName?: string; lastName?: string };
  updatedAt: string;
}

export default function EvaluationsIndexPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Récupérer les projets
        const { data: projectData } = await api.get('/api/projects');
        const projectList = projectData.projects || [];
        setProjects(projectList);

        // 2. Pour chaque projet, récupérer TOUTES les évaluations
        const evals: Record<string, Evaluation | null> = {};

        await Promise.all(projectList.map(async (p: Project) => {
          try {
            const { data: evalData } = await api.get(`/api/evaluations/project/${p._id}`);
            const evaluationsList = evalData.evaluations || [];

            if (evaluationsList.length > 0) {
              // Calcul de la moyenne pour l'affichage résumé
              const sum = evaluationsList.reduce((acc: number, curr: any) => acc + (curr.totalScore || 0), 0);
              const avg = (sum / evaluationsList.length).toFixed(2); // Moyenne précise

              // On crée un objet "Synthèse" pour l'affichage dans la liste
              // On prend la dernière évaluation pour les détails textuels (feedback, évaluateur)
              const lastEval = evaluationsList[evaluationsList.length - 1];

              evals[p._id] = {
                ...lastEval,
                grade: parseFloat(avg), // La moyenne devient "la note" affichée
                status: 'published', // Si on a des évaluations, c'est considéré comme publié/noté
                evaluator: evaluationsList.length > 1 ? { name: 'Équipe Pédagogique' } : lastEval.evaluator
              };
            } else {
              evals[p._id] = null;
            }

          } catch (err) {
            evals[p._id] = null;
          }
        }));

        setEvaluations(evals);
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fonction utilitaire pour formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f3f4f6] flex font-sans">
        <Navbar />

        <div className="flex-1 ml-64 p-8">
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Award className="text-blue-600" />
                Mes Évaluations
              </h1>
              <p className="text-gray-500 mt-1">Consultez les notes et feedbacks de vos projets académiques.</p>
            </div>
          </header>

          {/* Stats Dashboard */}
          {!loading && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {(() => {
                const evaluatedProjects = Object.values(evaluations).filter(e => e?.status === 'published' && e?.grade !== undefined);
                const count = evaluatedProjects.length;
                const total = projects.length;
                const sumGrades = evaluatedProjects.reduce((acc, curr) => acc + (curr?.grade || 0), 0);
                const average = count > 0 ? (sumGrades / count).toFixed(1) : '-';

                return (
                  <>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Moyenne Globale</p>
                        <h3 className="text-3xl font-bold text-gray-800">{average}<span className="text-base text-gray-400 font-normal">/20</span></h3>
                      </div>
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <Award size={24} />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Projets Évalués</p>
                        <h3 className="text-3xl font-bold text-gray-800">{count} <span className="text-base text-gray-400 font-normal">/ {total}</span></h3>
                      </div>
                      <div className="p-3 bg-green-50 text-green-600 rounded-full">
                        <FileText size={24} />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">En Attente</p>
                        <h3 className="text-3xl font-bold text-gray-800">{total - count}</h3>
                      </div>
                      <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
                        <Clock size={24} />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-white rounded-2xl shadow-sm animate-pulse"></div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="bg-blue-50 p-4 rounded-full mb-4">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Aucun projet trouvé</h3>
              <p className="text-gray-500 max-w-sm mt-2">Vous n'avez pas encore de projets évaluables. Rejoignez ou créez un projet pour commencer.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.filter(p => evaluations[p._id] !== null).map((project) => {
                const evaluation = evaluations[project._id];

                // explication importante :

                // On considère "Validé" si le statut est explicitement 'completed' (ou published dans notre mapping frontend)
                // Dans le cas de plusieurs évaluations, on pourrait avoir une logique plus complexe (toutes complétées), 
                // mais ici on se base sur la présence d'une note finale calculée.
                // Pour l'instant, disons que Validé = Note présente et En Cours = Note présente mais statut 'draft' (si existait)
                // Comme on filtre ceux qui ont null, on a forcément une éval.

                // Si on veut différencier "En cours de notation" (une note) vs "Validé définitivement" (toutes notes),
                // il faudrait une info supplémentaire du backend sur le nombre attendu d'évaluateurs.
                // Pour simplifier selon ta demande : "Validé" = statut complet, sinon "En cours".


                const isValidated = evaluation?.status === 'published';

                return (
                  <div key={project._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col group">
                    <div className="p-6 flex-1 flex flex-col">
                      {/* En-tête Carte */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            {project.campaign?.name || 'Projet Libre'}
                          </span>
                          {/* Membres (Avatars) */}
                          <div className="flex -space-x-2">
                            {project.members && project.members.slice(0, 3).map((m: any, idx: number) => {
                              const mName = m.firstName || m.lastName ? `${m.firstName || ''} ${m.lastName || ''}`.trim() : (m.name || 'U');
                              return (
                                <div key={idx} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold text-gray-600 uppercase" title={mName}>
                                  {mName.charAt(0)}
                                </div>
                              );
                            })}
                            {project.members && project.members.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-500">
                                +{project.members.length - 3}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className={`flex items-center gap-1 font-bold ${isValidated ? 'text-green-600' : 'text-orange-500'}`}>
                            <span className="text-2xl font-extrabold">{evaluation?.grade}</span>
                            <span className="text-sm opacity-70 font-medium">/ 20</span>
                          </div>
                          {isValidated ? (
                            <span className="text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full uppercase">Validé</span>
                          ) : (
                            <span className="text-[10px] text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                              <Clock size={10} /> En cours
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-800 mb-2 truncate group-hover:text-blue-600 transition" title={project.title}>
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                        {project.description || 'Aucune description disponible.'}
                      </p>

                      <div className="mt-auto pt-4 border-t border-gray-100">
                        <div className="space-y-3 animation-fade-in">
                          {/* Résumé Note & Évaluateur */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <UserIcon size={14} className="text-gray-400" />
                              <span className="font-semibold text-gray-700">
                                {evaluation?.evaluator?.firstName || evaluation?.evaluator?.lastName
                                  ? `${evaluation.evaluator.firstName || ''} ${evaluation.evaluator.lastName || ''}`.trim()
                                  : (evaluation?.evaluator?.name || 'Enseignant')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} className="text-gray-400" />
                              <span>{formatDate(evaluation!.updatedAt)}</span>
                            </div>
                          </div>

                          {/* Feedback Rapide */}
                          {evaluation?.feedback && (
                            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 italic border-l-2 border-blue-400">
                              "{evaluation.feedback.length > 80 ? evaluation.feedback.substring(0, 80) + '...' : evaluation.feedback}"
                            </div>
                          )}

                          {/* Critères Top */}
                          {evaluation?.criteria && evaluation.criteria.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {evaluation.criteria.slice(0, 3).map((crit, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-600 font-medium">
                                  {crit.name}: <b className="text-gray-800">{crit.score}/{crit.maxScore}</b>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/projects/${project._id}/evaluations`}
                      className="p-3 text-center text-sm font-bold border-t transition flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100"
                    >
                      Consulter le détail de la note
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
