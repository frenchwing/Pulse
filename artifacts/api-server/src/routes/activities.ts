import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, activitiesTable } from "@workspace/db";

const router = Router();

router.get("/activities", async (req, res) => {
  const { type, status, skillLevel, genderPref, activityKind } = req.query as Record<string, string>;
  const rows = await db.select().from(activitiesTable)
    .where(sql`
      ${type ? sql`${activitiesTable.type} = ${type}` : sql`TRUE`}
      AND ${status ? sql`${activitiesTable.status} = ${status}` : sql`TRUE`}
      AND ${skillLevel ? sql`${activitiesTable.skillLevel} = ${skillLevel}` : sql`TRUE`}
      AND ${genderPref ? sql`${activitiesTable.genderPref} = ${genderPref}` : sql`TRUE`}
      AND ${activityKind ? sql`${activitiesTable.activityKind} = ${activityKind}` : sql`TRUE`}
    `)
    .orderBy(sql`${activitiesTable.createdAt} DESC`);
  res.json(rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt?.toISOString() ?? null,
  })));
});

router.post("/activities", async (req, res) => {
  const body = req.body;
  if (!body.title || !body.address || !body.latitude || !body.longitude || !body.date || !body.time || !body.maxPlayers || !body.hostName) {
    res.status(400).json({ error: "Missing required fields" }); return;
  }
  const venueFee = body.venueFee ?? null;
  const maxPlayers = Number(body.maxPlayers);
  const estimatedCostPerPerson = body.estimatedCostPerPerson ?? (venueFee ? Math.round(venueFee / maxPlayers) : null);
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  const [row] = await db.insert(activitiesTable).values({
    title: body.title, type: body.type ?? "other", activityKind: body.activityKind ?? "sport",
    description: body.description ?? null, address: body.address, venue: body.venue ?? null,
    latitude: body.latitude, longitude: body.longitude, date: body.date, time: body.time,
    expiresAt, maxPlayers, currentPlayers: 1, skillLevel: body.skillLevel ?? null,
    genderPref: body.genderPref ?? "any", venueFee, estimatedCostPerPerson,
    hostName: body.hostName, hostAvatar: body.hostAvatar ?? null,
    hostReliabilityScore: body.hostReliabilityScore ?? 75, isHostOnline: false,
    crewId: body.crewId ?? null, note: body.note ?? null, visibility: body.visibility ?? "public",
    status: "open",
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString(), expiresAt: row.expiresAt?.toISOString() ?? null });
});

router.get("/activities/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select().from(activitiesTable).where(eq(activitiesTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString(), expiresAt: row.expiresAt?.toISOString() ?? null });
});

router.patch("/activities/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const allowed = ["title","description","date","time","maxPlayers","skillLevel","genderPref","venueFee","estimatedCostPerPerson","status","note","isHostOnline","visibility"];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) { if (req.body[k] !== undefined) patch[k] = req.body[k]; }
  const [row] = await db.update(activitiesTable).set(patch).where(eq(activitiesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString(), expiresAt: row.expiresAt?.toISOString() ?? null });
});

router.delete("/activities/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(activitiesTable).where(eq(activitiesTable.id, id));
  res.status(204).send();
});

router.post("/activities/:id/join", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [existing] = await db.select().from(activitiesTable).where(eq(activitiesTable.id, id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.status === "full" || existing.currentPlayers >= existing.maxPlayers) {
    res.status(400).json({ error: "Activity is full" }); return;
  }
  const newCount = existing.currentPlayers + 1;
  const newStatus = newCount >= existing.maxPlayers ? "full" : "open";
  const venueFee = existing.venueFee;
  const newCost = venueFee ? Math.round(venueFee / newCount) : existing.estimatedCostPerPerson;
  const [row] = await db.update(activitiesTable)
    .set({ currentPlayers: newCount, status: newStatus, estimatedCostPerPerson: newCost })
    .where(eq(activitiesTable.id, id)).returning();
  res.json({ ...row, createdAt: row.createdAt.toISOString(), expiresAt: row.expiresAt?.toISOString() ?? null });
});

export default router;
