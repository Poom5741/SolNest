import { useState, useCallback } from "react";
import type { Project, ProjectStatus } from "../../types";
import { mockProjects } from "./mockData";

interface UseMockProjectsReturn {
  data: Project[];
  isLoading: boolean;
  error: string | null;
  mutate: () => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  addProject: (project: Project) => void;
  getProjectById: (id: string) => Project | undefined;
}

export function useMockProjects(): UseMockProjectsReturn {
  const [projects, setProjects] = useState<Project[]>(() => [...mockProjects]);
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const updateProjectStatus = useCallback((id: string, status: ProjectStatus) => {
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, status } : p))
    );
  }, []);

  const addProject = useCallback((project: Project) => {
    setProjects(prev => [project, ...prev]);
  }, []);

  const getProjectById = useCallback(
    (id: string) => projects.find(p => p.id === id),
    [projects]
  );

  const mutate = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  return { data: projects, isLoading, error, mutate, updateProjectStatus, addProject, getProjectById };
}
