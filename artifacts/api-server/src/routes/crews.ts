import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, crewsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/crews", async (req, res) => {
  const { sport } = req.query as Record<string, string>;
  let rows;
  if (sport) {
    rows = await db.select().from(crewsTable).where(eq(crewsTable.sport, sport));
  } else {
    rows = await db.select().from(crewsTable).orderBy(sql`${crewsTable.createdAt} DESC`);
  }
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/crews", async (req, res) => {
  const { name, description, hostName, sport, memberNames, isPublic } = req.body;
  if (!name || !hostName) { res.status(400).json({ error: "name and hostName required" }); return; }
  const members: string[] = memberNames ?? [hostName];
  const [row] = await db.insert(crewsTable).values({
    name, description, hostName, sport, memberNames: members,
    memberCount: members.length, isPublic: isPublic ?? true
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/crews/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select().from(crewsTable).where(eq(crewsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/crews/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, description, sport, memberNames, isPublic } = req.body;
  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name;
  if (description !== undefined) patch.description = description;
  if (sport !== undefined) patch.sport = sport;
  if (memberNames !== undefined) { patch.memberNames = memberNames; patch.memberCount = memberNames.length; }
  if (isPublic !== undefined) patch.isPublic = isPublic;
  const [row] = await db.update(crewsTable).set(patch).where(eq(crewsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

export default router;
