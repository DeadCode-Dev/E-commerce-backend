import { Request, Response, NextFunction } from "express";

interface ErrorWithMessage extends Error {
  message: string;
}
const errorMiddleware = (
  err: ErrorWithMessage,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(err);
  res.status(500).json({ error: err.message });
};
export default errorMiddleware;
