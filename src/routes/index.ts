import { Router } from "express";
import { assignmentRouter } from "./assignment.routes.js";
import { orderRouter } from "./order.routes.js";
import { printJobRouter } from "./print-job.routes.js";
import { printerRouter } from "./printer.routes.js";
import { statisticsRouter } from "./statistics.routes.js";

export const apiRouter = Router();

apiRouter.use("/assignments", assignmentRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/print-jobs", printJobRouter);
apiRouter.use("/printers", printerRouter);
apiRouter.use("/statistics", statisticsRouter);
