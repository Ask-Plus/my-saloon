import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, servicesTable } from "@workspace/db";
import {
  CreateServiceBody,
  DeleteServiceParams,
  GetServiceParams,
  UpdateServiceBody,
  UpdateServiceParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/services", async (_req, res): Promise<void> => {
  const services = await db
    .select()
    .from(servicesTable)
    .orderBy(servicesTable.createdAt);
  res.json(services);
});

router.post("/services", async (req, res): Promise<void> => {
  const parsed = CreateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [service] = await db
    .insert(servicesTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(service);
});

router.get("/services/:id", async (req, res): Promise<void> => {
  const params = GetServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [service] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, params.data.id));
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(service);
});

router.patch("/services/:id", async (req, res): Promise<void> => {
  const params = UpdateServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [service] = await db
    .update(servicesTable)
    .set(parsed.data)
    .where(eq(servicesTable.id, params.data.id))
    .returning();
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(service);
});

router.delete("/services/:id", async (req, res): Promise<void> => {
  const params = DeleteServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(servicesTable).where(eq(servicesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
