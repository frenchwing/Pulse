import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(), // museum | coffee | other
  description: text("description"),
  address: text("address").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  maxAttendees: integer("max_attendees").notNull(),
  currentAttendees: integer("current_attendees").notNull().default(1),
  hostName: text("host_name").notNull(),
  hostAvatar: text("host_avatar"),
  status: text("status").notNull().default("open"), // open | full | cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
