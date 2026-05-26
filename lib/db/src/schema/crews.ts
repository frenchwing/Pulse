import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const crewsTable = pgTable("crews", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  hostName: text("host_name").notNull(),
  sport: text("sport"),
  memberNames: jsonb("member_names").notNull().default([]),
  memberCount: integer("member_count").notNull().default(1),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCrewSchema = createInsertSchema(crewsTable).omit({ id: true, createdAt: true });
export type InsertCrew = z.infer<typeof insertCrewSchema>;
export type Crew = typeof crewsTable.$inferSelect;
