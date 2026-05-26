import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, activitiesTable } from "@workspace/db";
import {
  ListActivitiesQueryParams,
  CreateActivityBody,
  GetActivityParams,
  UpdateActivityParams,
  UpdateActivityBody,
  DeleteActivityParams,
  JoinActivityParams,
  JoinActivityBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/activities", async (req, res) => {
  const parsed = ListActivitiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { type, status } = parsed.data;

  const rows = await db
    .select()
    .from(activitiesTable)
    .where(
      sql`${type ? sql`${activitiesTable.type} = ${type}` : sql`TRUE`} AND ${
        status ? sql`${activitiesTable.status} = ${status}` : sql`TRUE`
      }`
    )
    .orderBy(sql`${activitiesTable.createdAt} DESC`);

  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/activities", async (req, res) => {
  const parsed = CreateActivityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [row] = await db
    .insert(activitiesTable)
    .values({ ...parsed.data, currentPlayers: 1, status: "open" })
    .returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/activities/:id", async (req, res) => {
  const parsed = GetActivityParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.id, parsed.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/activities/:id", async (req, res) => {
  const paramsParsed = UpdateActivityParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateActivityBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [row] = await db
    .update(activitiesTable)
    .set(bodyParsed.data)
    .where(eq(activitiesTable.id, paramsParsed.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/activities/:id", async (req, res) => {
  const parsed = DeleteActivityParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(activitiesTable).where(eq(activitiesTable.id, parsed.data.id));
  res.status(204).send();
});

router.post("/activities/:id/join", async (req, res) => {
  const paramsParsed = JoinActivityParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = JoinActivityBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [existing] = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.id, paramsParsed.data.id));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (existing.status === "full" || existing.currentPlayers >= existing.maxPlayers) {
    res.status(400).json({ error: "Activity is full" });
    return;
  }
  const newCount = existing.currentPlayers + 1;
  const newStatus = newCount >= existing.maxPlayers ? "full" : "open";
  const [row] = await db
    .update(activitiesTable)
    .set({ currentPlayers: newCount, status: newStatus })
    .where(eq(activitiesTable.id, paramsParsed.data.id))
    .returning();
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

export default router;
