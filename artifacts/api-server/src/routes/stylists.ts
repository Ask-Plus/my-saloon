import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, stylistsTable } from "@workspace/db";
import {
  CreateStylistBody,
  DeleteStylistParams,
  GetStylistParams,
  UpdateStylistBody,
  UpdateStylistParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stylists", async (_req, res): Promise<void> => {
  const stylists = await db
    .select()
    .from(stylistsTable)
    .orderBy(stylistsTable.createdAt);
  res.json(stylists);
});

router.post("/stylists", async (req, res): Promise<void> => {
  const parsed = CreateStylistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [stylist] = await db
    .insert(stylistsTable)
    .values({
      name: parsed.data.name,
      title: parsed.data.title ?? "Stylist",
      specialties: parsed.data.specialties ?? [],
      rating: parsed.data.rating ?? 5.0,
      reviewCount: parsed.data.reviewCount ?? 0,
    })
    .returning();
  res.status(201).json(stylist);
});

router.get("/stylists/:id", async (req, res): Promise<void> => {
  const params = GetStylistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [stylist] = await db
    .select()
    .from(stylistsTable)
    .where(eq(stylistsTable.id, params.data.id));
  if (!stylist) {
    res.status(404).json({ error: "Stylist not found" });
    return;
  }
  res.json(stylist);
});

router.patch("/stylists/:id", async (req, res): Promise<void> => {
  const params = UpdateStylistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateStylistBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [stylist] = await db
    .update(stylistsTable)
    .set(parsed.data)
    .where(eq(stylistsTable.id, params.data.id))
    .returning();
  if (!stylist) {
    res.status(404).json({ error: "Stylist not found" });
    return;
  }
  res.json(stylist);
});

router.delete("/stylists/:id", async (req, res): Promise<void> => {
  const params = DeleteStylistParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(stylistsTable).where(eq(stylistsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
