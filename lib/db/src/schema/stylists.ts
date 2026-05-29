import { doublePrecision, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stylistsTable = pgTable("stylists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull().default("Stylist"),
  specialties: text("specialties").array().notNull().default([]),
  rating: doublePrecision("rating").notNull().default(5.0),
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStylistSchema = createInsertSchema(stylistsTable).omit({ id: true, createdAt: true });
export type InsertStylist = z.infer<typeof insertStylistSchema>;
export type Stylist = typeof stylistsTable.$inferSelect;
