/**
 * Notifications service — In-app notifications
 */
import { NotificationType } from '../../shared/types';
export declare class NotificationsService {
    create(userId: string, type: NotificationType, title: string, message: string, data?: any): Promise<any>;
    getUserNotifications(userId: string, limit?: number, offset?: number): Promise<{
        notifications: any[];
        unreadCount: number;
    }>;
    markAsRead(userId: string, notificationId: string): Promise<{
        message: string;
    }>;
    markAllAsRead(userId: string): Promise<{
        message: string;
    }>;
}
export declare const notificationsService: NotificationsService;
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=notifications.module.d.ts.map