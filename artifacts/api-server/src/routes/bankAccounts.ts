import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ownerBankAccountsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const CreateBankAccountBody = z.object({
  ownerId: z.number().int(),
  bankName: z.string().min(1),
  accountName: z.string().min(1),
  iban: z.string().min(1),
});

const DeleteBankAccountParams = z.object({
  id: z.coerce.number().int(),
});

const GetBankAccountsQuery = z.object({
  ownerId: z.coerce.number().int(),
});

router.get("/bank-accounts/public", async (_req, res): Promise<void> => {
  const [account] = await db
    .select()
    .from(ownerBankAccountsTable)
    .limit(1);
  if (!account) {
    res.status(404).json({ error: "No bank account configured" });
    return;
  }
  res.json(account);
});

router.get("/bank-accounts", async (req, res): Promise<void> => {
  const params = GetBankAccountsQuery.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const accounts = await db
    .select()
    .from(ownerBankAccountsTable)
    .where(eq(ownerBankAccountsTable.ownerId, params.data.ownerId))
    .orderBy(ownerBankAccountsTable.createdAt);
  res.json(accounts);
});

router.post("/bank-accounts", async (req, res): Promise<void> => {
  const parsed = CreateBankAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [account] = await db
    .insert(ownerBankAccountsTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(account);
});

router.delete("/bank-accounts/:id", async (req, res): Promise<void> => {
  const params = DeleteBankAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(ownerBankAccountsTable)
    .where(eq(ownerBankAccountsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
