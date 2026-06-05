import { query } from '../../config/database';

export class ContactService {
  async saveFeedback(
    userId: string | null,
    rating: number,
    category: string,
    message: string,
    deviceInfo?: Record<string, any>
  ) {
    const { rows } = await query(
      `INSERT INTO feedbacks (user_id, rating, category, message, device_info)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, rating, category, message, deviceInfo || null]
    );
    return rows[0];
  }
}

export const contactService = new ContactService();
