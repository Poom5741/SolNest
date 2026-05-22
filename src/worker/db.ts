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

export async function getProjectMetadata(
  db: D1Database,
  id: string,
): Promise<ProjectMetadata | null> {
  const row = await db
    .prepare("SELECT * FROM project_metadata WHERE id = ?")
    .bind(id)
    .first<ProjectMetadata>();
  return row ?? null;
}

export async function upsertProjectMetadata(
  db: D1Database,
  meta: ProjectMetadata,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO project_metadata (id, name, location, description, image_url, installer_name, installed_capacity)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         location = excluded.location,
         description = excluded.description,
         image_url = excluded.image_url,
         installer_name = excluded.installer_name,
         installed_capacity = excluded.installed_capacity`,
    )
    .bind(
      meta.id,
      meta.name,
      meta.location,
      meta.description,
      meta.image_url,
      meta.installer_name,
      meta.installed_capacity,
    )
    .run();
}

export async function getRiskAssessment(
  db: D1Database,
  projectId: string,
): Promise<RiskAssessment | null> {
  const row = await db
    .prepare("SELECT * FROM risk_assessments WHERE project_id = ?")
    .bind(projectId)
    .first<RiskAssessment>();
  return row ?? null;
}

export async function getTelemetry(
  db: D1Database,
  projectId: string,
  periodType: "daily" | "weekly" | "monthly",
): Promise<TelemetryRecord[]> {
  const rows = await db
    .prepare(
      "SELECT * FROM energy_telemetry WHERE project_id = ? AND period_type = ? ORDER BY recorded_at ASC",
    )
    .bind(projectId, periodType)
    .all<TelemetryRecord>();
  return rows.results ?? [];
}

export async function insertTelemetry(
  db: D1Database,
  record: Omit<TelemetryRecord, "id">,
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO energy_telemetry (project_id, recorded_at, kwh, period_type, metadata) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(
      record.project_id,
      record.recorded_at,
      record.kwh,
      record.period_type,
      record.metadata,
    )
    .run();
}
