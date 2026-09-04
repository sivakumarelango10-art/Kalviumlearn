import { Router, Request, Response } from 'express';
import { query } from '../db.js';

const router = Router();

/**
 * Student Dashboard Overview
 */
router.get('/dashboard/:studentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    // Fetch student profile & assigned mentor
    const studentRes = await query(`
      SELECT s.id, s.full_name, s.email, s.status,
             m.id as mentor_id, m.full_name as mentor_name, m.email as mentor_email,
             ss.xp, ss.problems_solved, ss.coding_streak_days as streak, ss.learning_progress_pct,
             b.id as belt_id, b.name as belt_name, b.color_hex as belt_color, b.order_index as belt_rank, b.min_xp,
             (SELECT COUNT(*) FROM submissions WHERE student_id = s.id) as total_submissions,
             (SELECT COUNT(*) FROM submissions WHERE student_id = s.id AND status = 'passed') as passed_submissions
      FROM profiles s
      LEFT JOIN mentor_student_assignments msa ON s.id = msa.student_id AND msa.is_active = true
      LEFT JOIN profiles m ON msa.mentor_id = m.id
      LEFT JOIN student_stats ss ON s.id = ss.student_id
      LEFT JOIN belts b ON ss.current_belt_id = b.id
      WHERE s.id = $1 AND s.role = 'student'
    `, [studentId]);

    if (studentRes.rows.length === 0) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const student = studentRes.rows[0];
    const totalSubs = parseInt(student.total_submissions, 10);
    const passedSubs = parseInt(student.passed_submissions, 10);
    const successRate = totalSubs > 0 ? Math.round((passedSubs / totalSubs) * 100) : 0;

    // Next belt determination
    const nextBeltRes = await query(`
      SELECT id, name, min_xp, min_problems, color_hex, order_index
      FROM belts
      WHERE order_index > $1
      ORDER BY order_index ASC
      LIMIT 1
    `, [student.belt_rank || 1]);

    const nextBelt = nextBeltRes.rows[0] || null;
    let nextBeltProgressPct = 100;
    if (nextBelt) {
      const currentMin = student.min_xp || 0;
      const targetMin = nextBelt.min_xp;
      const diff = targetMin - currentMin;
      const currentProgress = (student.xp || 0) - currentMin;
      nextBeltProgressPct = diff > 0 ? Math.min(100, Math.max(0, Math.round((currentProgress / diff) * 100))) : 100;
    }

    // Achievements unlocked and upcoming
    const achRes = await query(`
      SELECT a.*, sa.unlocked_at
      FROM achievements a
      LEFT JOIN student_achievements sa ON a.id = sa.achievement_id AND sa.student_id = $1
      ORDER BY sa.unlocked_at DESC NULLS LAST, a.requirement_value ASC
    `, [studentId]);

    // Topic Performance
    const topicPerformance = [
      { topic: 'Loops & Iteration', mastery_pct: 92, weak: false },
      { topic: 'Arrays & Slicing', mastery_pct: 84, weak: false },
      { topic: 'Strings & Parsing', mastery_pct: 78, weak: false },
      { topic: 'Functions & Scope', mastery_pct: 71, weak: false },
      { topic: 'Recursion & Backtracking', mastery_pct: 43, weak: true },
    ];

    // Continue Learning recommendation
    const continueLearning = {
      course_title: 'Python Programming Fundamentals',
      module_title: 'Control Flow & Nested Loops',
      current_unit: 'Numbers in Right Angled Triangle',
      progress_label: '8 / 10 lessons completed'
    };

    // Recommended Practice Problem
    const recommendedProblemRes = await query(`
      SELECT p.id, p.title, p.difficulty, p.topics
      FROM problems p
      WHERE p.published = true
      ORDER BY p.order_index ASC
      LIMIT 1
    `);

    res.json({
      student: {
        id: student.id,
        name: student.full_name,
        email: student.email,
        growth_mentor: student.mentor_name ? {
          id: student.mentor_id,
          name: student.mentor_name,
          email: student.mentor_email
        } : null,
        belt: {
          name: student.belt_name || 'White Belt',
          color: student.belt_color || '#E4E4E7',
          rank: student.belt_rank || 1,
          next_belt: nextBelt ? nextBelt.name : 'Master',
          progress_pct: nextBeltProgressPct
        },
        xp: student.xp || 0,
        problems_solved: student.problems_solved || 0,
        streak_days: student.streak || 0,
        learning_progress_pct: Math.round(parseFloat(student.learning_progress_pct || 0)),
        success_rate: successRate,
        total_submissions: totalSubs
      },
      topic_performance: topicPerformance,
      continue_learning: continueLearning,
      recommended_problem: recommendedProblemRes.rows[0] || null,
      achievements: achRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Student: Practice Problems Directory (Published problems only)
 */
router.get('/practice/problems', async (_req: Request, res: Response): Promise<void> => {
  try {
    const problemsRes = await query(`
      SELECT p.id, p.title, p.slug, p.difficulty, p.topics, p.order_index,
             array_agg(pl.language) as languages
      FROM problems p
      LEFT JOIN problem_languages pl ON p.id = pl.problem_id
      WHERE p.published = true
      GROUP BY p.id
      ORDER BY p.order_index ASC, p.created_at ASC
    `);

    res.json({ problems: problemsRes.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Student: Open Practice Problem Coding Session
 * CRITICAL SECURITY: This endpoint sends strictly the 3 visible test cases.
 * Hidden test cases (is_hidden = true) are NEVER sent to the client!
 */
router.get('/practice/problems/:id/session', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: problemId } = req.params;
    const { student_id: studentId, language = 'python' } = req.query;

    const problemRes = await query(`
      SELECT id, title, slug, difficulty, description, input_format, output_format, constraints, sample_explanation, topics
      FROM problems
      WHERE id = $1 AND published = true
    `, [problemId]);

    if (problemRes.rows.length === 0) {
      res.status(404).json({ error: 'Problem not found or not published' });
      return;
    }

    const problem = problemRes.rows[0];

    // Fetch language configuration
    const langRes = await query(`
      SELECT id, language, starter_code, time_limit_ms, memory_limit_mb
      FROM problem_languages
      WHERE problem_id = $1 AND language = $2
    `, [problemId, language]);

    if (langRes.rows.length === 0) {
      res.status(404).json({ error: `Language configuration for ${language} is not available for this problem.` });
      return;
    }

    const langConfig = langRes.rows[0];

    // FETCH ONLY VISIBLE TEST CASES (is_hidden = false)
    // Server-side enforcement: Hidden test cases are completely omitted!
    const testCasesRes = await query(`
      SELECT id, input, expected_output, is_hidden, order_index
      FROM test_cases
      WHERE problem_language_id = $1 AND is_hidden = false
      ORDER BY order_index ASC
      LIMIT 3
    `, [langConfig.id]);

    // Fetch student's previous session draft code if exists
    let activeCode = langConfig.starter_code;
    if (studentId) {
      const sessionRes = await query(`
        SELECT current_code FROM coding_sessions
        WHERE student_id = $1 AND problem_id = $2 AND language = $3
      `, [studentId, problemId, language]);

      if (sessionRes.rows.length > 0 && sessionRes.rows[0].current_code) {
        activeCode = sessionRes.rows[0].current_code;
      }
    }

    res.json({
      problem,
      language: langConfig.language,
      starter_code: langConfig.starter_code,
      current_code: activeCode,
      time_limit_ms: langConfig.time_limit_ms,
      // Exactly 3 visible test cases
      visible_test_cases: testCasesRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Student: Save Coding Session Draft
 */
router.post('/practice/problems/:id/session', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: problemId } = req.params;
    const { student_id, language, code } = req.body;

    if (!student_id || !language || code === undefined) {
      res.status(400).json({ error: 'Missing session parameters' });
      return;
    }

    await query(`
      INSERT INTO coding_sessions (student_id, problem_id, language, current_code, updated_at)
      VALUES ($1, $2, $3, $4, now())
      ON CONFLICT (student_id, problem_id, language) DO UPDATE
      SET current_code = EXCLUDED.current_code, updated_at = now()
    `, [student_id, problemId, language, code]);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Student: Revise ("Problems I have already solved")
 */
router.get('/revise/:studentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    const solvedRes = await query(`
      SELECT sp.id, sp.problem_id, sp.language, sp.first_solved_at,
             p.title as problem_title, p.difficulty, p.description,
             sub.id as best_submission_id, sub.code as solved_code, sub.runtime_ms, sub.created_at as submission_time
      FROM solved_problems sp
      JOIN problems p ON sp.problem_id = p.id
      LEFT JOIN submissions sub ON sp.best_submission_id = sub.id
      WHERE sp.student_id = $1
      ORDER BY sp.first_solved_at DESC
    `, [studentId]);

    res.json({ solved_problems: solvedRes.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
