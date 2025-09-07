import pg from "../config/postgres";
import Sessions from "../types/user/sessions.entity";

export default class SessionsModel {
  static db = pg;

  // ==================== Basic CRUD Operations ====================

  static async createSession(data: {
    user_id: number;
    session_token: string;
    expires_at: Date;
    refresh_token?: string;
    ip_address?: string;
    user_agent?: string;
    device_type?: string;
    location?: string;
    is_active?: boolean;
  }): Promise<Sessions> {
    const query = `
            INSERT INTO sessions (
                user_id, session_token, expires_at, refresh_token, 
                ip_address, user_agent, device_type, location, is_active
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *
        `;
    const values = [
      data.user_id,
      data.session_token,
      data.expires_at,
      data.refresh_token || null,
      data.ip_address || null,
      data.user_agent || null,
      data.device_type || null,
      data.location || null,
      data.is_active !== undefined ? data.is_active : true,
    ];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(
        `Error creating session: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Legacy method for backward compatibility
  static async CreateSession(
    userId: number,
    sessionToken: string,
    expiresAt: Date,
  ): Promise<Sessions | null> {
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

  static async findSessionById(id: number): Promise<Sessions | null> {
    const query = `SELECT * FROM sessions WHERE id = $1`;
    const values = [id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding session by id: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async findSessionByToken(
    sessionToken: string,
  ): Promise<Sessions | null> {
    const query = `SELECT * FROM sessions WHERE session_token = $1`;
    const values = [sessionToken];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding session by token: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Legacy method for backward compatibility
  static async GetSession(sessionToken: string): Promise<Sessions | null> {
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

  static async findSessionByRefreshToken(
    refreshToken: string,
  ): Promise<Sessions | null> {
    const query = `SELECT * FROM sessions WHERE refresh_token = $1`;
    const values = [refreshToken];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error finding session by refresh token: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async findActiveSessionsByUserId(userId: number): Promise<Sessions[]> {
    const query = `
            SELECT * FROM sessions 
            WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
            ORDER BY created_at DESC
        `;
    const values = [userId];

    try {
      const result = await this.db.query(query, values);
      return result.rows || [];
    } catch (error) {
      throw new Error(
        `Error finding active sessions by user id: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async updateSession(
    id: number,
    data: Partial<Sessions>,
  ): Promise<Sessions | null> {
    const dataKeys = Object.keys(data).filter(
      (key) =>
        data[key as keyof Sessions] !== undefined &&
        data[key as keyof Sessions] !== null &&
        data[key as keyof Sessions] !== "",
    );

    if (dataKeys.length === 0) return null;

    const setClause = dataKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ");

    const values = dataKeys.map((key) => data[key as keyof Sessions]);
    values.push(id);

    const query = `
            UPDATE sessions 
            SET ${setClause}, updated_at = NOW() 
            WHERE id = $${dataKeys.length + 1} 
            RETURNING *
        `;

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error updating session: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async deleteSession(id: number): Promise<void> {
    const query = `DELETE FROM sessions WHERE id = $1`;
    const values = [id];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting session: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async deleteSessionByToken(sessionToken: string): Promise<void> {
    const query = `DELETE FROM sessions WHERE session_token = $1`;
    const values = [sessionToken];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deleting session by token: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Legacy method for backward compatibility
  static async DeleteSession(sessionToken: string): Promise<void> {
    const query = `DELETE FROM sessions WHERE session_token = $1`;
    const values = [sessionToken];
    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error("Error deleting session: " + error);
    }
  }

  // ==================== Session Management Operations ====================

  static async deactivateSession(id: number): Promise<Sessions | null> {
    const query = `
            UPDATE sessions 
            SET is_active = false, updated_at = NOW() 
            WHERE id = $1 
            RETURNING *
        `;
    const values = [id];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error deactivating session: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async deactivateAllUserSessions(userId: number): Promise<void> {
    const query = `
            UPDATE sessions 
            SET is_active = false, updated_at = NOW() 
            WHERE user_id = $1 AND is_active = true
        `;
    const values = [userId];

    try {
      await this.db.query(query, values);
    } catch (error) {
      throw new Error(
        `Error deactivating all user sessions: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async validateSession(sessionToken: string): Promise<Sessions | null> {
    const query = `
            SELECT * FROM sessions 
            WHERE session_token = $1 AND is_active = true AND expires_at > NOW()
        `;
    const values = [sessionToken];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(
        `Error validating session: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async cleanupExpiredSessions(): Promise<number> {
    const query = `DELETE FROM sessions WHERE expires_at <= NOW()`;

    try {
      const result = await this.db.query(query);
      return result.rowCount || 0;
    } catch (error) {
      throw new Error(
        `Error cleaning up expired sessions: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async getSessionStatistics(): Promise<{
    total_sessions: number;
    active_sessions: number;
    expired_sessions: number;
    unique_users_with_sessions: number;
  }> {
    const totalQuery = `SELECT COUNT(*) as total_sessions FROM sessions`;
    const activeQuery = `SELECT COUNT(*) as active_sessions FROM sessions WHERE is_active = true AND expires_at > NOW()`;
    const expiredQuery = `SELECT COUNT(*) as expired_sessions FROM sessions WHERE expires_at <= NOW()`;
    const uniqueUsersQuery = `SELECT COUNT(DISTINCT user_id) as unique_users FROM sessions`;

    try {
      const [totalResult, activeResult, expiredResult, uniqueUsersResult] =
        await Promise.all([
          this.db.query(totalQuery),
          this.db.query(activeQuery),
          this.db.query(expiredQuery),
          this.db.query(uniqueUsersQuery),
        ]);

      return {
        total_sessions: parseInt(totalResult.rows[0].total_sessions) || 0,
        active_sessions: parseInt(activeResult.rows[0].active_sessions) || 0,
        expired_sessions: parseInt(expiredResult.rows[0].expired_sessions) || 0,
        unique_users_with_sessions:
          parseInt(uniqueUsersResult.rows[0].unique_users) || 0,
      };
    } catch (error) {
      throw new Error(
        `Error getting session statistics: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
