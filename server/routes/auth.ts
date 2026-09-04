import { Router, Request, Response } from 'express';
import { query } from '../db.js';

const router = Router();

/**
 * Whitelist verification for Google accounts
 * Checks if the Google authenticated email exists in Kalvi Learn database
 */
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required for authentication.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query database for the user profile
    const profileRes = await query(
      `SELECT p.id, p.email, p.full_name, p.role, p.status, p.campus_id, p.avatar_url,
              c.name as campus_name, c.code as campus_code
       FROM profiles p
       LEFT JOIN campuses c ON p.campus_id = c.id
       WHERE LOWER(p.email) = $1`,
      [normalizedEmail]
    );

    if (profileRes.rows.length === 0) {
      // Mandated rejection message
      res.status(403).json({
        error: 'Your Google account is not registered on Kalvi Learn. Please contact the administrator.',
        registered: false
      });
      return;
    }

    const profile = profileRes.rows[0];

    if (profile.status === 'disabled') {
      res.status(403).json({
        error: 'Your account has been disabled. Please contact the administrator.',
        registered: true,
        disabled: true
      });
      return;
    }

    // If student, fetch assigned Growth Mentor
    let mentor = null;
    if (profile.role === 'student') {
      const mentorRes = await query(
        `SELECT m.id, m.full_name, m.email
         FROM mentor_student_assignments msa
         JOIN profiles m ON msa.mentor_id = m.id
         WHERE msa.student_id = $1 AND msa.is_active = true
         LIMIT 1`,
        [profile.id]
      );
      if (mentorRes.rows.length > 0) {
        mentor = mentorRes.rows[0];
      }
    }

    res.json({
      success: true,
      profile: {
        ...profile,
        mentor
      }
    });
  } catch (err: any) {
    console.error('Auth verification error:', err);
    res.status(500).json({ error: 'Authentication service encountered an error.' });
  }
});

/**
 * Development / testing endpoint: list registered user profiles
 */
router.get('/registered-users', async (_req: Request, res: Response): Promise<void> => {
  try {
    const usersRes = await query(
      `SELECT id, email, full_name, role, status FROM profiles ORDER BY created_at ASC`
    );
    res.json({ users: usersRes.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
