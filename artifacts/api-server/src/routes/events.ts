import { Router } from "express";
import { and, eq, lt, sql } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";
import {
  ListEventsQueryParams,
  CreateEventBody,
  GetEventParams,
  UpdateEventParams,
  UpdateEventBody,
  DeleteEventParams,
  JoinEventParams,
  JoinEventBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/events", async (req, res) => {
  const parsed = ListEventsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { type, status } = parsed.data;

  const rows = await db
    .select()
    .from(eventsTable)
    .where(
      sql`${type ? sql`${eventsTable.type} = ${type}` : sql`TRUE`} AND ${
        status ? sql`${eventsTable.status} = ${status}` : sql`TRUE`
      }`
    )
    .orderBy(sql`${eventsTable.createdAt} DESC`);

  res.json(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/events", async (req, res) => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const [row] = await db
    .insert(eventsTable)
    .values({ ...parsed.data, currentAttendees: 1, status: "open" })
    .returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/events/:id", async (req, res) => {
  const parsed = GetEventParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, parsed.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/events/:id", async (req, res) => {
  const paramsParsed = UpdateEventParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateEventBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [row] = await db
    .update(eventsTable)
    .set(bodyParsed.data)
    .where(eq(eventsTable.id, paramsParsed.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/events/:id", async (req, res) => {
  const parsed = DeleteEventParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(eventsTable).where(eq(eventsTable.id, parsed.data.id));
  res.status(204).send();
});

router.post("/events/:id/join", async (req, res) => {
  const paramsParsed = JoinEventParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = JoinEventBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [row] = await db
    .update(eventsTable)
    .set({
      currentAttendees: sql`${eventsTable.currentAttendees} + 1`,
      status: sql`CASE WHEN ${eventsTable.currentAttendees} + 1 >= ${eventsTable.maxAttendees} THEN 'full' ELSE 'open' END`,
    })
    .where(and(
      eq(eventsTable.id, paramsParsed.data.id),
      lt(eventsTable.currentAttendees, eventsTable.maxAttendees),
      sql`${eventsTable.status} != 'cancelled'`,
    ))
    .returning();
  if (!row) {
    const [check] = await db.select({ id: eventsTable.id }).from(eventsTable).where(eq(eventsTable.id, paramsParsed.data.id));
    if (!check) { res.status(404).json({ error: "Not found" }); return; }
    res.status(400).json({ error: "Event is full" }); return;
  }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

export default router;
