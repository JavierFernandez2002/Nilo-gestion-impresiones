import { Router } from "express";
import { orderRouter } from "./order.routes.js";
import { printJobRouter } from "./print-job.routes.js";
import { printerRouter } from "./printer.routes.js";

export const apiRouter = Router();

apiRouter.use("/orders", orderRouter);
apiRouter.use("/print-jobs", printJobRouter);
apiRouter.use("/printers", printerRouter);
