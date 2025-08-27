import pg from "../config/postgres";
import Notification from "../types/notification/notification.entity";

export interface NotificationSearchOptions {
    userId?: number;
    read?: boolean;
    sortBy?: 'created_at' | 'updated_at';
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
}

export default class NotificationModel {
    static db = pg;

    // ==================== Basic CRUD Operations ====================

    static async createNotification(data: Partial<Notification>): Promise<Notification> {
        const query = `
            INSERT INTO notifications (user_id, message, read) 
            VALUES ($1, $2, $3) 
            RETURNING *
        `;
        const values = [data.user_id, data.message, data.read || false];
        
        try {
            const result = await this.db.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new Error(
                `Error creating notification: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async findNotificationById(id: number): Promise<Notification | null> {
        const query = `SELECT * FROM notifications WHERE id = $1`;
        const values = [id];
        
        try {
            const result = await this.db.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(
                `Error finding notification by id: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async findNotificationsByUserId(userId: number): Promise<Notification[]> {
        const query = `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`;
        const values = [userId];
        
        try {
            const result = await this.db.query(query, values);
            return result.rows || [];
        } catch (error) {
            throw new Error(
                `Error finding notifications by user id: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async getAllNotifications(): Promise<Notification[]> {
        const query = `SELECT * FROM notifications ORDER BY created_at DESC`;
        
        try {
            const result = await this.db.query(query);
            return result.rows || [];
        } catch (error) {
            throw new Error(
                `Error getting all notifications: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async updateNotification(id: number, data: Partial<Notification>): Promise<Notification | null> {
        const dataKeys = Object.keys(data).filter(
            (key) =>
                data[key as keyof Notification] !== undefined &&
                data[key as keyof Notification] !== null
        );

        if (dataKeys.length === 0) return null;

        const setClause = dataKeys
            .map((key, index) => `${key} = $${index + 1}`)
            .join(", ");

        const values = dataKeys.map((key) => data[key as keyof Notification]);
        values.push(id);

        const query = `
            UPDATE notifications 
            SET ${setClause}, updated_at = NOW() 
            WHERE id = $${dataKeys.length + 1} 
            RETURNING *
        `;

        try {
            const result = await this.db.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(
                `Error updating notification: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async deleteNotification(id: number): Promise<void> {
        const query = `DELETE FROM notifications WHERE id = $1`;
        const values = [id];
        
        try {
            await this.db.query(query, values);
        } catch (error) {
            throw new Error(
                `Error deleting notification: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    // ==================== Notification Status Operations ====================

    static async markAsRead(id: number): Promise<Notification | null> {
        const query = `
            UPDATE notifications 
            SET read = true, updated_at = NOW() 
            WHERE id = $1 
            RETURNING *
        `;
        const values = [id];

        try {
            const result = await this.db.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(
                `Error marking notification as read: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async markAsUnread(id: number): Promise<Notification | null> {
        const query = `
            UPDATE notifications 
            SET read = false, updated_at = NOW() 
            WHERE id = $1 
            RETURNING *
        `;
        const values = [id];

        try {
            const result = await this.db.query(query, values);
            return result.rows[0] || null;
        } catch (error) {
            throw new Error(
                `Error marking notification as unread: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async markAllAsReadForUser(userId: number): Promise<void> {
        const query = `
            UPDATE notifications 
            SET read = true, updated_at = NOW() 
            WHERE user_id = $1 AND read = false
        `;
        const values = [userId];

        try {
            await this.db.query(query, values);
        } catch (error) {
            throw new Error(
                `Error marking all notifications as read: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    // ==================== Search and Filtering ====================

    static async searchNotifications(options: NotificationSearchOptions): Promise<Notification[]> {
        let baseQuery = `SELECT * FROM notifications WHERE 1=1`;
        const values: (string | number | boolean)[] = [];
        let paramCounter = 1;

        if (options.userId) {
            baseQuery += ` AND user_id = $${paramCounter}`;
            values.push(options.userId);
            paramCounter++;
        }

        if (options.read !== undefined) {
            baseQuery += ` AND read = $${paramCounter}`;
            values.push(options.read);
            paramCounter++;
        }

        // Add sorting
        const sortBy = options.sortBy || 'created_at';
        const sortOrder = options.sortOrder || 'DESC';
        baseQuery += ` ORDER BY ${sortBy} ${sortOrder}`;

        // Add pagination
        if (options.limit) {
            baseQuery += ` LIMIT $${paramCounter}`;
            values.push(options.limit);
            paramCounter++;

            if (options.offset) {
                baseQuery += ` OFFSET $${paramCounter}`;
                values.push(options.offset);
            }
        }

        try {
            const result = await this.db.query(baseQuery, values);
            return result.rows || [];
        } catch (error) {
            throw new Error(
                `Error searching notifications: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async getUnreadNotifications(userId: number): Promise<Notification[]> {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = $1 AND read = false 
            ORDER BY created_at DESC
        `;
        const values = [userId];
        
        try {
            const result = await this.db.query(query, values);
            return result.rows || [];
        } catch (error) {
            throw new Error(
                `Error getting unread notifications: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async getReadNotifications(userId: number): Promise<Notification[]> {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = $1 AND read = true 
            ORDER BY created_at DESC
        `;
        const values = [userId];
        
        try {
            const result = await this.db.query(query, values);
            return result.rows || [];
        } catch (error) {
            throw new Error(
                `Error getting read notifications: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async getRecentNotifications(userId: number, limit: number = 10): Promise<Notification[]> {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2
        `;
        const values = [userId, limit];
        
        try {
            const result = await this.db.query(query, values);
            return result.rows || [];
        } catch (error) {
            throw new Error(
                `Error getting recent notifications: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    // ==================== Analytics ====================

    static async getNotificationStatistics(userId: number): Promise<{
        total_notifications: number;
        unread_notifications: number;
        read_notifications: number;
        unread_percentage: number;
    }> {
        const query = `
            SELECT 
                COUNT(*) as total_notifications,
                COUNT(*) FILTER (WHERE read = false) as unread_notifications,
                COUNT(*) FILTER (WHERE read = true) as read_notifications
            FROM notifications 
            WHERE user_id = $1
        `;
        const values = [userId];
        
        try {
            const result = await this.db.query(query, values);
            const row = result.rows[0];
            
            const total = parseInt(row.total_notifications) || 0;
            const unread = parseInt(row.unread_notifications) || 0;
            const read = parseInt(row.read_notifications) || 0;
            const unreadPercentage = total > 0 ? (unread / total) * 100 : 0;

            return {
                total_notifications: total,
                unread_notifications: unread,
                read_notifications: read,
                unread_percentage: unreadPercentage
            };
        } catch (error) {
            throw new Error(
                `Error getting notification statistics: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async getOverallNotificationStatistics(): Promise<{
        total_notifications: number;
        total_users_with_notifications: number;
        total_unread_notifications: number;
        average_notifications_per_user: number;
    }> {
        const query = `
            SELECT 
                COUNT(*) as total_notifications,
                COUNT(DISTINCT user_id) as total_users_with_notifications,
                COUNT(*) FILTER (WHERE read = false) as total_unread_notifications
            FROM notifications
        `;
        
        try {
            const result = await this.db.query(query);
            const row = result.rows[0];
            
            const totalNotifications = parseInt(row.total_notifications) || 0;
            const totalUsers = parseInt(row.total_users_with_notifications) || 0;
            const totalUnread = parseInt(row.total_unread_notifications) || 0;
            const averagePerUser = totalUsers > 0 ? totalNotifications / totalUsers : 0;

            return {
                total_notifications: totalNotifications,
                total_users_with_notifications: totalUsers,
                total_unread_notifications: totalUnread,
                average_notifications_per_user: averagePerUser
            };
        } catch (error) {
            throw new Error(
                `Error getting overall notification statistics: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    // ==================== Bulk Operations ====================

    static async createBulkNotifications(notifications: Array<Partial<Notification>>): Promise<Notification[]> {
        if (notifications.length === 0) return [];

        const valueStrings = notifications.map((_, index) => {
            const offset = index * 3;
            return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
        }).join(', ');

        const values = notifications.flatMap(notification => [
            notification.user_id, 
            notification.message, 
            notification.read || false
        ]);

        const query = `
            INSERT INTO notifications (user_id, message, read)
            VALUES ${valueStrings}
            RETURNING *
        `;

        try {
            const result = await this.db.query(query, values);
            return result.rows || [];
        } catch (error) {
            throw new Error(
                `Error creating bulk notifications: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async deleteNotificationsByUserId(userId: number): Promise<void> {
        const query = `DELETE FROM notifications WHERE user_id = $1`;
        const values = [userId];
        
        try {
            await this.db.query(query, values);
        } catch (error) {
            throw new Error(
                `Error deleting notifications by user id: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async deleteOldNotifications(daysOld: number): Promise<number> {
        const query = `
            DELETE FROM notifications 
            WHERE created_at < NOW() - INTERVAL '${daysOld} days'
            RETURNING id
        `;
        
        try {
            const result = await this.db.query(query);
            return result.rows.length;
        } catch (error) {
            throw new Error(
                `Error deleting old notifications: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    static async getNotificationsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Notification[]> {
        const query = `
            SELECT * FROM notifications 
            WHERE user_id = $1 AND created_at BETWEEN $2 AND $3 
            ORDER BY created_at DESC
        `;
        const values = [userId, startDate, endDate];
        
        try {
            const result = await this.db.query(query, values);
            return result.rows || [];
        } catch (error) {
            throw new Error(
                `Error getting notifications by date range: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}
