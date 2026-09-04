-- =======================================================================
-- KALVI LEARN — PRODUCTION DATABASE SCHEMA & CONSTRAINTS (POSTGRESQL)
-- =======================================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Campuses Table (Single Campus: Kalvi Campus)
CREATE TABLE IF NOT EXISTS campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Kalvi Campus',
    code TEXT NOT NULL UNIQUE DEFAULT 'KALVI-01',
    max_managers INT NOT NULL DEFAULT 5,
    max_mentors INT NOT NULL DEFAULT 20,
    max_students INT NOT NULL DEFAULT 300,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Profiles / User Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'campus_manager', 'growth_mentor', 'student')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_campus ON profiles(campus_id);

-- 4. Capacity Enforcement Function & Trigger
CREATE OR REPLACE FUNCTION enforce_role_capacity_limits()
RETURNS TRIGGER AS $$
DECLARE
    curr_managers INT;
    curr_mentors INT;
    curr_students INT;
BEGIN
    IF NEW.status = 'active' THEN
        IF NEW.role = 'campus_manager' THEN
            SELECT COUNT(*) INTO curr_managers FROM profiles WHERE role = 'campus_manager' AND status = 'active' AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
            IF curr_managers >= 5 THEN
                RAISE EXCEPTION 'Platform capacity limit reached: Maximum 5 Campus Managers allowed.';
            END IF;
        ELSIF NEW.role = 'growth_mentor' THEN
            SELECT COUNT(*) INTO curr_mentors FROM profiles WHERE role = 'growth_mentor' AND status = 'active' AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
            IF curr_mentors >= 20 THEN
                RAISE EXCEPTION 'Platform capacity limit reached: Maximum 20 Growth Mentors allowed.';
            END IF;
        ELSIF NEW.role = 'student' THEN
            SELECT COUNT(*) INTO curr_students FROM profiles WHERE role = 'student' AND status = 'active' AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
            IF curr_students >= 300 THEN
                RAISE EXCEPTION 'Platform capacity limit reached: Maximum 300 Students allowed.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enforce_role_capacity ON profiles;
CREATE TRIGGER trigger_enforce_role_capacity
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_role_capacity_limits();

-- 5. Mentor-Student Relationships
CREATE TABLE IF NOT EXISTS mentor_student_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_single_active_mentor 
ON mentor_student_assignments(student_id) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_assignment_mentor ON mentor_student_assignments(mentor_id);

-- 6. Belts & Progression Tiers
CREATE TABLE IF NOT EXISTS belts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    min_xp INT NOT NULL,
    min_problems INT NOT NULL,
    color_hex TEXT NOT NULL,
    order_index INT NOT NULL UNIQUE
);

-- 7. Student Telemetry & Statistics
CREATE TABLE IF NOT EXISTS student_stats (
    student_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    current_belt_id UUID REFERENCES belts(id) ON DELETE SET NULL,
    xp INT NOT NULL DEFAULT 0,
    problems_solved INT NOT NULL DEFAULT 0,
    total_submissions INT NOT NULL DEFAULT 0,
    coding_streak_days INT NOT NULL DEFAULT 0,
    last_active_date DATE,
    learning_progress_pct NUMERIC(5,2) DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Achievements & Student Milestones
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    requirement_type TEXT NOT NULL,
    requirement_value INT NOT NULL,
    xp_reward INT NOT NULL DEFAULT 50
);

CREATE TABLE IF NOT EXISTS student_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(student_id, achievement_id)
);

-- 9. Curriculum: Courses, Modules, Learning Units
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT false,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    description TEXT NOT NULL,
    input_format TEXT,
    output_format TEXT,
    constraints TEXT,
    sample_explanation TEXT,
    topics TEXT[] DEFAULT '{}',
    published BOOLEAN NOT NULL DEFAULT false,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    notes TEXT,
    code_example TEXT,
    order_index INT NOT NULL DEFAULT 0,
    practice_problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,
    xp_reward INT NOT NULL DEFAULT 25,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES learning_units(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    UNIQUE(student_id, unit_id)
);

-- 10. Problem Languages & Test Cases
CREATE TABLE IF NOT EXISTS problem_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('python', 'cpp', 'java', 'javascript')),
    starter_code TEXT NOT NULL,
    time_limit_ms INT NOT NULL DEFAULT 2000,
    memory_limit_mb INT NOT NULL DEFAULT 256,
    UNIQUE(problem_id, language)
);

CREATE TABLE IF NOT EXISTS test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_language_id UUID NOT NULL REFERENCES problem_languages(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    order_index INT NOT NULL CHECK (order_index >= 1 AND order_index <= 10)
);

CREATE INDEX IF NOT EXISTS idx_test_cases_lang ON test_cases(problem_language_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_hidden ON test_cases(is_hidden);

-- 11. Independent Language Coding Sessions
CREATE TABLE IF NOT EXISTS coding_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('python', 'cpp', 'java', 'javascript')),
    current_code TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(student_id, problem_id, language)
);

-- 12. Submissions & Test Case Execution Results
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('python', 'cpp', 'java', 'javascript')),
    code TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'compilation_error', 'runtime_error', 'time_limit_exceeded')),
    passed_tests INT NOT NULL DEFAULT 0,
    total_tests INT NOT NULL DEFAULT 10,
    runtime_ms INT DEFAULT 0,
    memory_mb INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

CREATE TABLE IF NOT EXISTS submission_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    passed BOOLEAN NOT NULL,
    actual_output TEXT, -- ONLY populated for visible test cases! Null for hidden test cases
    runtime_ms INT DEFAULT 0,
    is_hidden BOOLEAN NOT NULL DEFAULT false
);

-- 13. Solved Problems Registry (for fast revision query)
CREATE TABLE IF NOT EXISTS solved_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('python', 'cpp', 'java', 'javascript')),
    best_submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    first_solved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(student_id, problem_id, language)
);

-- 14. Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignment_problems (
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 0,
    PRIMARY KEY(assignment_id, problem_id)
);

CREATE TABLE IF NOT EXISTS assignment_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
    completed_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id)
);

-- 15. Contests
CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'past')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contest_problems (
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    points INT NOT NULL DEFAULT 100,
    order_index INT NOT NULL DEFAULT 0,
    PRIMARY KEY(contest_id, problem_id)
);

CREATE TABLE IF NOT EXISTS contest_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 0,
    rank INT,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(contest_id, student_id)
);

-- 16. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at);
