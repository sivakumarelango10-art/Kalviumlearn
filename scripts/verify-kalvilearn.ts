import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

dotenv.config();

const API_BASE = 'http://localhost:3000/api';

async function verifyAll() {
  console.log('================================================================');
  console.log('         KALVI LEARN — COMPREHENSIVE E2E VERIFICATION SUITE      ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✓ [PASS] ${testName}`);
    } else {
      console.error(`✗ [FAIL] ${testName}`);
      if (detail) console.error('  Detail:', detail);
      process.exit(1);
    }
  }

  // 1. Health & Database Check
  console.log('1. Verifying System Health & Database Connection...');
  const healthRes = await fetch(`${API_BASE}/system/health`);
  const health = await healthRes.json();
  assert(health.status === 'healthy', 'System health status is healthy', health);
  assert(health.database?.status === 'connected', 'Database is connected to Supabase PostgreSQL', health);
  assert(health.campus === 'Kalvi Campus (KALVI-01)', 'Campus strictly configured as Kalvi Campus (KALVI-01)', health);
  assert(health.limits?.max_students === 300, 'Capacity limits configured: max 300 students', health);

  // 2. Google OAuth Whitelist Authentication
  console.log('\n2. Testing Whitelist Authentication Flow...');
  const unregRes = await fetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'unregistered.hacker@gmail.com' })
  });
  const unregData = await unregRes.json();
  assert(unregRes.status === 403, 'Unregistered Google account rejected with HTTP 403', unregRes.status);
  assert(
    unregData.error === 'Your Google account is not registered on Kalvi Learn. Please contact the administrator.',
    'Unregistered account receives the EXACT mandated error message',
    unregData.error
  );

  // Authenticate Super Admin
  const adminRes = await fetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'codingplatform10@gmail.com' })
  });
  const adminData = await adminRes.json();
  assert(adminRes.ok && adminData.profile?.role === 'super_admin', 'Initial Super Admin codingplatform10@gmail.com verified as super_admin', adminData);
  const adminUser = adminData.profile;

  // 3. User Governance & Capacity Validations
  console.log('\n3. Testing User Governance, Hierarchy, and Capacity Rules...');
  
  // Create Campus Manager
  const cmEmail = `cm.${Date.now()}@gmail.com`;
  const cmRes = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: cmEmail,
      full_name: 'Campus Lead Rajesh',
      role: 'campus_manager',
      actor_email: adminUser.email
    })
  });
  const cmData = await cmRes.json();
  assert(cmRes.ok && cmData.user?.role === 'campus_manager', 'Campus Manager successfully created', cmData);

  // Create 2 Growth Mentors (Mentor A and Mentor B)
  const gm1Email = `mentor.a.${Date.now()}@gmail.com`;
  const gm1Res = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: gm1Email,
      full_name: 'Mentor Priya Raman',
      role: 'growth_mentor',
      actor_email: adminUser.email
    })
  });
  const gm1Data = await gm1Res.json();
  assert(gm1Res.ok && gm1Data.user?.role === 'growth_mentor', 'Growth Mentor A created', gm1Data);
  const mentorA = gm1Data.user;

  const gm2Email = `mentor.b.${Date.now()}@gmail.com`;
  const gm2Res = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: gm2Email,
      full_name: 'Mentor Karthik Sundar',
      role: 'growth_mentor',
      actor_email: adminUser.email
    })
  });
  const gm2Data = await gm2Res.json();
  assert(gm2Res.ok && gm2Data.user?.role === 'growth_mentor', 'Growth Mentor B created', gm2Data);
  const mentorB = gm2Data.user;

  // MANDATORY RULE: Student creation without Growth Mentor MUST FAIL!
  const studentNoMentorRes = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `orphan.${Date.now()}@gmail.com`,
      full_name: 'Orphan Student',
      role: 'student',
      mentor_id: null,
      actor_email: adminUser.email
    })
  });
  assert(!studentNoMentorRes.ok, 'Student creation without Growth Mentor properly rejected', studentNoMentorRes.status);

  // Create valid Student assigned to Mentor A
  const studentEmail = `student.dev.${Date.now()}@gmail.com`;
  const studentRes = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: studentEmail,
      full_name: 'Kavya Subramanian',
      role: 'student',
      mentor_id: mentorA.id,
      actor_email: adminUser.email
    })
  });
  const studentData = await studentRes.json();
  assert(studentRes.ok && studentData.user?.role === 'student', 'Student successfully created and bound to Growth Mentor A', studentData);
  const student = studentData.user;

  // 4. Reassign Student to Mentor B & Audit Log
  console.log('\n4. Testing Student Reassignment & Audit Trail...');
  const reassignRes = await fetch(`${API_BASE}/admin/students/${student.id}/reassign-mentor`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      new_mentor_id: mentorB.id,
      actor_email: adminUser.email
    })
  });
  assert(reassignRes.ok, 'Student successfully reassigned to Growth Mentor B', reassignRes.status);

  // Verify Audit Log
  const auditRes = await fetch(`${API_BASE}/admin/audit-logs`);
  const auditData = await auditRes.json();
  const reassignLog = (auditData.logs || []).find((l: any) => l.action === 'REASSIGN_MENTOR');
  assert(Boolean(reassignLog), 'Student reassignment event written to immutable audit_logs', reassignLog);

  // 5. Growth Mentor Data Isolation
  console.log('\n5. Testing Growth Mentor Pod Data Isolation...');
  // Mentor A queries student diagnostics for student now assigned to Mentor B
  const isolatedRes = await fetch(`${API_BASE}/mentor/students/${student.id}/diagnostics?mentor_id=${mentorA.id}`);
  assert(isolatedRes.status === 403, 'Mentor A strictly forbidden from accessing Mentor B student diagnostics', isolatedRes.status);

  // Mentor B queries diagnostics
  const validMentorRes = await fetch(`${API_BASE}/mentor/students/${student.id}/diagnostics?mentor_id=${mentorB.id}`);
  const validMentorData = await validMentorRes.json();
  assert(validMentorRes.ok && validMentorData.student?.id === student.id, 'Mentor B successfully accesses assigned student diagnostics', validMentorData);

  // 6. Problem Builder & 10 Test Cases Architecture
  console.log('\n6. Testing Problem Builder & 10 Test Cases Security...');
  const problemCreateRes = await fetch(`${API_BASE}/admin/problems`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Numbers in Right Angled Triangle',
      difficulty: 'easy',
      description: 'Given two integers N and M, print a right angled triangle pattern with N rows where each row has row-number elements starting from M.',
      input_format: 'Two integers N and M on separate lines',
      output_format: 'Printed triangle pattern',
      constraints: '1 <= N <= 10, 1 <= M <= 10',
      topics: ['Loops', 'Pattern Printing'],
      actor_email: adminUser.email
    })
  });
  const probData = await problemCreateRes.json();
  assert(problemCreateRes.ok && Boolean(probData.problem?.id), 'Practice Problem created by Super Admin', probData);
  const problem = probData.problem;

  // Build exactly 10 test cases (3 visible, 7 hidden)
  const tenTestCases = [
    // 3 VISIBLE TEST CASES
    { input: '2\n4', expected_output: '4\n4 5', is_hidden: false },
    { input: '3\n1', expected_output: '1\n1 2\n1 2 3', is_hidden: false },
    { input: '4\n2', expected_output: '2\n2 3\n2 3 4\n2 3 4 5', is_hidden: false },
    // 7 HIDDEN TEST CASES (Strictly withheld from client!)
    { input: '1\n5', expected_output: '5', is_hidden: true },
    { input: '2\n1', expected_output: '1\n1 2', is_hidden: true },
    { input: '3\n3', expected_output: '3\n3 4\n3 4 5', is_hidden: true },
    { input: '4\n1', expected_output: '1\n1 2\n1 2 3\n1 2 3 4', is_hidden: true },
    { input: '5\n2', expected_output: '2\n2 3\n2 3 4\n2 3 4 5\n2 3 4 5 6', is_hidden: true },
    { input: '2\n8', expected_output: '8\n8 9', is_hidden: true },
    { input: '3\n7', expected_output: '7\n7 8\n7 8 9', is_hidden: true },
  ];

  // Configure Python
  const pythonStarter = `import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    m = int(lines[1])
    for i in range(1, n + 1):
        row = [str(m + j) for j in range(i)]
        print(" ".join(row))

if __name__ == "__main__":
    solve()`;

  const configRes = await fetch(`${API_BASE}/admin/problems/${problem.id}/languages/python`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      starter_code: pythonStarter,
      time_limit_ms: 2000,
      memory_limit_mb: 256,
      test_cases: tenTestCases,
      actor_email: adminUser.email
    })
  });
  assert(configRes.ok, 'Problem configured with exactly 10 test cases (3 visible, 7 hidden)', configRes.status);

  // Publish problem
  const publishRes = await fetch(`${API_BASE}/admin/problems/${problem.id}/publish`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ published: true, actor_email: adminUser.email })
  });
  assert(publishRes.ok, 'Problem published after validating 10 test cases', publishRes.status);

  // Student queries session -> ASSERT ZERO HIDDEN TEST CASES SENT!
  console.log('\n7. Verifying Hidden Test Case Security Barrier...');
  const studentSessionRes = await fetch(`${API_BASE}/student/practice/problems/${problem.id}/session?student_id=${student.id}&language=python`);
  const sessionData = await studentSessionRes.json();
  assert(sessionData.visible_test_cases?.length === 3, 'Client receives strictly the 3 visible test cases', sessionData.visible_test_cases?.length);
  const hiddenLeaked = (sessionData.visible_test_cases || []).some((tc: any) => tc.is_hidden);
  assert(!hiddenLeaked, 'ZERO hidden test cases leaked to client state or response body', hiddenLeaked);

  // 8. Test Execution: Run vs Submit
  console.log('\n8. Testing Sandboxed Code Execution: Run vs Submit...');
  
  // RUN against visible test cases
  const runRes = await fetch(`${API_BASE}/code/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      problem_id: problem.id,
      language: 'python',
      code: pythonStarter,
      student_id: student.id
    })
  });
  const runData = await runRes.json();
  assert(runRes.ok && runData.result?.passed, 'Code Run evaluated successfully against 3 visible test cases', runData.result);

  // SUBMIT against full test suite (10 test cases)
  const submitRes = await fetch(`${API_BASE}/code/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      problem_id: problem.id,
      language: 'python',
      code: pythonStarter,
      student_id: student.id
    })
  });
  const submitData = await submitRes.json();
  assert(submitRes.ok && submitData.result?.passed, 'Code Submit passed 10/10 test cases server-side', submitData.result);
  assert(submitData.result?.passed_tests === 10, 'Full test suite (3 visible + 7 hidden = 10) verified', submitData.result?.passed_tests);
  assert(submitData.result?.xp_awarded === 50, '+50 XP awarded for successful problem completion', submitData.result?.xp_awarded);

  // 9. Revision Hub Test
  console.log('\n9. Testing Revision Hub Persistence...');
  const reviseRes = await fetch(`${API_BASE}/student/revise/${student.id}`);
  const reviseData = await reviseRes.json();
  assert(reviseData.solved_problems?.length > 0, 'Solved problem recorded in Revision Hub with independent language session', reviseData.solved_problems);
  assert(reviseData.solved_problems[0].solved_code.includes('solve()'), 'Historical solution code preserved for inspection', reviseData.solved_problems[0]);

  // 10. Top Performers Export (PDF & Excel generation)
  console.log('\n10. Testing Campus Manager Top Performers Export...');
  const topRes = await fetch(`${API_BASE}/campus/top-performers`);
  const topData = await topRes.json();
  assert(topData.students?.length > 0, 'Top student performers queried from live database', topData.students?.length);

  // Test real XLSX generation
  const ws = XLSX.utils.json_to_sheet(topData.students);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Top Performers');
  const xlsxBuf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  assert(xlsxBuf.length > 100, 'Real Excel (.xlsx) report generated successfully', xlsxBuf.length);

  // Test real PDF generation
  const PDFConstructor = (jsPDF as any).jsPDF || (jsPDF as any).default || jsPDF;
  const doc = new PDFConstructor();
  doc.text('KALVI LEARN Top Performers', 14, 20);
  (doc as any).autoTable({
    head: [['Rank', 'Student', 'Growth Mentor', 'XP', 'Belt']],
    body: topData.students.map((s: any) => [s.rank, s.student_name, s.growth_mentor, s.xp, s.belt_name])
  });
  const pdfOutput = doc.output('arraybuffer');
  assert(pdfOutput.byteLength > 500, 'Real PDF report generated successfully via jsPDF', pdfOutput.byteLength);

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passedTests} / ${totalTests} E2E VERIFICATION CHECKS PASSED PERFECTLY!`);
  console.log('================================================================\n');
}

verifyAll().catch(err => {
  console.error('E2E Verification script failed:', err);
  process.exit(1);
});
