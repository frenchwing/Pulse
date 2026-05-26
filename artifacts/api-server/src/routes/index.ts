import { Router, type IRouter } from "express";
import healthRouter from "./health";
import activitiesRouter from "./activities";
import eventsRouter from "./events";
import statsRouter from "./stats";
import ratingsRouter from "./ratings";
import profilesRouter from "./profiles";
import crewsRouter from "./crews";
import authRouter from "./auth";
import clubsRouter from "./clubs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(activitiesRouter);
router.use(eventsRouter);
router.use(statsRouter);
router.use(ratingsRouter);
router.use(profilesRouter);
router.use(crewsRouter);
router.use(authRouter);
router.use(clubsRouter);

export default router;
