const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

const router = express.Router();

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Hisob faol emas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
    }

    // Update last login
    await supabase.from('users').update({ last_login_at: new Date() }).eq('id', user.id);

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Get employee data if exists
    const { data: employee } = await supabase
      .from('employees')
      .select('id, employee_code, branch_id, department_id, manager_id')
      .eq('user_id', user.id)
      .single();

    await logAction(user.id, 'LOGIN', 'users', user.id, null, null, req.ip);

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        employeeId: employee?.id || null,
        branchId: employee?.branch_id || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: employee } = await supabase
      .from('employees')
      .select(`
        id, employee_code, employee_role, employment_status,
        branch:branches(id, branch_name),
        department:departments(id, department_name),
        current_level:career_levels(id, level_name),
        career_track:career_tracks(id, track_name),
        manager:employees!manager_id(id, full_name)
      `)
      .eq('user_id', req.user.id)
      .single();

    res.json({
      user: {
        ...req.user,
        employee: employee || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  await logAction(req.user.id, 'LOGOUT', 'users', req.user.id);
  res.json({ message: 'Muvaffaqiyatli chiqildi' });
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, [
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 8 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    const isValid = await bcrypt.compare(req.body.currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Joriy parol noto\'g\'ri' });
    }

    const newHash = await bcrypt.hash(req.body.newPassword, 12);
    await supabase.from('users').update({ password_hash: newHash }).eq('id', req.user.id);

    await logAction(req.user.id, 'PASSWORD_CHANGED', 'users', req.user.id);
    res.json({ message: 'Parol muvaffaqiyatli o\'zgartirildi' });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
});

module.exports = router;
