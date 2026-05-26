import { pgTable, serial, text, real, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activitiesTable = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  // sport|social|fitness|coffee|adventure|hobby
  activityKind: text("activity_kind").notNull().default("sport"),
  description: text("description"),
  address: text("address").notNull(),
  venue: text("venue"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  expiresAt: timestamp("expires_at"),
  maxPlayers: integer("max_players").notNull(),
  currentPlayers: integer("current_players").notNull().default(1),
  skillLevel: text("skill_level"), // beginner|intermediate|advanced|pro
  genderPref: text("gender_pref").notNull().default("any"), // any|women_only
  venueFee: real("venue_fee"),
  estimatedCostPerPerson: real("estimated_cost_per_person"),
  hostName: text("host_name").notNull(),
  hostAvatar: text("host_avatar"),
  hostReliabilityScore: integer("host_reliability_score").notNull().default(75),
  isHostOnline: boolean("is_host_online").notNull().default(false),
  crewId: integer("crew_id"),
  note: text("note"),
  visibility: text("visibility").notNull().default("public"), // public|friends
  status: text("status").notNull().default("open"), // open|full|cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activitiesTable).omit({ id: true, createdAt: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activitiesTable.$inferSelect;
