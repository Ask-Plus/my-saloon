import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, appointmentsTable, timeSlotsTable } from "@workspace/db";
import {
  CreateAppointmentBody,
  GetAppointmentParams,
  GetAppointmentsQueryParams,
  UpdateAppointmentParams,
} from "@workspace/api-zod";
import { z } from "zod";

const router: IRouter = Router();

const UpdateAppointmentBody = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
});

router.get("/appointments", async (req, res): Promise<void> => {
  const params = GetAppointmentsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { customerId } = params.data;

  const appointments = await db
    .select()
    .from(appointmentsTable)
    .where(
      customerId !== undefined
        ? eq(appointmentsTable.customerId, customerId)
        : undefined,
    )
    .orderBy(appointmentsTable.date, appointmentsTable.startTime);

  res.json(appointments);
});

router.post("/appointments", async (req, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await db
    .update(timeSlotsTable)
    .set({ isBooked: true })
    .where(eq(timeSlotsTable.id, parsed.data.slotId));

  const [appt] = await db
    .insert(appointmentsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(appt);
});

router.get("/appointments/:id", async (req, res): Promise<void> => {
  const params = GetAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [appt] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id));
  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json(appt);
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const params = UpdateAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.paymentStatus !== undefined) updateData.paymentStatus = parsed.data.paymentStatus;

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [appt] = await db
    .update(appointmentsTable)
    .set(updateData)
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  if (parsed.data.status === "cancelled") {
    await db
      .update(timeSlotsTable)
      .set({ isBooked: false })
      .where(eq(timeSlotsTable.id, appt.slotId));
  }

  res.json(appt);
});

export default router;
