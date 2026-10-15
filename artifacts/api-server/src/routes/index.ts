import { Router, type IRouter } from "express";
import automationRouter from "./automation";
import authRouter from "./auth";
import catalogRouter from "./catalog";
import customersRouter from "./customers";
import dashboardRouter from "./dashboard";
import employeesRouter from "./employees";
import healthRouter from "./health";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(employeesRouter);
router.use(catalogRouter);
router.use(customersRouter);
router.use(ordersRouter);
router.use(dashboardRouter);
router.use(automationRouter);

export default router;
