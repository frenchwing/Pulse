import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, clubsTable, clubInquiriesTable, clubBattlesTable } from "@workspace/db";

const router = Router();

// ── Corps list & create ───────────────────────────────────────

router.get("/clubs", async (req, res) => {
  const { sport } = req.query as Record<string, string>;
  const rows = sport
    ? await db.select().from(clubsTable).where(eq(clubsTable.sport, sport)).orderBy(sql`${clubsTable.name} ASC`)
    : await db.select().from(clubsTable).orderBy(sql`${clubsTable.sport} ASC, ${clubsTable.name} ASC`);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/clubs", async (req, res) => {
  const { name, tagline, description, leaderName, leaderPhone, sport, memberNames, maxMembers, isExclusive, area, coverColor, reliabilityScore, avgDopeLevel } = req.body;
  if (!name || !leaderName || !sport) { res.status(400).json({ error: "name, leaderName and sport are required" }); return; }
  const members: string[] = memberNames ?? [leaderName];
  const [row] = await db.insert(clubsTable).values({
    name, tagline, description, leaderName, leaderPhone, sport,
    memberNames: members, memberCount: members.length, maxMembers: maxMembers ?? null,
    isExclusive: isExclusive ?? true, city: "Ahmedabad", area: area ?? null, coverColor: coverColor ?? null,
    reliabilityScore: reliabilityScore ?? 80, avgDopeLevel: avgDopeLevel ?? 5,
    wins: 0, losses: 0,
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

// ── Corp Battles — MUST be registered before /:id ─────────────

router.get("/clubs/battles", async (req, res) => {
  const { sport } = req.query as Record<string, string>;
  const rows = sport
    ? await db.select().from(clubBattlesTable).where(eq(clubBattlesTable.sport, sport)).orderBy(sql`${clubBattlesTable.scheduledAt} DESC`)
    : await db.select().from(clubBattlesTable).orderBy(sql`${clubBattlesTable.scheduledAt} DESC`);
  res.json(rows.map(r => ({
    ...r,
    scheduledAt: r.scheduledAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/clubs/battles", async (req, res) => {
  const { corp1Id, corp2Id, sport, scheduledAt, location } = req.body;
  if (!corp1Id || !corp2Id || !sport || !scheduledAt) {
    res.status(400).json({ error: "corp1Id, corp2Id, sport, scheduledAt are required" }); return;
  }
  if (corp1Id === corp2Id) { res.status(400).json({ error: "A corp cannot battle itself" }); return; }
  const [row] = await db.insert(clubBattlesTable).values({
    corp1Id: Number(corp1Id), corp2Id: Number(corp2Id), sport,
    scheduledAt: new Date(scheduledAt), location: location ?? null, result: "pending",
  }).returning();
  res.status(201).json({
    ...row,
    scheduledAt: row.scheduledAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  });
});

// ── Single corp + inquiries — after /battles to avoid clash ───

router.get("/clubs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select().from(clubsTable).where(eq(clubsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.post("/clubs/:id/inquire", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { applicantName, applicantPhone, message } = req.body;
  if (!applicantName) { res.status(400).json({ error: "applicantName is required" }); return; }
  const [club] = await db.select().from(clubsTable).where(eq(clubsTable.id, id));
  if (!club) { res.status(404).json({ error: "Club not found" }); return; }
  const [row] = await db.insert(clubInquiriesTable).values({
    clubId: id, applicantName, applicantPhone: applicantPhone ?? null,
    message: message ?? null, status: "pending",
  }).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/clubs/:id/inquiries", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await db.select().from(clubInquiriesTable)
    .where(eq(clubInquiriesTable.clubId, id))
    .orderBy(sql`${clubInquiriesTable.createdAt} DESC`);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.patch("/clubs/:id/inquiries/:inquiryId", async (req, res) => {
  const inquiryId = Number(req.params.inquiryId);
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) { res.status(400).json({ error: "status must be approved or rejected" }); return; }
  const [row] = await db.update(clubInquiriesTable).set({ status }).where(eq(clubInquiriesTable.id, inquiryId)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

export default router;
