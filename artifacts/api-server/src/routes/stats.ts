import { Router } from "express";
import { db, activitiesTable, eventsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/stats/summary", async (_req, res) => {
  const [actStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      open: sql<number>`count(*) filter (where ${activitiesTable.status} = 'open')::int`,
    })
    .from(activitiesTable);

  const [evtStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      open: sql<number>`count(*) filter (where ${eventsTable.status} = 'open')::int`,
    })
    .from(eventsTable);

  const actByType = await db
    .select({
      type: activitiesTable.type,
      count: sql<number>`count(*)::int`,
    })
    .from(activitiesTable)
    .groupBy(activitiesTable.type);

  const evtByType = await db
    .select({
      type: eventsTable.type,
      count: sql<number>`count(*)::int`,
    })
    .from(eventsTable)
    .groupBy(eventsTable.type);

  const activityByType: Record<string, number> = {};
  for (const row of actByType) activityByType[row.type] = row.count;

  const eventByType: Record<string, number> = {};
  for (const row of evtByType) eventByType[row.type] = row.count;

  res.json({
    totalActivities: actStats.total,
    totalEvents: evtStats.total,
    openActivities: actStats.open,
    openEvents: evtStats.open,
    activityByType,
    eventByType,
  });
});

export default router;
