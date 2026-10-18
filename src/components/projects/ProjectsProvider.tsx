'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Project } from '@/types';
import { listUserProjects } from '@/services/projects';
import { getDb } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { AppError } from '@/lib/errors';

interface ProjectsContextValue {
  projects: Project[];
  loading: boolean;
  error: AppError | null;
  refresh: () => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextValue>({
  projects: [],
  loading: false,
  error: null,
  refresh: async () => {},
});

export function ProjectsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setProjects([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const db = getDb();
      const list = await listUserProjects(db, user.uid);
      setProjects(list);
    } catch (err) {
      if (err instanceof AppError) {
        setError(err);
      } else {
        setError(new AppError('unknown', 'Failed to load projects'));
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
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const db = getDb();
        const list = await listUserProjects(db, user.uid);
        if (!ignore) {
          setProjects(list);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof AppError ? err : new AppError('unknown', 'Failed to load projects'));
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

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        loading,
        error,
        refresh,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects(): ProjectsContextValue {
  return useContext(ProjectsContext);
}
