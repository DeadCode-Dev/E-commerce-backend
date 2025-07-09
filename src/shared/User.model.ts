import pg from "../config/postgres";
import User from "modules/user/users.entity";
import UserType from "modules/user/users.entity";

export default class UserModel {
  static db = pg;
  static async createUser(data: Partial<User>): Promise<UserType> {
    const query = `INSERT INTO users (username, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING *`;
    const values = [data.username, data.email, data.password, data.phone];
    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error("Error creating user");
    }
  }

  static async findUserByEmail(email: string): Promise<UserType | null> {
    const query = `SELECT id, username, email, phone, user_role FROM users WHERE email = $1`;
    const values = [email];
    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error("Error finding user by email");
    }
  }
}
