import { doublePrecision, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { servicesTable } from "./services";
import { stylistsTable } from "./stylists";
import { timeSlotsTable } from "./timeSlots";

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => usersTable.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  serviceId: integer("service_id").notNull().references(() => servicesTable.id),
  serviceName: text("service_name").notNull(),
  servicePrice: doublePrecision("service_price").notNull(),
  stylistId: integer("stylist_id").notNull().references(() => stylistsTable.id),
  stylistName: text("stylist_name").notNull(),
  slotId: integer("slot_id").notNull().references(() => timeSlotsTable.id),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: text("status").notNull().default("confirmed"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
