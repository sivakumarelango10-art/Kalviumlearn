import { Router, Request, Response } from 'express';
import { query, getClient } from '../db.js';
import { runCodeAgainstTestCases, ExecutionTestCase } from '../services/execution.js';

const router = Router();

/**
 * RUN CODE: Used during practice/development against visible test cases ONLY
 */
router.post('/run', async (req: Request, res: Response): Promise<void> => {
  try {
    const { problem_id, language, code, student_id } = req.body;

    if (!problem_id || !language || !code) {
      res.status(400).json({ error: 'Missing execution parameters (problem_id, language, code).' });
      return;
    }

    // Fetch problem language configuration
    const langRes = await query(`
      SELECT id, time_limit_ms FROM problem_languages
      WHERE problem_id = $1 AND language = $2
    `, [problem_id, language]);

    if (langRes.rows.length === 0) {
      res.status(404).json({ error: `Language ${language} not configured for this problem.` });
      return;
    }

    const langConfig = langRes.rows[0];

    // Strictly fetch 3 visible test cases only
    const tcRes = await query(`
      SELECT id, input, expected_output, is_hidden, order_index
      FROM test_cases
      WHERE problem_language_id = $1 AND is_hidden = false
      ORDER BY order_index ASC
      LIMIT 3
    `, [langConfig.id]);

    if (tcRes.rows.length === 0) {
      res.status(400).json({ error: 'No visible test cases found for execution.' });
      return;
    }

    const testCases: ExecutionTestCase[] = tcRes.rows.map(r => ({
      id: r.id,
      input: r.input,
      expected_output: r.expected_output,
      is_hidden: false,
      order_index: r.order_index
    }));

    // Run execution
    const result = await runCodeAgainstTestCases(
      language,
      code,
      testCases,
      false, // isSubmit = false
      langConfig.time_limit_ms || 2000
    );

    res.json({
      success: true,
      result
    });
  } catch (err: any) {
    console.error('Run code error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * SUBMIT CODE: Evaluates against ALL 10 test cases (3 visible + 7 hidden)
 * Evaluated strictly server-side. Hidden test inputs/outputs are never returned!
 */
router.post('/submit', async (req: Request, res: Response): Promise<void> => {
  const client = await getClient();
  try {
    const { problem_id, language, code, student_id } = req.body;

    if (!problem_id || !language || !code || !student_id) {
      res.status(400).json({ error: 'Missing submission parameters.' });
      return;
    }

    // Fetch problem language configuration
    const langRes = await client.query(`
      SELECT id, time_limit_ms, memory_limit_mb FROM problem_languages
      WHERE problem_id = $1 AND language = $2
    `, [problem_id, language]);

    if (langRes.rows.length === 0) {
      res.status(404).json({ error: `Language ${language} not configured for this problem.` });
      return;
    }

    const langConfig = langRes.rows[0];

    // Fetch ALL 10 test cases (3 visible + 7 hidden)
    const tcRes = await client.query(`
      SELECT id, input, expected_output, is_hidden, order_index
      FROM test_cases
      WHERE problem_language_id = $1
      ORDER BY order_index ASC
    `, [langConfig.id]);

    if (tcRes.rows.length === 0) {
      res.status(400).json({ error: 'No test cases configured for this problem.' });
      return;
    }

    const testCases: ExecutionTestCase[] = tcRes.rows.map(r => ({
      id: r.id,
      input: r.input,
      expected_output: r.expected_output,
      is_hidden: r.is_hidden,
      order_index: r.order_index
    }));

    // Execute server-side evaluation
    const execResult = await runCodeAgainstTestCases(
      language,
      code,
      testCases,
      true, // isSubmit = true
      langConfig.time_limit_ms || 2000
    );

    await client.query('BEGIN');

    // 1. Record Submission
    const subInsert = await client.query(`
      INSERT INTO submissions (student_id, problem_id, language, code, status, passed_tests, total_tests, runtime_ms, memory_mb, error_message)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, created_at
    `, [
      student_id,
      problem_id,
      language,
      code,
      execResult.status,
      execResult.passed_tests,
      execResult.total_tests,
      execResult.runtime_ms,
      execResult.memory_mb,
      execResult.error_message || null
    ]);

    const submissionId = subInsert.rows[0].id;
    let isFirstCompletion = false;
    let xpAwarded = 0;
    let promotedBelt = null;

    // Increment student's total submissions count
    await client.query(`
      UPDATE student_stats
      SET total_submissions = total_submissions + 1, updated_at = now()
      WHERE student_id = $1
    `, [student_id]);

    // 2. If all 10 test cases passed: Mark problem solved!
    if (execResult.passed) {
      // Check if already solved in this language
      const existingSolved = await client.query(`
        SELECT id FROM solved_problems
        WHERE student_id = $1 AND problem_id = $2 AND language = $3
      `, [student_id, problem_id, language]);

      if (existingSolved.rows.length === 0) {
        isFirstCompletion = true;
        xpAwarded = 50; // Standard solve XP

        // Record in solved_problems registry
        await client.query(`
          INSERT INTO solved_problems (student_id, problem_id, language, best_submission_id, first_solved_at)
          VALUES ($1, $2, $3, $4, now())
        `, [student_id, problem_id, language, submissionId]);

        // Increment student stats: problems_solved + 1, xp + 50
        const updatedStats = await client.query(`
          UPDATE student_stats
          SET problems_solved = problems_solved + 1,
              xp = xp + $2,
              coding_streak_days = GREATEST(1, coding_streak_days),
              last_active_date = CURRENT_DATE,
              updated_at = now()
          WHERE student_id = $1
          RETURNING xp, problems_solved, current_belt_id
        `, [student_id, xpAwarded]);

        const currStats = updatedStats.rows[0];

        // Check if eligible for belt promotion
        const eligibleBelt = await client.query(`
          SELECT id, name, color_hex, order_index
          FROM belts
          WHERE min_xp <= $1 AND min_problems <= $2
          ORDER BY order_index DESC
          LIMIT 1
        `, [currStats.xp, currStats.problems_solved]);

        if (eligibleBelt.rows.length > 0 && eligibleBelt.rows[0].id !== currStats.current_belt_id) {
          await client.query(`
            UPDATE student_stats SET current_belt_id = $1 WHERE student_id = $2
          `, [eligibleBelt.rows[0].id, student_id]);
          promotedBelt = eligibleBelt.rows[0];
        }

        // Award 'First Problem Solved' achievement if not unlocked
        const firstAch = await client.query(`SELECT id FROM achievements WHERE requirement_type = 'problem_solved' AND requirement_value = 1 LIMIT 1`);
        if (firstAch.rows.length > 0) {
          await client.query(`
            INSERT INTO student_achievements (student_id, achievement_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `, [student_id, firstAch.rows[0].id]);
        }
      } else {
        // Update best submission reference
        await client.query(`
          UPDATE solved_problems
          SET best_submission_id = $1
          WHERE student_id = $2 AND problem_id = $3 AND language = $4
        `, [submissionId, student_id, problem_id, language]);
      }
    }

    await client.query('COMMIT');

    // Find next problem for the post-completion continuous practice loop
    let nextProblem = null;
    if (execResult.passed) {
      const nextProblemRes = await client.query(`
        SELECT id, title, slug, difficulty
        FROM problems
        WHERE published = true AND id <> $1
        ORDER BY order_index ASC
        LIMIT 1
      `, [problem_id]);
      if (nextProblemRes.rows.length > 0) {
        nextProblem = nextProblemRes.rows[0];
      }
    }

    // Return sanitized evaluation response (NO HIDDEN TEST CASE INPUTS/EXPECTED OUTPUTS LEAKED)
    res.json({
      success: true,
      submission_id: submissionId,
      result: {
        passed: execResult.passed,
        total_tests: execResult.total_tests, // 10
        passed_tests: execResult.passed_tests,
        status: execResult.status,
        runtime_ms: execResult.runtime_ms,
        memory_mb: execResult.memory_mb,
        error_message: execResult.error_message,
        // Visible test results (cases 1-3)
        visible_test_results: execResult.visible_test_results,
        // Hidden test summaries (cases 4-10) without leaking contents
        hidden_tests_passed: execResult.hidden_tests_passed,
        hidden_tests_total: execResult.hidden_tests_total,
        is_first_completion: isFirstCompletion,
        xp_awarded: xpAwarded,
        new_belt: promotedBelt,
        next_problem: nextProblem
      }
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Submit code error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
