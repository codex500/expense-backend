import { query } from '../../config/database';

export class AdvisorService {
  async getInsights(userId: string) {
    // Generate basic insights based on user data
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    
    const { rows: categoryData } = await query<{
      category: string;
      total: string;
    }>(
      `SELECT category, COALESCE(SUM(amount_paise), 0) AS total
       FROM transactions
       WHERE user_id = $1 AND type = 'expense'
         AND transaction_date >= $2
       GROUP BY category
       ORDER BY total DESC
       LIMIT 3`,
      [userId, currentMonth]
    );

    const insights = [
      "Trackify is monitoring your spending patterns to provide tailored advice."
    ];
    
    if (categoryData.length > 0) {
      const topCategory = categoryData[0];
      const amountStr = (Number(topCategory.total) / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
      insights.push(`Your highest spending category this month is ${topCategory.category} (${amountStr}).`);
    }

    return {
      insights,
      warnings: [],
      suggestions: [
        "Consider setting up a budget for your top spending categories.",
        "Log your expenses daily for the most accurate insights."
      ]
    };
  }
}

export const advisorService = new AdvisorService();