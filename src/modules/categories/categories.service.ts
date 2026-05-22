import { query } from '../../config/database';
import { NotFoundError, BadRequestError } from '../../shared/errors';
import { CreateCategoryInput, UpdateCategoryInput } from './categories.validation';

export class CategoriesService {

  async list(userId: string) {
    const { rows } = await query(
      `SELECT * FROM categories 
       WHERE (user_id = $1 OR is_system = true) AND is_active = true 
       ORDER BY is_system DESC, name ASC`,
      [userId]
    );
    return rows.map(this.format);
  }

  async create(userId: string, input: CreateCategoryInput) {
    const { rows: [cat] } = await query(
      `INSERT INTO categories (user_id, name, type, icon, color)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, input.name, input.type, input.icon || 'tag', input.color || '#6366F1']
    );
    return this.format(cat);
  }

  async update(userId: string, categoryId: string, input: UpdateCategoryInput) {
    // Can't edit system categories
    const { rows: existing } = await query(
      'SELECT * FROM categories WHERE id = $1 AND user_id = $2 AND is_system = false',
      [categoryId, userId]
    );
    if (existing.length === 0) throw new NotFoundError('Category not found or is a system category.');

    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (input.name !== undefined) { sets.push(`name = $${idx++}`); params.push(input.name); }
    if (input.type !== undefined) { sets.push(`type = $${idx++}`); params.push(input.type); }
    if (input.icon !== undefined) { sets.push(`icon = $${idx++}`); params.push(input.icon); }
    if (input.color !== undefined) { sets.push(`color = $${idx++}`); params.push(input.color); }

    if (sets.length === 0) throw new BadRequestError('No fields to update.');

    params.push(categoryId, userId);
    const { rows } = await query(
      `UPDATE categories SET ${sets.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
      params
    );
    return this.format(rows[0]);
  }

  async delete(userId: string, categoryId: string) {
    const { rowCount } = await query(
      'UPDATE categories SET is_active = false WHERE id = $1 AND user_id = $2 AND is_system = false',
      [categoryId, userId]
    );
    if (!rowCount) throw new NotFoundError('Category not found or is a system category.');
    return { message: 'Category deleted.' };
  }

  private format(row: Record<string, unknown>) {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      type: row.type,
      icon: row.icon,
      color: row.color,
      isSystem: row.is_system,
      isActive: row.is_active,
      createdAt: row.created_at,
    };
  }
}

export const categoriesService = new CategoriesService();
