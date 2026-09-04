export type Role = 'super_admin' | 'campus_manager' | 'growth_mentor' | 'student';

export type UserStatus = 'active' | 'disabled';

export type SupportedLanguage = 'python' | 'cpp' | 'java' | 'javascript';

export type ProblemDifficulty = 'easy' | 'medium' | 'hard';

export type SubmissionStatus = 'passed' | 'failed' | 'compilation_error' | 'runtime_error' | 'time_limit_exceeded';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  status: UserStatus;
  campus_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Campus {
  id: string;
  name: string;
  code: string;
  max_managers: number;
  max_mentors: number;
  max_students: number;
  created_at: string;
}

export interface Belt {
  id: string;
  name: string;
  min_xp: number;
  min_problems: number;
  color_hex: string;
  order_index: number;
}

export interface StudentStats {
  student_id: string;
  current_belt_id?: string;
  xp: number;
  problems_solved: number;
  total_submissions: number;
  coding_streak_days: number;
  last_active_date?: string;
  learning_progress_pct: number;
  belt?: Belt;
}

export interface MentorStudentAssignment {
  id: string;
  mentor_id: string;
  student_id: string;
  is_active: boolean;
  assigned_at: string;
  assigned_by?: string;
  mentor?: Profile;
  student?: Profile;
}

export interface TestCase {
  id: string;
  problem_language_id?: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
  order_index: number;
}

export interface ProblemLanguageConfig {
  id: string;
  problem_id: string;
  language: SupportedLanguage;
  starter_code: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  test_cases?: TestCase[]; // Client only receives 3 visible cases!
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  description: string;
  input_format?: string;
  output_format?: string;
  constraints?: string;
  sample_explanation?: string;
  topics: string[];
  published: boolean;
  order_index: number;
  created_at: string;
  languages?: Record<SupportedLanguage, ProblemLanguageConfig>;
}

export interface Submission {
  id: string;
  student_id: string;
  problem_id: string;
  language: SupportedLanguage;
  code: string;
  status: SubmissionStatus;
  passed_tests: number;
  total_tests: number;
  runtime_ms: number;
  memory_mb: number;
  error_message?: string;
  created_at: string;
  problem_title?: string;
}

export interface SolvedProblemRecord {
  id: string;
  student_id: string;
  problem_id: string;
  language: SupportedLanguage;
  best_submission_id?: string;
  first_solved_at: string;
  problem_title?: string;
  difficulty?: ProblemDifficulty;
  code?: string;
  runtime_ms?: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  published: boolean;
  order_index: number;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  units?: LearningUnit[];
}

export interface LearningUnit {
  id: string;
  module_id: string;
  title: string;
  content: string;
  notes?: string;
  code_example?: string;
  order_index: number;
  practice_problem_id?: string;
  xp_reward: number;
  is_completed?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  unlocked_at?: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_email: string;
  action: string;
  target_type: string;
  target_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface GrowthMentorAggregate {
  mentor_id: string;
  mentor_name: string;
  mentor_email: string;
  student_count: number;
  avg_progress: number;
  avg_success_rate: number;
  problems_solved: number;
  avg_xp: number;
  growth_score: number;
  assigned_students?: StudentSummary[];
}

export interface StudentSummary {
  student_id: string;
  student_name: string;
  student_email: string;
  mentor_id: string;
  mentor_name: string;
  problems_solved: number;
  xp: number;
  belt_name: string;
  belt_color: string;
  success_rate: number;
  streak_days: number;
  learning_progress_pct: number;
  status: UserStatus;
  last_active?: string;
}

export interface CodeExecutionResult {
  passed: boolean;
  total_tests: number;
  passed_tests: number;
  status: SubmissionStatus;
  runtime_ms: number;
  memory_mb: number;
  error_message?: string;
  visible_test_results: {
    test_index: number;
    input: string;
    expected_output: string;
    actual_output: string;
    passed: boolean;
    runtime_ms: number;
    error?: string;
  }[];
  hidden_tests_passed?: number;
  hidden_tests_total?: number;
  xp_awarded?: number;
  is_first_completion?: boolean;
  new_belt?: Belt;
}
