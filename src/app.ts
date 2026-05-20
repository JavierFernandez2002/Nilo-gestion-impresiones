import express, { NextFunction, Request, Response } from "express";
import { mapErrorToHttp } from "./domain/errors/http-error-mapper.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.use(express.json());

app.get("/health", (_request: Request, response: Response) => {
  response.json({ status: "ok" });
});

app.use("/api/v1", apiRouter);

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  const mappedError = mapErrorToHttp(error);
  response.status(mappedError.status).json(mappedError.body);
});
