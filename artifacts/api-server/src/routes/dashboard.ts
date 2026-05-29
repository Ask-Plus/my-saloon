import { Router, type IRouter } from "express";
import { and, eq, gte, not } from "drizzle-orm";
import { db, appointmentsTable, timeSlotsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  const [todayAppts, upcomingAppts, paidAppts, openSlots] = await Promise.all([
    db
      .select({ id: appointmentsTable.id })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.date, today),
          not(eq(appointmentsTable.status, "cancelled")),
        ),
      ),
    db
      .select({ id: appointmentsTable.id })
      .from(appointmentsTable)
      .where(
        and(
          gte(appointmentsTable.date, today),
          not(eq(appointmentsTable.status, "cancelled")),
        ),
      ),
    db
      .select({ price: appointmentsTable.servicePrice })
      .from(appointmentsTable)
      .where(eq(appointmentsTable.paymentStatus, "paid")),
    db
      .select({ id: timeSlotsTable.id })
      .from(timeSlotsTable)
      .where(
        and(
          gte(timeSlotsTable.date, today),
          eq(timeSlotsTable.isBooked, false),
        ),
      ),
  ]);

  const totalRevenue = paidAppts.reduce((sum, a) => sum + a.price, 0);

  res.json({
    todayCount: todayAppts.length,
    upcomingCount: upcomingAppts.length,
    totalRevenue,
    openSlotsCount: openSlots.length,
  });
});

export default router;
