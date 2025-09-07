import { MessageType } from "@/services/responses";
import { Response } from "express";

/**
 * Standardized JSON response handler
 * Ensures consistent response structure across all controllers
 */
export default function responder(
  res: Response,
  response: MessageType,
  data?: Record<string, unknown>, // optional payload (user, token, etc.)
) {
  return res.status(response.code).json({
    statusCode: response.code,
    message: response.message,
    ...(data && { data }), // only include if passed
  });
}
