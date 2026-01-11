'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth';

export function useDashboardStats() {
  const [stats, setStats] = useState({
    projects: 0,
    tasksLate: 0,
    toValidate: 0,
    progress: 0,        // Nouveau : Pourcentage global
    completedTasks: 0,  // Nouveau : Nombre de tâches finies
    totalTasks: 0       // Nouveau : Nombre total de tâches
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const [projectsRes, tasksRes] = await Promise.all([
          api.get('/api/projects'),
          api.get('/api/tasks')
        ]);

        const projects = projectsRes.data.projects || [];
        const tasks = tasksRes.data.tasks || [];

        // 1. Calculs existants
        const activeProjects = projects.filter((p: any) => p.status !== 'completed' && p.status !== 'archived').length;

        const now = new Date();
        const lateTasks = tasks.filter((t: any) => {
          return t.dueDate && new Date(t.dueDate) < now && t.status !== 'done';
        }).length;

        const liverables = 0; // À connecter plus tard

        // 2. NOUVEAU : Calcul de la progression
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t: any) => t.status === 'done').length;

        // Évite la division par 0
        const progressPercentage = totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0;

        setStats({
          projects: activeProjects,
          tasksLate: lateTasks,
          toValidate: liverables,
          progress: progressPercentage,
          completedTasks,
          totalTasks
        });

      } catch (err) {
        console.error("Erreur stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}