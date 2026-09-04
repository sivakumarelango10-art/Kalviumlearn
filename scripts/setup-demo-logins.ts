import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDemoAccounts() {
  const client = await pool.connect();
  try {
    console.log('--- Setting up Clean Demo Accounts ---');

    // 1. Super Admin
    const adminEmail = 'codingplatform10@gmail.com';
    const adminCheck = await client.query('SELECT id FROM profiles WHERE LOWER(email) = $1', [adminEmail]);
    if (adminCheck.rows.length === 0) {
      console.log('Super Admin not found, inserting...');
      await client.query(
        `INSERT INTO profiles (email, full_name, role, status)
         VALUES ($1, 'Super Admin', 'super_admin', 'active')`,
        [adminEmail]
      );
    } else {
      console.log('✓ Super Admin exists:', adminEmail);
    }

    // 2. Growth Mentor: mentor@kalvilearn.edu
    const mentorEmail = 'mentor@kalvilearn.edu';
    let mentorId: string;
    const mentorCheck = await client.query('SELECT id FROM profiles WHERE LOWER(email) = $1', [mentorEmail]);
    if (mentorCheck.rows.length > 0) {
      mentorId = mentorCheck.rows[0].id;
      console.log('✓ Demo Growth Mentor exists:', mentorEmail);
    } else {
      // Check if we can reuse an existing test mentor or insert new
      const anyMentor = await client.query("SELECT id FROM profiles WHERE role = 'growth_mentor' ORDER BY created_at ASC LIMIT 1");
      if (anyMentor.rows.length > 0) {
        mentorId = anyMentor.rows[0].id;
        await client.query("UPDATE profiles SET email = $1, full_name = 'Mentor Priya Raman' WHERE id = $2", [mentorEmail, mentorId]);
        console.log('✓ Updated existing mentor to:', mentorEmail);
      } else {
        const ins = await client.query(
          `INSERT INTO profiles (email, full_name, role, status)
           VALUES ($1, 'Mentor Priya Raman', 'growth_mentor', 'active') RETURNING id`,
          [mentorEmail]
        );
        mentorId = ins.rows[0].id;
        console.log('✓ Created demo mentor:', mentorEmail);
      }
    }

    // 3. Student: student@kalvilearn.edu
    const studentEmail = 'student@kalvilearn.edu';
    let studentId: string;
    const studentCheck = await client.query('SELECT id FROM profiles WHERE LOWER(email) = $1', [studentEmail]);
    if (studentCheck.rows.length > 0) {
      studentId = studentCheck.rows[0].id;
      console.log('✓ Demo Student exists:', studentEmail);
    } else {
      const anyStudent = await client.query("SELECT id FROM profiles WHERE role = 'student' ORDER BY created_at ASC LIMIT 1");
      if (anyStudent.rows.length > 0) {
        studentId = anyStudent.rows[0].id;
        await client.query("UPDATE profiles SET email = $1, full_name = 'Kavya Subramanian' WHERE id = $2", [studentEmail, studentId]);
        console.log('✓ Updated existing student to:', studentEmail);
      } else {
        const ins = await client.query(
          `INSERT INTO profiles (email, full_name, role, status)
           VALUES ($1, 'Kavya Subramanian', 'student', 'active') RETURNING id`,
          [studentEmail]
        );
        studentId = ins.rows[0].id;
        console.log('✓ Created demo student:', studentEmail);
      }
    }

    // Ensure Student is assigned to Mentor
    await client.query('UPDATE mentor_student_assignments SET is_active = false WHERE student_id = $1', [studentId]);
    await client.query(
      `INSERT INTO mentor_student_assignments (mentor_id, student_id, is_active)
       VALUES ($1, $2, true)`,
      [mentorId, studentId]
    );

    // Ensure student has stats
    const yellowBelt = await client.query("SELECT id FROM belts WHERE name = 'Yellow Belt' LIMIT 1");
    const beltId = yellowBelt.rows[0]?.id;
    const statsCheck = await client.query('SELECT student_id FROM student_stats WHERE student_id = $1', [studentId]);
    if (statsCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO student_stats (student_id, current_belt_id, xp, problems_solved, total_submissions, coding_streak_days, learning_progress_pct)
         VALUES ($1, $2, 100, 2, 3, 1, 40)`,
        [studentId, beltId]
      );
    } else {
      await client.query(
        `UPDATE student_stats 
         SET current_belt_id = COALESCE($2, current_belt_id), xp = GREATEST(xp, 100), problems_solved = GREATEST(problems_solved, 2), coding_streak_days = GREATEST(coding_streak_days, 1)
         WHERE student_id = $1`,
        [studentId, beltId]
      );
    }

    // 4. Campus Manager: campusmanager@kalvilearn.edu
    const cmEmail = 'campusmanager@kalvilearn.edu';
    const cmCheck = await client.query('SELECT id FROM profiles WHERE LOWER(email) = $1', [cmEmail]);
    if (cmCheck.rows.length === 0) {
      const anyCm = await client.query("SELECT id FROM profiles WHERE role = 'campus_manager' ORDER BY created_at ASC LIMIT 1");
      if (anyCm.rows.length > 0) {
        await client.query("UPDATE profiles SET email = $1, full_name = 'Campus Lead Rajesh' WHERE id = $2", [cmEmail, anyCm.rows[0].id]);
        console.log('✓ Updated existing campus manager to:', cmEmail);
      }
    } else {
      console.log('✓ Demo Campus Manager exists:', cmEmail);
    }

    console.log('\n--- All Demo Accounts Ready ---');
    console.log('1. Super Admin:    codingplatform10@gmail.com');
    console.log('2. Growth Mentor:  mentor@kalvilearn.edu');
    console.log('3. Student:        student@kalvilearn.edu');
    console.log('4. Campus Manager: campusmanager@kalvilearn.edu');
  } catch (err) {
    console.error('Failed to setup demo accounts:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDemoAccounts();
