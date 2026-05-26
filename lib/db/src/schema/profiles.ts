import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  locationCity: text("location_city").notNull().default("Ahmedabad"),
  locationArea: text("location_area"),
  gender: text("gender").notNull().default("other"), // man|woman|other
  womenOnlyPref: boolean("women_only_pref").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  kycStatus: text("kyc_status").notNull().default("none"), // none|pending|verified
  kycDocNumber: text("kyc_doc_number"),
  gamesPlayed: integer("games_played").notNull().default(0),
  gamesHosted: integer("games_hosted").notNull().default(0),
  streakWeeks: integer("streak_weeks").notNull().default(0),
  reputationTags: jsonb("reputation_tags").notNull().default([]),
  sports: jsonb("sports").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profilesTable).omit({ id: true, createdAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;

export const otpTable = pgTable("otps", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
