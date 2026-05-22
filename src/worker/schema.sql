CREATE TABLE IF NOT EXISTS project_metadata (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  installer_name TEXT NOT NULL DEFAULT '',
  installed_capacity REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS risk_assessments (
  project_id TEXT PRIMARY KEY,
  risk_score INTEGER NOT NULL DEFAULT 5,
  location_risk INTEGER NOT NULL DEFAULT 3,
  installer_risk INTEGER NOT NULL DEFAULT 3,
  energy_estimate_risk INTEGER NOT NULL DEFAULT 3,
  assessment_notes TEXT NOT NULL DEFAULT '',
  last_updated TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES project_metadata(id)
);

CREATE TABLE IF NOT EXISTS energy_telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  kwh REAL NOT NULL DEFAULT 0,
  period_type TEXT NOT NULL CHECK(period_type IN ('daily','weekly','monthly')),
  metadata TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (project_id) REFERENCES project_metadata(id)
);

CREATE INDEX IF NOT EXISTS idx_telemetry_project ON energy_telemetry(project_id, period_type, recorded_at);
