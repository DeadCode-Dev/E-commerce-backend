import pg from "../../config/postgres";
import Session from "types/user/sessions.entity";

export default class AuthModel {
  static db = pg;

  // Create session only if token doesn't exist
  static async CreateSession(
    userId: number,
    sessionToken: string,
    expiresAt: Date,
  ): Promise<Partial<Session> | null> {
    const query = `
      INSERT INTO sessions (user_id, session_token, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (session_token) DO NOTHING
      RETURNING *;
    `;
    const values = [userId, sessionToken, expiresAt];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null; // null if already exists
    } catch (error) {
      throw new Error("Error creating session: " + error);
    }
  }

  // Get session and auto-delete expired
  static async GetSession(sessionToken: string): Promise<Session| null> {
    const query = `SELECT * FROM sessions WHERE session_token = $1 LIMIT 1`;
    const values = [sessionToken];

    try {
      const result = await this.db.query(query, values);
      if (result.rows.length === 0) return null;

      const session = result.rows[0];
      const now = new Date();

      if (new Date(session.expires_at) < now) {
        // expired -> delete immediately
        await this.DeleteSession(sessionToken);
        return null;
      }

      return session;
    } catch (error) {
      throw new Error("Error fetching session: " + error);
    }
  }

  // Explicit delete
  static async DeleteSession(sessionToken: string): Promise<void> {
    const query = `DELETE FROM sessions WHERE session_token = $1`;
    const values = [sessionToken];
    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error("Error deleting session: " + error);
    }
  }
}
