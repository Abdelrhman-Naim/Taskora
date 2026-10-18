import { useState, useEffect, useCallback } from 'react';
import { Project, Task } from '@/types';
import { AppError } from '@/lib/errors';
import { loadDashboardData } from '@/lib/stats';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export interface UseDashboardDataResult {
  projects: Project[];
  tasks: Task[];
  loading: boolean;
  error: AppError | null;
  reload: () => void;
}

export function useDashboardData(): UseDashboardDataResult {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const db = getDb();
      const data = await loadDashboardData(db, user.uid);
      setProjects(data.projects);
      setTasks(data.tasks);
    } catch (err) {
      if (err instanceof AppError) {
        setError(err);
      } else {
        setError(new AppError('unknown', 'Failed to load dashboard data.'));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      await Promise.resolve();
      if (ignore) return;
      if (!user) {
        setProjects([]);
        setTasks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const db = getDb();
        const data = await loadDashboardData(db, user.uid);
        if (!ignore) {
          setProjects(data.projects);
          setTasks(data.tasks);
        }
      } catch (err) {
        if (!ignore) {
          if (err instanceof AppError) {
            setError(err);
          } else {
            setError(new AppError('unknown', 'Failed to load dashboard data.'));
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [user]);

  return {
    projects,
    tasks,
    loading,
    error,
    reload: fetchData,
  };
}
