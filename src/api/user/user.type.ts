import { z } from "zod";
import UserSchema from "./user.schema";

export type UpdateUserType = z.infer<typeof UserSchema.updateUserSchema>;
