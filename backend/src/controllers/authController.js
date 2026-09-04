const bcrypt = require('bcryptjs');
const { query } = require('../db/pool');
const { generateToken } = require('../middleware/auth');

async function register(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const userRes = await query(
      `INSERT INTO users (email, password_hash, name, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, phone, created_at`,
      [normalizedEmail, passwordHash, req.body.name ? req.body.name.trim() : '', req.body.phone ? req.body.phone.trim() : '']
    );
    const user = userRes.rows[0];

    // Create a starter watchlist for new user
    const wlRes = await query(
      `INSERT INTO watchlists (user_id, name)
       VALUES ($1, $2)
       RETURNING id`,
      [user.id, 'My Watchlist']
    );
    const watchlistId = wlRes.rows[0].id;

    // Seed starter stocks
    const defaultSymbols = ['NVDA', 'AAPL', 'MSFT'];
    for (const sym of defaultSymbols) {
      await query(
        `INSERT INTO watchlist_stocks (watchlist_id, symbol)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [watchlistId, sym]
      );
    }

    const token = generateToken(user);

    return res.status(201).json({
      message: 'Account created successfully.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        phone: user.phone || '',
        created_at: user.created_at,
      },
      token,
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err);
    return res.status(500).json({ error: 'Failed to register account.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Query user by email
    const userRes = await query(
      'SELECT id, email, password_hash, name, phone, created_at FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        phone: user.phone || '',
        created_at: user.created_at,
      },
      token,
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({ error: 'Failed to process login.' });
  }
}

async function getMe(req, res) {
  try {
    const userId = req.user.id;
    const userRes = await query(
      'SELECT id, email, name, phone, created_at FROM users WHERE id = $1',
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
      },
    });
  } catch (err) {
    console.error('[Auth Me Error]:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
}

module.exports = {
  register,
  login,
  getMe,
};
