import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const ownerBankAccountsTable = pgTable("owner_bank_accounts", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  bankName: text("bank_name").notNull(),
  accountName: text("account_name").notNull(),
  iban: text("iban").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOwnerBankAccountSchema = createInsertSchema(ownerBankAccountsTable).omit({ id: true, createdAt: true });
export type InsertOwnerBankAccount = z.infer<typeof insertOwnerBankAccountSchema>;
export type OwnerBankAccount = typeof ownerBankAccountsTable.$inferSelect;
