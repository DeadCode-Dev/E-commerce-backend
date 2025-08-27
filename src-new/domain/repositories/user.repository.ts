import { User } from "../entities/user.entity";
import { Email } from "../value-objects/email.vo";
import { EntityId, SearchParams } from "../../shared/types/api.types";

export interface UserRepository {
  // Basic CRUD operations
  create(user: User): Promise<User>;
  findById(id: EntityId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  update(user: User): Promise<User>;
  delete(id: EntityId): Promise<void>;

  // Query methods
  findMany(params: SearchParams): Promise<{
    users: User[];
    total: number;
  }>;

  findByEmailVerificationToken(token: string): Promise<User | null>;
  findByPasswordResetToken(token: string): Promise<User | null>;

  // Business queries
  existsByEmail(email: Email): Promise<boolean>;
  countActiveUsers(): Promise<number>;
  findRecentlyActive(days: number): Promise<User[]>;
  findByRole(role: string): Promise<User[]>;

  // Bulk operations
  createMany(users: User[]): Promise<User[]>;
  updateMany(users: User[]): Promise<User[]>;
  deleteMany(ids: EntityId[]): Promise<void>;
}
