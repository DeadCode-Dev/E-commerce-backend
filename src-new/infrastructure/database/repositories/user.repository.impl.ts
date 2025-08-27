import { User } from "../../../domain/entities/user.entity";
import { Email } from "../../../domain/value-objects/email.vo";
import { Password } from "../../../domain/value-objects/password.vo";
import { UserRepository } from "../../../domain/repositories/user.repository";
import {
  EntityId,
  SearchParams,
  UserRole,
} from "../../../shared/types/api.types";
import { DatabaseException } from "../../../shared/exceptions";
import { PaginationUtil } from "../../../shared/utils";
import database from "../connection";

interface UserRow {
  id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_email_verified: boolean;
  email_verification_token?: string;
  password_reset_token?: string;
  password_reset_expires?: Date;
  last_login_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class PostgresUserRepository implements UserRepository {
  async create(user: User): Promise<User> {
    try {
      const userData = user.toPersistence();
      const query = `
        INSERT INTO users (
          email, password, first_name, last_name, role, is_email_verified,
          email_verification_token, password_reset_token, password_reset_expires,
          last_login_at, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        userData.email.getValue(),
        userData.password.toString(),
        userData.firstName,
        userData.lastName,
        userData.role,
        userData.isEmailVerified,
        userData.emailVerificationToken,
        userData.passwordResetToken,
        userData.passwordResetExpires,
        userData.lastLoginAt,
        userData.isActive,
        userData.createdAt,
        userData.updatedAt,
      ];

      const result = await database.query<UserRow>(query, values);
      return this.mapRowToEntity(result.rows[0]);
    } catch (error) {
      throw new DatabaseException(
        `Failed to create user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findById(id: EntityId): Promise<User | null> {
    try {
      const query = "SELECT * FROM users WHERE id = $1";
      const result = await database.query<UserRow>(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToEntity(result.rows[0]);
    } catch (error) {
      throw new DatabaseException(
        `Failed to find user by ID: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
    try {
      const query = "SELECT * FROM users WHERE email = $1";
      const result = await database.query<UserRow>(query, [email.getValue()]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToEntity(result.rows[0]);
    } catch (error) {
      throw new DatabaseException(
        `Failed to find user by email: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async update(user: User): Promise<User> {
    try {
      const userData = user.toPersistence();
      const query = `
        UPDATE users SET
          email = $2, password = $3, first_name = $4, last_name = $5, role = $6,
          is_email_verified = $7, email_verification_token = $8, password_reset_token = $9,
          password_reset_expires = $10, last_login_at = $11, is_active = $12, updated_at = $13
        WHERE id = $1
        RETURNING *
      `;

      const values = [
        userData.id,
        userData.email.getValue(),
        userData.password.toString(),
        userData.firstName,
        userData.lastName,
        userData.role,
        userData.isEmailVerified,
        userData.emailVerificationToken,
        userData.passwordResetToken,
        userData.passwordResetExpires,
        userData.lastLoginAt,
        userData.isActive,
        new Date(),
      ];

      const result = await database.query<UserRow>(query, values);

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      return this.mapRowToEntity(result.rows[0]);
    } catch (error) {
      throw new DatabaseException(
        `Failed to update user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async delete(id: EntityId): Promise<void> {
    try {
      const query = "DELETE FROM users WHERE id = $1";
      const result = await database.query(query, [id]);

      if (result.rowCount === 0) {
        throw new Error("User not found");
      }
    } catch (error) {
      throw new DatabaseException(
        `Failed to delete user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findMany(
    params: SearchParams
  ): Promise<{ users: User[]; total: number }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        sortBy = "created_at",
        sortOrder = "desc",
      } = params;
      const offset = PaginationUtil.getOffset(page, limit);

      let whereClause = "WHERE 1=1";
      const queryParams: unknown[] = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        whereClause += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
      }

      // Count total
      const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
      const countResult = await database.query<{ count: string }>(
        countQuery,
        queryParams
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get users
      const query = `
        SELECT * FROM users ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      queryParams.push(limit, offset);

      const result = await database.query<UserRow>(query, queryParams);
      const users = result.rows.map((row) => this.mapRowToEntity(row));

      return { users, total };
    } catch (error) {
      throw new DatabaseException(
        `Failed to find users: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    try {
      const query = "SELECT * FROM users WHERE email_verification_token = $1";
      const result = await database.query<UserRow>(query, [token]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToEntity(result.rows[0]);
    } catch (error) {
      throw new DatabaseException(
        `Failed to find user by verification token: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    try {
      const query =
        "SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()";
      const result = await database.query<UserRow>(query, [token]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToEntity(result.rows[0]);
    } catch (error) {
      throw new DatabaseException(
        `Failed to find user by reset token: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async existsByEmail(email: Email): Promise<boolean> {
    try {
      const query = "SELECT 1 FROM users WHERE email = $1";
      const result = await database.query(query, [email.getValue()]);
      return result.rows.length > 0;
    } catch (error) {
      throw new DatabaseException(
        `Failed to check email existence: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async countActiveUsers(): Promise<number> {
    try {
      const query = "SELECT COUNT(*) FROM users WHERE is_active = true";
      const result = await database.query<{ count: string }>(query);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      throw new DatabaseException(
        `Failed to count active users: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findRecentlyActive(days: number): Promise<User[]> {
    try {
      const query = `
        SELECT * FROM users 
        WHERE last_login_at > NOW() - INTERVAL '${days} days'
        ORDER BY last_login_at DESC
      `;
      const result = await database.query<UserRow>(query);
      return result.rows.map((row) => this.mapRowToEntity(row));
    } catch (error) {
      throw new DatabaseException(
        `Failed to find recently active users: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async findByRole(role: string): Promise<User[]> {
    try {
      const query = "SELECT * FROM users WHERE role = $1";
      const result = await database.query<UserRow>(query, [role]);
      return result.rows.map((row) => this.mapRowToEntity(row));
    } catch (error) {
      throw new DatabaseException(
        `Failed to find users by role: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async createMany(users: User[]): Promise<User[]> {
    try {
      return await database.transaction(async (client) => {
        const createdUsers: User[] = [];

        for (const user of users) {
          const userData = user.toPersistence();
          const query = `
            INSERT INTO users (
              email, password, first_name, last_name, role, is_email_verified,
              email_verification_token, password_reset_token, password_reset_expires,
              last_login_at, is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
          `;

          const values = [
            userData.email.getValue(),
            userData.password.toString(),
            userData.firstName,
            userData.lastName,
            userData.role,
            userData.isEmailVerified,
            userData.emailVerificationToken,
            userData.passwordResetToken,
            userData.passwordResetExpires,
            userData.lastLoginAt,
            userData.isActive,
            userData.createdAt,
            userData.updatedAt,
          ];

          const result = await client.query<UserRow>(query, values);
          createdUsers.push(this.mapRowToEntity(result.rows[0]));
        }

        return createdUsers;
      });
    } catch (error) {
      throw new DatabaseException(
        `Failed to create users: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async updateMany(users: User[]): Promise<User[]> {
    try {
      return await database.transaction(async (client) => {
        const updatedUsers: User[] = [];

        for (const user of users) {
          const userData = user.toPersistence();
          const query = `
            UPDATE users SET
              email = $2, password = $3, first_name = $4, last_name = $5, role = $6,
              is_email_verified = $7, email_verification_token = $8, password_reset_token = $9,
              password_reset_expires = $10, last_login_at = $11, is_active = $12, updated_at = $13
            WHERE id = $1
            RETURNING *
          `;

          const values = [
            userData.id,
            userData.email.getValue(),
            userData.password.toString(),
            userData.firstName,
            userData.lastName,
            userData.role,
            userData.isEmailVerified,
            userData.emailVerificationToken,
            userData.passwordResetToken,
            userData.passwordResetExpires,
            userData.lastLoginAt,
            userData.isActive,
            new Date(),
          ];

          const result = await client.query<UserRow>(query, values);
          updatedUsers.push(this.mapRowToEntity(result.rows[0]));
        }

        return updatedUsers;
      });
    } catch (error) {
      throw new DatabaseException(
        `Failed to update users: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async deleteMany(ids: EntityId[]): Promise<void> {
    try {
      const query = "DELETE FROM users WHERE id = ANY($1)";
      await database.query(query, [ids]);
    } catch (error) {
      throw new DatabaseException(
        `Failed to delete users: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  private mapRowToEntity(row: UserRow): User {
    return User.fromPersistence({
      id: row.id,
      email: Email.create(row.email),
      password: Password.fromHash(row.password),
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      isEmailVerified: row.is_email_verified,
      emailVerificationToken: row.email_verification_token,
      passwordResetToken: row.password_reset_token,
      passwordResetExpires: row.password_reset_expires,
      lastLoginAt: row.last_login_at,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
