import { Router, Request, Response } from 'express';
import { query, getClient } from '../db.js';

const router = Router();

// Middleware helper to log audit events
async function logAudit(actorEmail: string, action: string, targetType: string, targetId?: string, metadata: any = {}) {
  try {
    await query(
      `INSERT INTO audit_logs (actor_email, action, target_type, target_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [actorEmail || 'system', action, targetType, targetId || null, JSON.stringify(metadata)]
    );
  } catch (e) {
    console.error('Failed to log audit event:', e);
  }
}

/**
 * Super Admin Overview / Telemetry
 */
router.get('/overview', async (_req: Request, res: Response): Promise<void> => {
  try {
    const countsRes = await query(`
      SELECT
        (SELECT COUNT(*) FROM profiles WHERE role = 'student' AND status = 'active') as active_students,
        (SELECT COUNT(*) FROM profiles WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM profiles WHERE role = 'growth_mentor' AND status = 'active') as active_mentors,
        (SELECT COUNT(*) FROM profiles WHERE role = 'growth_mentor') as total_mentors,
        (SELECT COUNT(*) FROM profiles WHERE role = 'campus_manager' AND status = 'active') as active_managers,
        (SELECT COUNT(*) FROM profiles WHERE role = 'campus_manager') as total_managers,
        (SELECT COUNT(*) FROM problems WHERE published = true) as published_problems,
        (SELECT COUNT(*) FROM problems) as total_problems,
        (SELECT COUNT(*) FROM submissions) as total_submissions,
        (SELECT COUNT(*) FROM submissions WHERE status = 'passed') as passed_submissions
    `);

    const stats = countsRes.rows[0];
    const totalSubmissions = parseInt(stats.total_submissions, 10) || 0;
    const passedSubmissions = parseInt(stats.passed_submissions, 10) || 0;
    const overallSuccessRate = totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0;

    res.json({
      students_count: parseInt(stats.total_students, 10),
      growth_mentors_count: parseInt(stats.total_mentors, 10),
      campus_managers_count: parseInt(stats.total_managers, 10),
      problems_count: parseInt(stats.published_problems, 10),
      total_submissions: totalSubmissions,
      overall_success_rate: overallSuccessRate,
      limits: {
        max_managers: 5,
        max_mentors: 20,
        max_students: 300
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Super Admin Users Management: List users by role
 */
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    let sql = `
      SELECT p.id, p.email, p.full_name, p.role, p.status, p.created_at, p.updated_at,
             msa.mentor_id, m.full_name as mentor_name, m.email as mentor_email,
             ss.xp, ss.problems_solved, ss.coding_streak_days, b.name as belt_name, b.color_hex as belt_color
      FROM profiles p
      LEFT JOIN mentor_student_assignments msa ON p.id = msa.student_id AND msa.is_active = true
      LEFT JOIN profiles m ON msa.mentor_id = m.id
      LEFT JOIN student_stats ss ON p.id = ss.student_id
      LEFT JOIN belts b ON ss.current_belt_id = b.id
    `;
    const params: any[] = [];

    if (role && typeof role === 'string') {
      sql += ` WHERE p.role = $1`;
      params.push(role);
    }
    sql += ` ORDER BY p.created_at DESC`;

    const result = await query(sql, params);
    res.json({ users: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Super Admin Users Management: Create user (Campus Manager, Growth Mentor, Student)
 */
router.post('/users', async (req: Request, res: Response): Promise<void> => {
  const client = await getClient();
  try {
    const { email, full_name, role, mentor_id, actor_email } = req.body;

    if (!email || !full_name || !role) {
      res.status(400).json({ error: 'Email, full name, and role are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check email uniqueness
    const checkUser = await client.query('SELECT id FROM profiles WHERE LOWER(email) = $1', [normalizedEmail]);
    if (checkUser.rows.length > 0) {
      res.status(400).json({ error: `An account with email ${normalizedEmail} already exists.` });
      return;
    }

    // Role specific capacity validations
    if (role === 'campus_manager') {
      const countRes = await client.query("SELECT COUNT(*) FROM profiles WHERE role = 'campus_manager' AND status = 'active'");
      if (parseInt(countRes.rows[0].count, 10) >= 5) {
        res.status(400).json({ error: 'Maximum capacity limit reached: Only 5 Campus Managers allowed.' });
        return;
      }
    } else if (role === 'growth_mentor') {
      const countRes = await client.query("SELECT COUNT(*) FROM profiles WHERE role = 'growth_mentor' AND status = 'active'");
      if (parseInt(countRes.rows[0].count, 10) >= 20) {
        res.status(400).json({ error: 'Maximum capacity limit reached: Only 20 Growth Mentors allowed.' });
        return;
      }
    } else if (role === 'student') {
      const countRes = await client.query("SELECT COUNT(*) FROM profiles WHERE role = 'student' AND status = 'active'");
      if (parseInt(countRes.rows[0].count, 10) >= 300) {
        res.status(400).json({ error: 'Maximum capacity limit reached: Only 300 Students allowed.' });
        return;
      }

      // MANDATORY BUSINESS RULE: Student must have a Growth Mentor
      if (!mentor_id) {
        res.status(400).json({ error: 'Growth Mentor assignment is required when creating a Student.' });
        return;
      }

      // Verify selected mentor exists and has growth_mentor role
      const mentorCheck = await client.query("SELECT id, full_name FROM profiles WHERE id = $1 AND role = 'growth_mentor' AND status = 'active'", [mentor_id]);
      if (mentorCheck.rows.length === 0) {
        res.status(400).json({ error: 'Invalid Growth Mentor selected or mentor is not active.' });
        return;
      }
    }

    await client.query('BEGIN');

    // Fetch campus id
    const campusRes = await client.query('SELECT id FROM campuses LIMIT 1');
    const campusId = campusRes.rows[0]?.id;

    // Insert user profile
    const insertProfile = await client.query(
      `INSERT INTO profiles (email, full_name, role, status, campus_id)
       VALUES ($1, $2, $3, 'active', $4)
       RETURNING id, email, full_name, role, status, created_at`,
      [normalizedEmail, full_name.trim(), role, campusId]
    );
    const newProfile = insertProfile.rows[0];

    // If Student: assign Growth Mentor and initialize Student Stats
    if (role === 'student') {
      await client.query(
        `INSERT INTO mentor_student_assignments (mentor_id, student_id, is_active)
         VALUES ($1, $2, true)`,
        [mentor_id, newProfile.id]
      );

      // Get White Belt
      const whiteBelt = await client.query("SELECT id FROM belts WHERE order_index = 1 LIMIT 1");
      const beltId = whiteBelt.rows[0]?.id;

      await client.query(
        `INSERT INTO student_stats (student_id, current_belt_id, xp, problems_solved, total_submissions, coding_streak_days)
         VALUES ($1, $2, 0, 0, 0, 0)`,
        [newProfile.id, beltId]
      );
    }

    await client.query('COMMIT');

    await logAudit(actor_email || 'super_admin', 'CREATE_USER', 'profile', newProfile.id, {
      email: newProfile.email,
      role: newProfile.role,
      mentor_id: role === 'student' ? mentor_id : undefined
    });

    res.status(201).json({ success: true, user: newProfile });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * Super Admin: Toggle user status (active / disabled)
 */
router.put('/users/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, actor_email } = req.body;

    if (!['active', 'disabled'].includes(status)) {
      res.status(400).json({ error: 'Status must be active or disabled.' });
      return;
    }

    const updated = await query(
      `UPDATE profiles SET status = $1, updated_at = now() WHERE id = $2 RETURNING id, email, full_name, role, status`,
      [status, id]
    );

    if (updated.rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    await logAudit(actor_email || 'super_admin', 'UPDATE_USER_STATUS', 'profile', id, { status });
    res.json({ success: true, user: updated.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Super Admin: Reassign student Growth Mentor
 */
router.put('/students/:id/reassign-mentor', async (req: Request, res: Response): Promise<void> => {
  const client = await getClient();
  try {
    const { id: studentId } = req.params;
    const { new_mentor_id, actor_email } = req.body;

    if (!new_mentor_id) {
      res.status(400).json({ error: 'New Growth Mentor ID is required.' });
      return;
    }

    // Verify mentor
    const mentorCheck = await client.query("SELECT id, full_name FROM profiles WHERE id = $1 AND role = 'growth_mentor' AND status = 'active'", [new_mentor_id]);
    if (mentorCheck.rows.length === 0) {
      res.status(400).json({ error: 'Target Growth Mentor is not active or not found.' });
      return;
    }

    await client.query('BEGIN');

    // Deactivate current active mentor assignment
    await client.query(
      `UPDATE mentor_student_assignments 
       SET is_active = false 
       WHERE student_id = $1 AND is_active = true`,
      [studentId]
    );

    // Insert new active mentor assignment
    await client.query(
      `INSERT INTO mentor_student_assignments (mentor_id, student_id, is_active)
       VALUES ($1, $2, true)`,
      [new_mentor_id, studentId]
    );

    await client.query('COMMIT');

    await logAudit(actor_email || 'super_admin', 'REASSIGN_MENTOR', 'mentor_student_assignment', studentId, {
      student_id: studentId,
      new_mentor_id: new_mentor_id,
      new_mentor_name: mentorCheck.rows[0].full_name
    });

    res.json({ success: true, message: 'Student reassigned successfully.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * Super Admin: Growth Mentor to Student Tree View
 */
router.get('/mentor-tree', async (_req: Request, res: Response): Promise<void> => {
  try {
    const mentorsRes = await query(`
      SELECT id, email, full_name, status
      FROM profiles
      WHERE role = 'growth_mentor'
      ORDER BY full_name ASC
    `);

    const studentsRes = await query(`
      SELECT p.id, p.email, p.full_name, p.status, msa.mentor_id,
             ss.xp, ss.problems_solved, b.name as belt_name, b.color_hex as belt_color
      FROM profiles p
      JOIN mentor_student_assignments msa ON p.id = msa.student_id AND msa.is_active = true
      LEFT JOIN student_stats ss ON p.id = ss.student_id
      LEFT JOIN belts b ON ss.current_belt_id = b.id
      WHERE p.role = 'student'
      ORDER BY p.full_name ASC
    `);

    const tree = mentorsRes.rows.map(mentor => ({
      mentor_id: mentor.id,
      mentor_name: mentor.full_name,
      mentor_email: mentor.email,
      status: mentor.status,
      students: studentsRes.rows.filter(s => s.mentor_id === mentor.id)
    }));

    res.json({ tree });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Super Admin: Problems List
 */
router.get('/problems', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query(`
      SELECT p.*,
             (SELECT COUNT(*) FROM problem_languages pl WHERE pl.problem_id = p.id) as language_count,
             (SELECT array_agg(language) FROM problem_languages pl WHERE pl.problem_id = p.id) as languages
      FROM problems p
      ORDER BY p.order_index ASC, p.created_at DESC
    `);
    res.json({ problems: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Super Admin: Get Full Problem Details with all Languages & 10 Test Cases
 */
router.get('/problems/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const problemRes = await query('SELECT * FROM problems WHERE id = $1', [id]);
    if (problemRes.rows.length === 0) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    const problem = problemRes.rows[0];

    const langRes = await query(`
      SELECT pl.*, 
             json_agg(tc.* ORDER BY tc.order_index ASC) as test_cases
      FROM problem_languages pl
      LEFT JOIN test_cases tc ON pl.id = tc.problem_language_id
      WHERE pl.problem_id = $1
      GROUP BY pl.id
    `, [id]);

    const languages: Record<string, any> = {};
    for (const row of langRes.rows) {
      languages[row.language] = {
        ...row,
        test_cases: row.test_cases?.[0]?.id ? row.test_cases : []
      };
    }

    res.json({ problem: { ...problem, languages } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Super Admin: Create Problem (Problem Builder)
 */
router.post('/problems', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, difficulty, description, input_format, output_format, constraints, sample_explanation, topics, order_index, actor_email } = req.body;

    if (!title || !difficulty || !description) {
      res.status(400).json({ error: 'Title, difficulty, and description are required.' });
      return;
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const insertRes = await query(
      `INSERT INTO problems (title, slug, difficulty, description, input_format, output_format, constraints, sample_explanation, topics, published, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10)
       RETURNING *`,
      [title.trim(), slug, difficulty, description, input_format || '', output_format || '', constraints || '', sample_explanation || '', topics || [], order_index || 0]
    );

    const problem = insertRes.rows[0];
    await logAudit(actor_email || 'super_admin', 'CREATE_PROBLEM', 'problem', problem.id, { title: problem.title });

    res.status(201).json({ success: true, problem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Super Admin: Save Language Configuration and its exactly 10 Test Cases (3 visible, 7 hidden)
 */
router.post('/problems/:id/languages/:language', async (req: Request, res: Response): Promise<void> => {
  const client = await getClient();
  try {
    const { id: problemId, language } = req.params;
    const { starter_code, time_limit_ms, memory_limit_mb, test_cases, actor_email } = req.body;

    if (!['python', 'cpp', 'java', 'javascript'].includes(language)) {
      res.status(400).json({ error: 'Unsupported language.' });
      return;
    }

    if (!starter_code) {
      res.status(400).json({ error: 'Starter code is required.' });
      return;
    }

    if (!Array.isArray(test_cases) || test_cases.length !== 10) {
      res.status(400).json({ error: 'Exactly 10 test cases are required for each language (3 visible and 7 hidden).' });
      return;
    }

    const visibleCount = test_cases.filter((t: any) => !t.is_hidden).length;
    const hiddenCount = test_cases.filter((t: any) => t.is_hidden).length;
    if (visibleCount !== 3 || hiddenCount !== 7) {
      res.status(400).json({ error: `Test case distribution must be exactly 3 visible and 7 hidden (Got ${visibleCount} visible, ${hiddenCount} hidden).` });
      return;
    }

    await client.query('BEGIN');

    // Insert or update problem language
    const langRes = await client.query(`
      INSERT INTO problem_languages (problem_id, language, starter_code, time_limit_ms, memory_limit_mb)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (problem_id, language) DO UPDATE
      SET starter_code = EXCLUDED.starter_code, time_limit_ms = EXCLUDED.time_limit_ms, memory_limit_mb = EXCLUDED.memory_limit_mb
      RETURNING id;
    `, [problemId, language, starter_code, time_limit_ms || 2000, memory_limit_mb || 256]);

    const problemLanguageId = langRes.rows[0].id;

    // Replace test cases
    await client.query('DELETE FROM test_cases WHERE problem_language_id = $1', [problemLanguageId]);

    for (let i = 0; i < test_cases.length; i++) {
      const tc = test_cases[i];
      await client.query(`
        INSERT INTO test_cases (problem_language_id, input, expected_output, is_hidden, order_index)
        VALUES ($1, $2, $3, $4, $5)
      `, [problemLanguageId, tc.input, tc.expected_output, i >= 3, i + 1]);
    }

    await client.query('COMMIT');

    await logAudit(actor_email || 'super_admin', 'CONFIG_PROBLEM_LANGUAGE', 'problem_language', problemLanguageId, {
      problem_id: problemId,
      language,
      test_cases_count: 10
    });

    res.json({ success: true, message: `Configuration for ${language} saved with 10 test cases.` });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * Super Admin: Publish Problem (Strict validation: checks at least 1 language with 10 test cases)
 */
router.put('/problems/:id/publish', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { published, actor_email } = req.body;

    if (published) {
      // Validate that at least one language is configured with 10 test cases
      const testCasesCheck = await query(`
        SELECT pl.language, COUNT(tc.id) as count,
               COUNT(CASE WHEN tc.is_hidden = false THEN 1 END) as visible_count,
               COUNT(CASE WHEN tc.is_hidden = true THEN 1 END) as hidden_count
        FROM problem_languages pl
        LEFT JOIN test_cases tc ON pl.id = tc.problem_language_id
        WHERE pl.problem_id = $1
        GROUP BY pl.language
      `, [id]);

      if (testCasesCheck.rows.length === 0) {
        res.status(400).json({ error: 'Cannot publish problem: No language configurations added.' });
        return;
      }

      const validLangs = testCasesCheck.rows.filter(r => parseInt(r.count, 10) === 10 && parseInt(r.visible_count, 10) === 3 && parseInt(r.hidden_count, 10) === 7);
      if (validLangs.length === 0) {
        res.status(400).json({ error: 'Cannot publish problem: Every configured language must contain exactly 10 test cases (3 visible, 7 hidden).' });
        return;
      }
    }

    const updated = await query(`UPDATE problems SET published = $1 WHERE id = $2 RETURNING *`, [Boolean(published), id]);
    await logAudit(actor_email || 'super_admin', published ? 'PUBLISH_PROBLEM' : 'UNPUBLISH_PROBLEM', 'problem', id);

    res.json({ success: true, problem: updated.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Super Admin: Audit Logs List
 */
router.get('/audit-logs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const logs = await query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`);
    res.json({ logs: logs.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
