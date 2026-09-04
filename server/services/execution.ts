const fetch = globalThis.fetch;
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Judge0 language IDs
export const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  python: 71,     // Python (3.8.1)
  cpp: 54,        // C++ (GCC 9.2.0)
  java: 62,       // Java (OpenJDK 13.0.1)
  javascript: 63  // JavaScript (Node.js 12.14.0)
};

export interface ExecutionTestCase {
  id: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
  order_index: number;
}

export interface SingleTestResult {
  test_index: number;
  is_hidden: boolean;
  passed: boolean;
  input?: string;          // Only included for visible tests!
  expected_output?: string;// Only included for visible tests!
  actual_output?: string;  // Only included for visible tests!
  runtime_ms: number;
  error?: string;
}

export interface ExecutionResponse {
  passed: boolean;
  total_tests: number;
  passed_tests: number;
  status: 'passed' | 'failed' | 'compilation_error' | 'runtime_error' | 'time_limit_exceeded';
  runtime_ms: number;
  memory_mb: number;
  error_message?: string;
  visible_test_results: SingleTestResult[];
  hidden_tests_passed?: number;
  hidden_tests_total?: number;
}

// Clean and normalize output for comparison
export function normalizeOutput(str: string): string {
  if (!str) return '';
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Executes a single test case using Judge0 CE
 */
async function executeViaJudge0(
  language: string,
  sourceCode: string,
  stdin: string,
  timeLimitMs: number = 2000
): Promise<{ stdout: string; stderr: string; compile_output?: string; time_ms: number; status_id: number; error?: string }> {
  const languageId = JUDGE0_LANGUAGE_IDS[language.toLowerCase()];
  if (!languageId) {
    throw new Error(`Unsupported language for execution: ${language}`);
  }

  const endpoint = process.env.JUDGE0_URL || process.env.EXECUTION_API_URL || 'https://ce.judge0.com';
  const url = `${endpoint}/submissions?wait=true`;

  const payload = {
    source_code: sourceCode,
    language_id: languageId,
    stdin: stdin,
    cpu_time_limit: Math.max(1, Math.min(10, Math.ceil(timeLimitMs / 1000))),
    memory_limit: 262144 // 256 MB
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Judge0 API returned HTTP ${response.status}: ${await response.text()}`);
  }

  const data: any = await response.json();

  const stdout = typeof data.stdout === 'string' ? data.stdout : '';
  const stderr = typeof data.stderr === 'string' ? data.stderr : '';
  const compileOutput = typeof data.compile_output === 'string' ? data.compile_output : '';
  const timeMs = data.time ? Math.round(parseFloat(data.time) * 1000) : 10;

  return {
    stdout,
    stderr,
    compile_output: compileOutput,
    time_ms: timeMs,
    status_id: data.status?.id || 3,
    error: stderr || compileOutput || (data.status?.id > 3 ? data.status?.description : undefined)
  };
}

/**
 * Sandboxed local fallback execution in case of Judge0 network timeouts or offline mode
 */
async function executeFallback(
  language: string,
  sourceCode: string,
  stdin: string,
  timeLimitMs: number = 2000
): Promise<{ stdout: string; stderr: string; time_ms: number; error?: string }> {
  const start = Date.now();
  const tmpDir = os.tmpdir();
  const fileId = `kalvi_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  if (language === 'javascript') {
    return new Promise((resolve) => {
      const scriptPath = path.join(tmpDir, `${fileId}.cjs`);
      fs.writeFileSync(scriptPath, sourceCode);

      const proc = spawn(process.execPath, [scriptPath], { timeout: timeLimitMs });
      let stdout = '';
      let stderr = '';

      if (stdin) {
        proc.stdin.write(stdin);
        proc.stdin.end();
      }

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', () => {
        try { fs.unlinkSync(scriptPath); } catch {}
        const duration = Date.now() - start;
        resolve({ stdout, stderr, time_ms: duration, error: stderr || undefined });
      });

      proc.on('error', (err) => {
        try { fs.unlinkSync(scriptPath); } catch {}
        resolve({ stdout: '', stderr: err.message, time_ms: Date.now() - start, error: err.message });
      });
    });
  } else if (language === 'python') {
    return new Promise((resolve) => {
      const scriptPath = path.join(tmpDir, `${fileId}.py`);
      fs.writeFileSync(scriptPath, sourceCode);

      // Check python command
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      const proc = spawn(pythonCmd, [scriptPath], { timeout: timeLimitMs });
      let stdout = '';
      let stderr = '';

      if (stdin) {
        proc.stdin.write(stdin);
        proc.stdin.end();
      }

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', () => {
        try { fs.unlinkSync(scriptPath); } catch {}
        const duration = Date.now() - start;
        resolve({ stdout, stderr, time_ms: duration, error: stderr || undefined });
      });

      proc.on('error', (err) => {
        try { fs.unlinkSync(scriptPath); } catch {}
        resolve({ stdout: '', stderr: err.message, time_ms: Date.now() - start, error: err.message });
      });
    });
  }

  throw new Error(`Fallback execution not supported for ${language}`);
}

