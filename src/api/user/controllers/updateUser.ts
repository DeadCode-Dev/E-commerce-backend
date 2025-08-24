import { Request, Response } from "express";
import UserModel from "@/models/User.model";
import User from "@/types/user/users.entity";
import responder from "@/utils/send.util";
import responses from "@/shared/responses";

export default async function updateUser(req: Request, res: Response) {
  const { email, phone, username } = req.body;
  const userId = (req.user as User).id;

  // Build updates object dynamically
  const updates: Partial<User> = Object.fromEntries(
    Object.entries({ email, phone, username }).filter(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ([_, value]) => value !== undefined && value !== null && value !== ""
    )
  );

  if (Object.keys(updates).length === 0) {
    responder(res, responses.Error.invalidInput, {
      message: "No valid fields to update",
    });
    return;
  }

  try {
    const updatedUser = await UserModel.updateUser(userId, updates);

    if (!updatedUser) {
      responder(res, responses.api.user.notFound);
      return;
    }

    responder(res, responses.api.user.updated, { updatedUser });
  } catch (err) {
    responder(res, responses.Error.internalServerError, {
      error: (err as Error).message,
    });
  }
}
