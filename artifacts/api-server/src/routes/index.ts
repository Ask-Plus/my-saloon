import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import servicesRouter from "./services";
import stylistsRouter from "./stylists";
import timeSlotsRouter from "./timeSlots";
import appointmentsRouter from "./appointments";
import dashboardRouter from "./dashboard";
import bankAccountsRouter from "./bankAccounts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(servicesRouter);
router.use(stylistsRouter);
router.use(timeSlotsRouter);
router.use(appointmentsRouter);
router.use(dashboardRouter);
router.use(bankAccountsRouter);

export default router;
