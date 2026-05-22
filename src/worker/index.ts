import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  getProjectMetadata,
  upsertProjectMetadata,
  getRiskAssessment,
  getTelemetry,
  insertTelemetry,
} from "./db";

type Bindings = {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("/*", cors());

app.get("/api/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));

app.get("/api/projects/:id/metadata", async (c) => {
  const id = c.req.param("id");
  const meta = await getProjectMetadata(c.env.DB, id);
  if (!meta) {
    return c.json(seedMetadata(id));
  }
  return c.json(meta);
});

app.put("/api/projects/:id/metadata", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    name?: string;
    location?: string;
    description?: string;
    image_url?: string;
    installer_name?: string;
    installed_capacity?: number;
  }>();

  const existing = (await getProjectMetadata(c.env.DB, id)) ?? seedMetadata(id);

  await upsertProjectMetadata(c.env.DB, {
    id,
    name: body.name ?? existing.name,
    location: body.location ?? existing.location,
    description: body.description ?? existing.description,
    image_url: body.image_url ?? existing.image_url,
    installer_name: body.installer_name ?? existing.installer_name,
    installed_capacity: body.installed_capacity ?? existing.installed_capacity,
    created_at: existing.created_at,
  });

  return c.json({ success: true });
});

app.get("/api/projects/:id/risk", async (c) => {
  const id = c.req.param("id");
  const assessment = await getRiskAssessment(c.env.DB, id);
  if (!assessment) {
    return c.json(seedRisk(id));
  }
  return c.json(assessment);
});

app.get("/api/telemetry/:projectId", async (c) => {
  const projectId = c.req.param("projectId");
  const [daily, weekly, monthly] = await Promise.all([
    getTelemetry(c.env.DB, projectId, "daily"),
    getTelemetry(c.env.DB, projectId, "weekly"),
    getTelemetry(c.env.DB, projectId, "monthly"),
  ]);
  return c.json({ daily, weekly, monthly });
});

app.post("/api/telemetry/:projectId", async (c) => {
  const projectId = c.req.param("projectId");
  const body = await c.req.json<{
    kwh: number;
    period_type: "daily" | "weekly" | "monthly";
    recorded_at?: string;
    metadata?: string;
  }>();

  await insertTelemetry(c.env.DB, {
    project_id: projectId,
    recorded_at: body.recorded_at ?? new Date().toISOString(),
    kwh: body.kwh,
    period_type: body.period_type,
    metadata: body.metadata ?? "{}",
  });

  return c.json({ success: true });
});

app.post("/api/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  const key = `uploads/${Date.now()}-${file.name}`;
  await c.env.R2_BUCKET.put(key, file);
  const publicUrl = `/api/files/${key}`;

  return c.json({ success: true, key, url: publicUrl });
});

app.get("/api/files/*", async (c) => {
  const key = c.req.path.replace("/api/files/", "");
  const obj = await c.env.R2_BUCKET.get(key);
  if (!obj) {
    return c.json({ error: "File not found" }, 404);
  }
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000",
    },
  });
});

function seedMetadata(id: string) {
  const idx = Number(id.replace("SOL-", "")) - 1;
  const names = [
    "Bangkok Solar Community",
    "Chiang Mai Solar Farm",
    "Phuket Solar Initiative",
    "Khon Kaen Solar Cooperative",
    "Rayong Industrial Solar",
  ];
  const locations = [
    "Bangkok, Thailand",
    "Chiang Mai, Thailand",
    "Phuket, Thailand",
    "Khon Kaen, Thailand",
    "Rayong, Thailand",
  ];
  const i = idx % names.length;
  return {
    id,
    name: names[i],
    location: locations[i],
    description:
      "A community-driven solar installation project bringing clean energy to local neighborhoods.",
    image_url: `/images/solar-${(i % 5) + 1}.jpg`,
    installer_name: "SolNest Certified Installers",
    installed_capacity: 50 + i * 25,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
  };
}

function seedRisk(id: string) {
  const idx = Number(id.replace("SOL-", "")) - 1;
  const scores = [3, 4, 5, 6, 7];
  const i = idx % scores.length;
  return {
    project_id: id,
    risk_score: scores[i],
    location_risk: Math.max(1, scores[i] - 1),
    installer_risk: Math.max(1, scores[i] - 1),
    energy_estimate_risk: scores[i],
    assessment_notes:
      "Standard risk assessment based on location, installer track record, and energy production estimates.",
    last_updated: new Date().toISOString(),
  };
}

export default app;
