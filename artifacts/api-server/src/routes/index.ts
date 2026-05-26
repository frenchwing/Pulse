import { Router, type IRouter } from "express";
import healthRouter from "./health";
import activitiesRouter from "./activities";
import eventsRouter from "./events";
import statsRouter from "./stats";
import ratingsRouter from "./ratings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(activitiesRouter);
router.use(eventsRouter);
router.use(statsRouter);
router.use(ratingsRouter);

export default router;