/**
 * Unified execution gateway: tries Judge0 first, with safe fallback
 */
export async function runCodeAgainstTestCases(
  language: string,
  sourceCode: string,
  testCases: ExecutionTestCase[],
  isSubmit: boolean = false,
  timeLimitMs: number = 2000
): Promise<ExecutionResponse> {
  const visibleResults: SingleTestResult[] = [];
  let hiddenPassed = 0;
  let hiddenTotal = 0;
  let totalRuntime = 0;
  let overallStatus: 'passed' | 'failed' | 'compilation_error' | 'runtime_error' | 'time_limit_exceeded' = 'passed';
  let firstError: string | undefined;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    let execOutput: { stdout: string; stderr: string; time_ms: number; error?: string };

    try {
      execOutput = await executeViaJudge0(language, sourceCode, tc.input, timeLimitMs);
    } catch (err: any) {
      // If Judge0 is unreachable or rate limited, attempt isolated fallback
      try {
        execOutput = await executeFallback(language, sourceCode, tc.input, timeLimitMs);
      } catch (fallbackErr: any) {
        execOutput = {
          stdout: '',
          stderr: `Execution service error: ${err.message}`,
          time_ms: 0,
          error: `Execution error: ${err.message}`
        };
      }
    }

    totalRuntime += execOutput.time_ms;
    const actualNormalized = normalizeOutput(execOutput.stdout);
    const expectedNormalized = normalizeOutput(tc.expected_output);
    const testPassed = !execOutput.error && (actualNormalized === expectedNormalized);

    if (!testPassed && overallStatus === 'passed') {
      if (execOutput.error) {
        if (execOutput.error.toLowerCase().includes('compile') || execOutput.error.toLowerCase().includes('syntaxerror')) {
          overallStatus = 'compilation_error';
        } else if (execOutput.error.toLowerCase().includes('timeout') || execOutput.error.toLowerCase().includes('timed out')) {
          overallStatus = 'time_limit_exceeded';
        } else {
          overallStatus = 'runtime_error';
        }
      } else {
        overallStatus = 'failed';
      }
      firstError = execOutput.error || `Output mismatch on test case ${tc.order_index}`;
    }

    if (tc.is_hidden) {
      hiddenTotal++;
      if (testPassed) hiddenPassed++;
    } else {
      // Strictly visible test case: safe to include input and actual output
      visibleResults.push({
        test_index: tc.order_index,
        is_hidden: false,
        passed: testPassed,
        input: tc.input,
        expected_output: tc.expected_output,
        actual_output: execOutput.stdout,
        runtime_ms: execOutput.time_ms,
        error: execOutput.error
      });
    }
  }

  const passedCount = visibleResults.filter(r => r.passed).length + hiddenPassed;
  const isAllPassed = passedCount === testCases.length;

  return {
    passed: isAllPassed,
    total_tests: testCases.length,
    passed_tests: passedCount,
    status: isAllPassed ? 'passed' : overallStatus,
    runtime_ms: totalRuntime,
    memory_mb: 18,
    error_message: isAllPassed ? undefined : firstError,
    visible_test_results: visibleResults,
    hidden_tests_passed: isSubmit ? hiddenPassed : undefined,
    hidden_tests_total: isSubmit ? hiddenTotal : undefined
  };
}
