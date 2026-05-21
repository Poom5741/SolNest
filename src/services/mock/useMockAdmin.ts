import { useState, useCallback } from "react";
import type { Project, ProjectStatus, AdminProjectForm } from "../../types";

interface UseMockAdminReturn {
  createProject: (form: AdminProjectForm) => Project;
  updateStatus: (id: string, status: ProjectStatus) => void;
  isLoading: boolean;
  error: string | null;
}

let projectCounter = 8;

export function useMockAdmin(
  addProject: (project: Project) => void,
  updateProjectStatus: (id: string, status: ProjectStatus) => void
): UseMockAdminReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const createProject = useCallback(
    (form: AdminProjectForm): Project => {
      projectCounter++;
      const newProject: Project = {
        id: `SOL-${String(projectCounter).padStart(3, "0")}`,
        name: form.name,
        location: form.location,
        systemSize: form.systemSize,
        targetAmount: form.targetAmount,
        fundingProgress: 0,
        apy: form.apy,
        duration: form.duration,
        risk: form.risk,
        status: "Created",
        description: form.description,
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop",
        installerName: form.installerName,
        investorCount: 0,
        createdAt: new Date().toISOString().split("T")[0],
      };
      addProject(newProject);
      return newProject;
    },
    [addProject]
  );

  const updateStatus = useCallback(
    (id: string, status: ProjectStatus) => {
      setIsLoading(true);
      updateProjectStatus(id, status);
      setTimeout(() => setIsLoading(false), 500);
    },
    [updateProjectStatus]
  );

  return { createProject, updateStatus, isLoading, error };
}
