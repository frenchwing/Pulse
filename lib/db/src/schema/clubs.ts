import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clubsTable = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  description: text("description"),
  leaderName: text("leader_name").notNull(),
  leaderPhone: text("leader_phone"),
  sport: text("sport").notNull(),
  memberNames: jsonb("member_names").notNull().default([]),
  memberCount: integer("member_count").notNull().default(1),
  maxMembers: integer("max_members"),
  isExclusive: boolean("is_exclusive").notNull().default(true),
  city: text("city").notNull().default("Ahmedabad"),
  area: text("area"),
  coverColor: text("cover_color"),
  reliabilityScore: integer("reliability_score").notNull().default(80),
  avgDopeLevel: integer("avg_dope_level").notNull().default(5),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clubBattlesTable = pgTable("club_battles", {
  id: serial("id").primaryKey(),
  corp1Id: integer("corp1_id").notNull(),
  corp2Id: integer("corp2_id").notNull(),
  sport: text("sport").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  location: text("location"),
  result: text("result").notNull().default("pending"), // pending|corp1|corp2|draw
  corp1Score: integer("corp1_score"),
  corp2Score: integer("corp2_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clubInquiriesTable = pgTable("club_inquiries", {
  id: serial("id").primaryKey(),
  clubId: integer("club_id").notNull(),
  applicantName: text("applicant_name").notNull(),
  applicantPhone: text("applicant_phone"),
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending|approved|rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClubSchema = createInsertSchema(clubsTable).omit({ id: true, createdAt: true });
export type InsertClub = z.infer<typeof insertClubSchema>;
export type Club = typeof clubsTable.$inferSelect;

export const insertClubBattleSchema = createInsertSchema(clubBattlesTable).omit({ id: true, createdAt: true });
export type InsertClubBattle = z.infer<typeof insertClubBattleSchema>;
export type ClubBattle = typeof clubBattlesTable.$inferSelect;

export const insertClubInquirySchema = createInsertSchema(clubInquiriesTable).omit({ id: true, createdAt: true });
export type InsertClubInquiry = z.infer<typeof insertClubInquirySchema>;
export type ClubInquiry = typeof clubInquiriesTable.$inferSelect;
