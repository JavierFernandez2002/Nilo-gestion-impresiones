import { Router } from "express";
import { printerRouter } from "./printer.routes.js";

export const apiRouter = Router();

apiRouter.use("/printers", printerRouter);
