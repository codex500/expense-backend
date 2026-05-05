import { query } from '../../config/database';
import { BadRequestError } from '../../shared/errors';
import { UpdateSettingsInput } from './settings.validation';

export class SettingsService {
  async getSettings(userId: string) {
    const { rows } = await query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (rows.length === 0) {
      // Auto-create default settings
      const { rows: newRows } = await query(
        `INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *`,
        [userId]
      );
      return this.mapToDto(newRows[0]);
    }

    return this.mapToDto(rows[0]);
  }

  async updateSettings(userId: string, input: UpdateSettingsInput) {
    // Ensure settings exist
    await this.getSettings(userId);

    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;

    const fieldMap: Record<string, string> = {
      emailNotifications: 'email_notifications',
      pushNotifications: 'push_notifications',
      darkMode: 'dark_mode',
      currency: 'currency',
      language: 'language',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if ((input as any)[key] !== undefined) {
        sets.push(`${col} = $${i++}`);
        params.push((input as any)[key]);
      }
    }

    if (sets.length === 0) throw new BadRequestError('No settings to update.');

    params.push(userId);
    const { rows } = await query(
      `UPDATE user_settings SET ${sets.join(', ')}, updated_at = NOW() WHERE user_id = $${i} RETURNING *`,
      params
    );

    return this.mapToDto(rows[0]);
  }

  private mapToDto(row: any) {
    return {
      emailNotifications: row.email_notifications,
      pushNotifications: row.push_notifications,
      darkMode: row.dark_mode,
      currency: row.currency,
      language: row.language,
      updatedAt: row.updated_at,
    };
  }
}

export const settingsService = new SettingsService();
