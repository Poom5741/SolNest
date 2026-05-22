const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

export interface ProjectMetadata {
  id: string;
  name: string;
  location: string;
  description: string;
  image_url: string;
  installer_name: string;
  installed_capacity: number;
  created_at: string;
}

export interface RiskAssessment {
  project_id: string;
  risk_score: number;
  location_risk: number;
  installer_risk: number;
  energy_estimate_risk: number;
  assessment_notes: string;
  last_updated: string;
}

export interface TelemetryRecord {
  id: number;
  project_id: string;
  recorded_at: string;
  kwh: number;
  period_type: "daily" | "weekly" | "monthly";
  metadata: string;
}

export interface TelemetryResponse {
  daily: TelemetryRecord[];
  weekly: TelemetryRecord[];
  monthly: TelemetryRecord[];
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function getProjectMetadata(id: string): Promise<ProjectMetadata> {
  return fetchApi(`/api/projects/${id}/metadata`);
}

export function updateProjectMetadata(
  id: string,
  data: Partial<ProjectMetadata>,
): Promise<{ success: boolean }> {
  return fetchApi(`/api/projects/${id}/metadata`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function getRiskAssessment(id: string): Promise<RiskAssessment> {
  return fetchApi(`/api/projects/${id}/risk`);
}

export function getTelemetry(projectId: string): Promise<TelemetryResponse> {
  return fetchApi(`/api/telemetry/${projectId}`);
}

export async function uploadFile(file: File): Promise<{ key: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}
