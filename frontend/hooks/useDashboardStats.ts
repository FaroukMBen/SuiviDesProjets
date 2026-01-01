'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth';

export function useDashboardStats() {
  const [stats, setStats] = useState({
    projects: 0,
    tasksLate: 0,
    toValidate: 0,
    avgScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // 1. On récupère les projets et les tâches en parallèle (plus rapide)
        const [projectsRes, tasksRes] = await Promise.all([
          api.get('/api/projects'),
          api.get('/api/tasks') // Suppose que tu as une route qui renvoie TOUTES les tâches de l'user
        ]);

        const projects = projectsRes.data.projects || [];
        console.log("aezaea", projects)
        const tasks = tasksRes.data.tasks || [];

        // 2. Calculs (Logique métier)
        
        // Projets en cours (ceux qui ne sont pas archivés ou terminés)
        const activeProjects = projects.filter((p: any) => p.status !== 'completed' && p.status !== 'archived').length;

        // Tâches en retard (Date passée ET statut pas "Fait")
        const now = new Date();
        const lateTasks = tasks.filter((t: any) => {
          return t.dueDate && new Date(t.dueDate) < now && t.status !== 'done';
        }).length;
        // Livrables à valider (Logique fictive ici, à adapter selon ton Back)
        // Ex: on compte les projets où l'user est prof et qui ont des fichiers récents
        const deliverables = 0; // À connecter à ton backend si possible

        // Moyenne (Si tu as une route pour les notes, sinon 0)
        const avg = 14.5; // Placeholder ou calcul réel

        setStats({
          projects: activeProjects,
          tasksLate: lateTasks,
          toValidate: deliverables,
          avgScore: avg
        });

      } catch (err) {
        console.error("Erreur calcul stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}