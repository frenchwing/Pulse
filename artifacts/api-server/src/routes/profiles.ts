import { Router } from "express";
import { eq, ilike } from "drizzle-orm";
import { db, profilesTable, otpTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/profiles", async (req, res) => {
  const { name } = req.query as Record<string, string>;
  let rows;
  if (name) {
    rows = await db.select().from(profilesTable).where(ilike(profilesTable.name, `%${name}%`));
  } else {
    rows = await db.select().from(profilesTable).orderBy(sql`${profilesTable.createdAt} DESC`).limit(50);
  }
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/profiles", async (req, res) => {
  const { name, phone, bio, avatarUrl, locationCity, locationArea, gender, womenOnlyPref, sports } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [row] = await db.insert(profilesTable).values({
    name, phone, bio, avatarUrl, locationCity: locationCity ?? "Ahmedabad", locationArea, gender: gender ?? "other",
    womenOnlyPref: womenOnlyPref ?? false, sports: sports ?? [], reputationTags: []
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/profiles/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select().from(profilesTable).where(eq(profilesTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/profiles/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const allowed = ["name","bio","avatarUrl","locationArea","gender","womenOnlyPref","sports","reputationTags","gamesPlayed","gamesHosted","streakWeeks"];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) { if (req.body[k] !== undefined) patch[k] = req.body[k]; }
  const [row] = await db.update(profilesTable).set(patch).where(eq(profilesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.post("/profiles/:id/verify", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { docNumber, docType } = req.body;
  if (!docNumber || !docType) { res.status(400).json({ error: "docNumber and docType required" }); return; }
  const [row] = await db.update(profilesTable)
    .set({ kycStatus: "pending", kycDocNumber: docNumber })
    .where(eq(profilesTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

export default router;
