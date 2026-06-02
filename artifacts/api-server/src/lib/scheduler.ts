import { and, eq, sql } from "drizzle-orm";
import { db, activitiesTable } from "@workspace/db";
import { logger } from "./logger";

const INTERVAL_MS = 60_000; // run every minute

async function expireStaleActivities() {
  const now = new Date();
  const result = await db
    .update(activitiesTable)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(activitiesTable.status, "open"),
        sql`${activitiesTable.expiresAt} IS NOT NULL AND ${activitiesTable.expiresAt} < ${now}`,
      ),
    )
    .returning({ id: activitiesTable.id });

  if (result.length > 0) {
    logger.info({ count: result.length, ids: result.map(r => r.id) }, "Auto-cancelled expired activities");
  }
}

export function startScheduler() {
  // Run once immediately on boot so stale activities from downtime are cleaned up
  expireStaleActivities().catch(err =>
    logger.error({ err }, "Expiry sweep failed on boot"),
  );

  const timer = setInterval(() => {
    expireStaleActivities().catch(err =>
      logger.error({ err }, "Expiry sweep failed"),
    );
  }, INTERVAL_MS);

  // Don't keep the process alive just for the timer
  timer.unref();

  logger.info({ intervalMs: INTERVAL_MS }, "Activity expiry scheduler started");
}
