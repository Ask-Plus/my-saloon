import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginUserBody } from "@workspace/api-zod";
import { z } from "zod";

const router: IRouter = Router();

const UpdateVerificationBody = z.object({
  businessName: z.string().optional(),
  licenseUrl: z.string().optional(),
  verificationStatus: z.string().optional(),
});

const UpdateVerificationParams = z.object({
  id: z.coerce.number().int(),
});

router.post("/users/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(
      and(
        eq(usersTable.phone, parsed.data.phone),
        eq(usersTable.role, parsed.data.role),
      ),
    );

  if (existing) {
    const updateData: Record<string, unknown> = { name: parsed.data.name };
    if (parsed.data.businessName !== undefined) updateData.businessName = parsed.data.businessName;
    if (parsed.data.licenseUrl !== undefined) updateData.licenseUrl = parsed.data.licenseUrl;
    const [updated] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, existing.id))
      .returning();
    res.json(updated);
    return;
  }

  const [user] = await db.insert(usersTable).values({
    name: parsed.data.name,
    phone: parsed.data.phone,
    role: parsed.data.role,
    businessName: parsed.data.businessName ?? null,
    licenseUrl: parsed.data.licenseUrl ?? null,
  }).returning();
  res.json(user);
});

router.patch("/users/:id/verify", async (req, res): Promise<void> => {
  const params = UpdateVerificationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateVerificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.businessName !== undefined) updateData.businessName = parsed.data.businessName;
  if (parsed.data.licenseUrl !== undefined) updateData.licenseUrl = parsed.data.licenseUrl;
  if (parsed.data.verificationStatus !== undefined) updateData.verificationStatus = parsed.data.verificationStatus;

  const [user] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, params.data.id))
    .returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

export default router;
