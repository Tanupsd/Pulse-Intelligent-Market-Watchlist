const bcrypt = require('bcryptjs');
const { query } = require('../db/pool');

/**
 * GET /api/users/me
 * Retrieves the authenticated user's profile
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.id;
    const userRes = await query(
      'SELECT id, email, name, phone, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const row = userRes.rows[0];
    return res.status(200).json({
      user: {
        id: row.id,
        email: row.email,
        name: row.name || '',
        phone: row.phone || '',
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    });
  } catch (err) {
    console.error('[Get Profile Error]:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
}

/**
 * PUT /api/users/me
 * Updates personal profile info (name, phone, email)
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, phone, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Check if email is already used by another user
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [normalizedEmail, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim();

    if (cleanName.length > 255) {
      return res.status(400).json({ error: 'Name cannot exceed 255 characters.' });
    }
    if (cleanPhone.length > 50) {
      return res.status(400).json({ error: 'Phone cannot exceed 50 characters.' });
    }

    const updateRes = await query(
      `UPDATE users 
       SET name = $1, phone = $2, email = $3, updated_at = NOW() 
       WHERE id = $4 
       RETURNING id, email, name, phone, created_at, updated_at`,
      [cleanName, cleanPhone, normalizedEmail, userId]
    );

    const row = updateRes.rows[0];
    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: {
        id: row.id,
        email: row.email,
        name: row.name || '',
        phone: row.phone || '',
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    });
  } catch (err) {
    console.error('[Update Profile Error]:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

/**
 * PUT /api/users/me/password
 * Securely changes user password with current password verification
 */
async function updatePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const userRes = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, userId]
    );

    return res.status(200).json({
      message: 'Password updated successfully.',
    });
  } catch (err) {
    console.error('[Update Password Error]:', err);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
}

/**
 * POST /api/users/me/stock-visits
 * Records a stock visit with 60-second cooldown deduplication
 */
async function recordStockVisit(req, res) {
  try {
    const userId = req.user.id;
    const { symbol } = req.body;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Valid stock symbol is required.' });
    }

    const cleanSymbol = symbol.trim().toUpperCase();

    // Check if visit was already recorded in the last 60 seconds (deduplication)
    const recent = await query(
      `SELECT id FROM stock_visits 
       WHERE user_id = $1 AND symbol = $2 AND visited_at > NOW() - INTERVAL '60 seconds' 
       LIMIT 1`,
      [userId, cleanSymbol]
    );

    if (recent.rows.length > 0) {
      return res.status(200).json({
        message: 'Visit already recorded within cooldown window.',
        recorded: false,
        symbol: cleanSymbol,
      });
    }

    const insertRes = await query(
      `INSERT INTO stock_visits (user_id, symbol, visited_at)
       VALUES ($1, $2, NOW())
       RETURNING id, symbol, visited_at`,
      [userId, cleanSymbol]
    );

    return res.status(201).json({
      message: 'Visit recorded successfully.',
      recorded: true,
      visit: insertRes.rows[0],
    });
  } catch (err) {
    console.error('[Record Visit Error]:', err);
    return res.status(500).json({ error: 'Failed to record stock visit.' });
  }
}

/**
 * GET /api/users/me/analytics
 * Aggregates user's stock visit history
 */
async function getUserAnalytics(req, res) {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT 
         symbol, 
         COUNT(*)::int AS visits,
         MAX(visited_at) AS last_visited
       FROM stock_visits
       WHERE user_id = $1
       GROUP BY symbol
       ORDER BY visits DESC, last_visited DESC
       LIMIT 10`,
      [userId]
    );

    const totalRes = await query(
      'SELECT COUNT(*)::int AS total_visits FROM stock_visits WHERE user_id = $1',
      [userId]
    );

    return res.status(200).json({
      analytics: result.rows,
      totalVisits: totalRes.rows[0]?.total_visits || 0,
    });
  } catch (err) {
    console.error('[Get Analytics Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch user analytics.' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  updatePassword,
  recordStockVisit,
  getUserAnalytics,
};
