import pg from "../config/postgres";
import User from "types/user/users.entity";
import UserType from "types/user/users.entity";

export default class UserModel {
  static db = pg();
  static async createUser(data: Partial<User>): Promise<UserType> {
    const query = `INSERT INTO users (username, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING *`;
    const values = [data.username, data.email, data.password, data.phone];
    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async findUserByEmail(email: string): Promise<UserType | null> {
    const query = `SELECT id, username, email, phone, user_role, created_at, updated_at FROM users WHERE email = $1`;
    const values = [email];
    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error("Error finding user by email" + error);
    }
  }

  static async updateUser(
    id: number,
    data: Partial<User>
  ): Promise<UserType | null> {
    const dataKeys = Object.keys(data);
    const setClause = dataKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");
    const values = [...dataKeys.map((key) => data[key as keyof User]), id];
    const query = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${dataKeys.length + 1} RETURNING *`;
    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error("Error updating user" + error);
    }
  }

  static async changePassword(
    email: string,
    newPassword: string
  ): Promise<UserType | null> {
    const query = `UPDATE users SET password = $1, updated_at = NOW() WHERE email = $2 RETURNING *`;
    const values = [newPassword, email];
    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error("Error resetting password" + error);
    }
  }
}
