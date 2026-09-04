import { Router, Request, Response } from 'express';
import { query } from '../db.js';

const router = Router();

router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const dbRes = await query('SELECT now() as time, current_database() as db');
    const endpoint = process.env.JUDGE0_URL || process.env.EXECUTION_API_URL || 'https://ce.judge0.com';

    let judge0Status = 'unknown';
    try {
      const jRes = await fetch(`${endpoint}/about`);
      if (jRes.ok) {
        const jData: any = await jRes.json();
        judge0Status = `online (v${jData.version || '1.14.0'})`;
      } else {
        judge0Status = `degraded (HTTP ${jRes.status})`;
      }
    } catch {
      judge0Status = 'offline (fallback sandbox active)';
    }

    res.json({
      status: 'healthy',
      platform: 'KALVI LEARN',
      database: {
        status: 'connected',
        server_time: dbRes.rows[0].time,
        database_name: dbRes.rows[0].db
      },
      execution_service: {
        endpoint,
        status: judge0Status
      },
      campus: 'Kalvi Campus (KALVI-01)',
      limits: {
        max_campus_managers: 5,
        max_growth_mentors: 20,
        max_students: 300
      }
    });
  } catch (err: any) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

export default router;
