'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/auth';

export function useDashboardStats() {
  const [stats, setStats] = useState({
    activeProjects: 0,
    myTasks: 0,
    upcomingDeadlines: 0,

    nextCheckpoint: null as { title: string, date: string } | null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const response = await api.get('/api/dashboard/stats');

        if (response.data && response.data.success) {
          setStats(response.data.stats);
        }
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