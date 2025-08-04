import pg from "../../config/postgres";
import Session from "types/user/sessions.entity";

export default class AuthModel {
  static db = pg;

  static async CreateSession(
    userId: number,
    sessionToken: string,
    expiresAt: Date,
  ): Promise<Partial<Session>> {
    const query = `INSERT INTO sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3) RETURNING *`;
    const values = [userId, sessionToken, expiresAt];
    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error("Error creating session:" + error);
    }
  }

  static async DeleteSession(sessionToken: string): Promise<void> {
    const query = `DELETE FROM sessions WHERE session_token = $1`;
    const values = [sessionToken];
    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error("Error deleting session" + error);
    }
  }
}
