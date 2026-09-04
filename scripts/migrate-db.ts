import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is not defined!');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('--- KALVI LEARN DATABASE MIGRATION & SEEDING ---');
    console.log('Connected to Supabase PostgreSQL at:', connectionString!.replace(/:[^:@]+@/, ':****@'));

    // 1. Run Schema SQL
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    console.log('Executing schema definition...');
    await client.query(schemaSql);
    console.log('✓ Tables, triggers, indexes, and constraints successfully established.');

    // 2. Ensure Single Campus Exists
    const campusRes = await client.query(`
      INSERT INTO campuses (name, code, max_managers, max_mentors, max_students)
      VALUES ('Kalvi Campus', 'KALVI-01', 5, 20, 300)
      ON CONFLICT (code) DO UPDATE 
      SET name = EXCLUDED.name, max_managers = 5, max_mentors = 20, max_students = 300
      RETURNING id, name, code;
    `);
    const campus = campusRes.rows[0];
    console.log(`✓ Campus verified: ${campus.name} (${campus.code}) [ID: ${campus.id}]`);

    // 3. Ensure Initial Super Admin Exists
    const superAdminEmail = process.env.INITIAL_SUPER_ADMIN_EMAIL || 'codingplatform10@gmail.com';
    const adminRes = await client.query(`
      INSERT INTO profiles (email, full_name, role, status, campus_id)
      VALUES ($1, 'Super Admin', 'super_admin', 'active', $2)
      ON CONFLICT (email) DO UPDATE 
      SET role = 'super_admin', status = 'active', campus_id = $2
      RETURNING id, email, role, status;
    `, [superAdminEmail, campus.id]);
    const admin = adminRes.rows[0];
    console.log(`✓ Initial Super Admin registered: ${admin.email} (Role: ${admin.role}) [ID: ${admin.id}]`);

    // 4. Seed Standard Belt Progression Tiers
    const beltTiers = [
      { name: 'White Belt', min_xp: 0, min_problems: 0, color_hex: '#E4E4E7', order_index: 1 },
      { name: 'Yellow Belt', min_xp: 100, min_problems: 2, color_hex: '#FACC15', order_index: 2 },
      { name: 'Orange Belt', min_xp: 250, min_problems: 5, color_hex: '#FB923C', order_index: 3 },
      { name: 'Green Belt', min_xp: 500, min_problems: 10, color_hex: '#22C55E', order_index: 4 },
      { name: 'Blue Belt', min_xp: 1000, min_problems: 20, color_hex: '#3B82F6', order_index: 5 },
      { name: 'Purple Belt', min_xp: 2000, min_problems: 35, color_hex: '#A855F7', order_index: 6 },
      { name: 'Brown Belt', min_xp: 3500, min_problems: 50, color_hex: '#78350F', order_index: 7 },
      { name: 'Black Belt', min_xp: 5000, min_problems: 75, color_hex: '#09090B', order_index: 8 },
    ];

    for (const belt of beltTiers) {
      await client.query(`
        INSERT INTO belts (name, min_xp, min_problems, color_hex, order_index)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (order_index) DO UPDATE
        SET name = EXCLUDED.name, min_xp = EXCLUDED.min_xp, min_problems = EXCLUDED.min_problems, color_hex = EXCLUDED.color_hex;
      `, [belt.name, belt.min_xp, belt.min_problems, belt.color_hex, belt.order_index]);
    }
    console.log(`✓ 8 Belts progression tiers initialized (White Belt -> Black Belt).`);

    // 5. Seed Core Achievements Definitions
    const achievements = [
      { title: 'First Code Run', description: 'Run your first code execution in the Monaco arena', icon: 'Terminal', category: 'practice', requirement_type: 'code_run', requirement_value: 1, xp_reward: 25 },
      { title: 'First Problem Solved', description: 'Pass 10/10 test cases on your first coding problem', icon: 'CheckCircle2', category: 'practice', requirement_type: 'problem_solved', requirement_value: 1, xp_reward: 50 },
      { title: 'Consistency Champion', description: 'Maintain a coding streak of 3 consecutive days', icon: 'Flame', category: 'streak', requirement_type: 'streak_days', requirement_value: 3, xp_reward: 100 },
      { title: 'Week on Fire', description: 'Maintain a 7-day uninterrupted coding streak', icon: 'Zap', category: 'streak', requirement_type: 'streak_days', requirement_value: 7, xp_reward: 250 },
      { title: 'Polyglot Developer', description: 'Solve problems in at least 2 different programming languages', icon: 'Languages', category: 'mastery', requirement_type: 'languages_used', requirement_value: 2, xp_reward: 150 },
      { title: 'Algorithmic Virtuoso', description: 'Solve 10 distinct practice problems', icon: 'Trophy', category: 'milestone', requirement_type: 'problem_solved', requirement_value: 10, xp_reward: 300 },
    ];

    for (const ach of achievements) {
      await client.query(`
        INSERT INTO achievements (title, description, icon, category, requirement_type, requirement_value, xp_reward)
        SELECT $1, $2, $3, $4, $5, $6, $7
        WHERE NOT EXISTS (SELECT 1 FROM achievements WHERE title = $1);
      `, [ach.title, ach.description, ach.icon, ach.category, ach.requirement_type, ach.requirement_value, ach.xp_reward]);
    }
    console.log(`✓ Core achievement milestones initialized.`);

    // 6. Verification: Clean database check
    const countsRes = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM profiles WHERE role = 'campus_manager') as managers,
        (SELECT COUNT(*) FROM profiles WHERE role = 'growth_mentor') as mentors,
        (SELECT COUNT(*) FROM profiles WHERE role = 'student') as students,
        (SELECT COUNT(*) FROM problems) as problems
    `);
    console.log('✓ Clean Production State Check:');
    console.log(`  - Campus Managers: ${countsRes.rows[0].managers} (Limit: 5)`);
    console.log(`  - Growth Mentors: ${countsRes.rows[0].mentors} (Limit: 20)`);
    console.log(`  - Students: ${countsRes.rows[0].students} (Limit: 300)`);
    console.log(`  - Problems: ${countsRes.rows[0].problems}`);
    console.log('=====================================================');
    console.log('🎉 DATABASE MIGRATION COMPLETED CLEANLY AND SUCCESSFULLY!');
    console.log('=====================================================');

  } catch (err) {
    console.error('Database migration error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
