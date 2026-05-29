import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { stylistsTable } from "./stylists";

export const timeSlotsTable = pgTable("time_slots", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  stylistId: integer("stylist_id").notNull().references(() => stylistsTable.id),
  isBooked: boolean("is_booked").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTimeSlotSchema = createInsertSchema(timeSlotsTable).omit({ id: true, createdAt: true });
export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type TimeSlot = typeof timeSlotsTable.$inferSelect;
