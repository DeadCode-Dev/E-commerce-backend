import { AnyZodObject, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import responder from "@/utils/send.util";
import responses from "@/shared/responses";

const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        responder(res, responses.Error.invalidInput, { errors: err.errors });
      } else {
        next(err);
      }
    }
  };

export default validate;
