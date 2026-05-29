import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, timeSlotsTable } from "@workspace/db";
import {
  CreateTimeSlotBody,
  DeleteTimeSlotParams,
  GetTimeSlotParams,
  GetTimeSlotsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/time-slots", async (req, res): Promise<void> => {
  const params = GetTimeSlotsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { date, stylistId, available } = params.data;

  const slots = await db
    .select()
    .from(timeSlotsTable)
    .where(
      and(
        date !== undefined ? eq(timeSlotsTable.date, date) : undefined,
        stylistId !== undefined
          ? eq(timeSlotsTable.stylistId, stylistId)
          : undefined,
        available === true ? eq(timeSlotsTable.isBooked, false) : undefined,
        available === false ? eq(timeSlotsTable.isBooked, true) : undefined,
      ),
    )
    .orderBy(timeSlotsTable.date, timeSlotsTable.startTime);

  res.json(slots);
});

router.post("/time-slots", async (req, res): Promise<void> => {
  const parsed = CreateTimeSlotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [slot] = await db
    .insert(timeSlotsTable)
    .values({ ...parsed.data, isBooked: false })
    .returning();
  res.status(201).json(slot);
});

router.get("/time-slots/:id", async (req, res): Promise<void> => {
  const params = GetTimeSlotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [slot] = await db
    .select()
    .from(timeSlotsTable)
    .where(eq(timeSlotsTable.id, params.data.id));
  if (!slot) {
    res.status(404).json({ error: "Time slot not found" });
    return;
  }
  res.json(slot);
});

router.delete("/time-slots/:id", async (req, res): Promise<void> => {
  const params = DeleteTimeSlotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(timeSlotsTable)
    .where(eq(timeSlotsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
