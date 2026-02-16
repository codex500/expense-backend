/**
 * Streak Service - Gamification system for tracking consecutive days
 */

const pool = require('../config/database');

/**
 * Update user streak when transaction is added
 */
async function updateStreak(userId, transactionDate) {
  try {
    const date = new Date(transactionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    // Get current streak
    const streakResult = await pool.query(
      'SELECT current_streak, last_entry_date, longest_streak FROM user_streaks WHERE user_id = $1',
      [userId]
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let lastEntryDate = null;

    if (streakResult.rows.length > 0) {
      currentStreak = streakResult.rows[0].current_streak || 0;
      longestStreak = streakResult.rows[0].longest_streak || 0;
      lastEntryDate = streakResult.rows[0].last_entry_date 
        ? new Date(streakResult.rows[0].last_entry_date)
        : null;
    }

    // Calculate days difference
    const daysDiff = lastEntryDate 
      ? Math.floor((date - lastEntryDate) / (1000 * 60 * 60 * 24))
      : null;

    // Update streak logic
    if (!lastEntryDate) {
      // First entry
      currentStreak = 1;
    } else if (daysDiff === 0) {
      // Same day - no change
      return { current_streak: currentStreak, longest_streak: longestStreak };
    } else if (daysDiff === 1) {
      // Consecutive day - increment
      currentStreak += 1;
    } else {
      // Gap - reset streak
      currentStreak = 1;
    }

    // Update longest streak
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Upsert streak record
    await pool.query(
      `INSERT INTO user_streaks (user_id, current_streak, last_entry_date, longest_streak, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         current_streak = EXCLUDED.current_streak,
         last_entry_date = EXCLUDED.last_entry_date,
         longest_streak = EXCLUDED.longest_streak,
         updated_at = NOW()`,
      [userId, currentStreak, date.toISOString().slice(0, 10), longestStreak]
    );

    return {
      current_streak: currentStreak,
      longest_streak: longestStreak,
    };
  } catch (err) {
    console.error('[StreakService] Error:', err.message);
    throw err;
  }
}

/**
 * Get user streak
 */
async function getUserStreak(userId) {
  try {
    const result = await pool.query(
      'SELECT current_streak, longest_streak, last_entry_date FROM user_streaks WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        current_streak: 0,
        longest_streak: 0,
        last_entry_date: null,
      };
    }

    return {
      current_streak: result.rows[0].current_streak || 0,
      longest_streak: result.rows[0].longest_streak || 0,
      last_entry_date: result.rows[0].last_entry_date,
    };
  } catch (err) {
    console.error('[StreakService] Error:', err.message);
    throw err;
  }
}

module.exports = { updateStreak, getUserStreak };
