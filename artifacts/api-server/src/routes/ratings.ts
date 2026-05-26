import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, ratingsTable } from "@workspace/db";

const router = Router();

router.get("/activities/:id/ratings", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await db.select().from(ratingsTable)
    .where(and(eq(ratingsTable.entityType, "activity"), eq(ratingsTable.entityId, id)));
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/activities/:id/ratings", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { fromName, toName, score } = req.body;
  if (!fromName || !toName || typeof score !== "number" || score < 1 || score > 10) {
    res.status(400).json({ error: "fromName, toName, and score (1-10) are required" }); return;
  }
  const [row] = await db.insert(ratingsTable).values({
    entityType: "activity", entityId: id, fromName, toName, score
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/events/:id/ratings", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await db.select().from(ratingsTable)
    .where(and(eq(ratingsTable.entityType, "event"), eq(ratingsTable.entityId, id)));
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/events/:id/ratings", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { fromName, toName, score } = req.body;
  if (!fromName || !toName || typeof score !== "number" || score < 1 || score > 10) {
    res.status(400).json({ error: "fromName, toName, and score (1-10) are required" }); return;
  }
  const [row] = await db.insert(ratingsTable).values({
    entityType: "event", entityId: id, fromName, toName, score
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

export default router;
