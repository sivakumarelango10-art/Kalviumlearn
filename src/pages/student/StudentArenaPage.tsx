import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Editor from '@monaco-editor/react';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { 
  Play, 
  Send, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  History, 
  HelpCircle,
  AlertCircle,
  Terminal,
  Settings
} from 'lucide-react';

export const StudentArenaPage: React.FC = () => {
  const { problemId } = useParams<{ problemId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active language is locked for this session
  const selectedLang = (searchParams.get('lang') || 'python') as 'python' | 'cpp' | 'java' | 'javascript';

  // Workspace layout states
  const [activeTab, setActiveTab] = useState<'description' | 'submissions' | 'help'>('description');
  const [activeTestCaseTab, setActiveTestCaseTab] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  // Problem & Session Data
  const [problemData, setProblemData] = useState<any>(null);
  const [code, setCode] = useState('');
  const [starterCode, setStarterCode] = useState('');
  const [visibleTestCases, setVisibleTestCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Execution & Submission States
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [nextProblem, setNextProblem] = useState<any>(null);

  // Load problem session
  const fetchSession = async () => {
    if (!problemId || !user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/student/practice/problems/${problemId}/session?student_id=${user.id}&language=${selectedLang}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load session');
      }

      setProblemData(data.problem);
      setCode(data.current_code || data.starter_code);
      setStarterCode(data.starter_code);
      // Strictly 3 visible test cases received from server!
      setVisibleTestCases(data.visible_test_cases || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [problemId, selectedLang, user?.id]);

  // Anti-Copy/Paste Event Interceptor
  useEffect(() => {
    const handleCopyPaste = (e: ClipboardEvent) => {
      // Prevent paste or copy from problem descriptions/code editor
      const target = e.target as HTMLElement;
      if (target && (target.closest('.no-copy-paste') || target.closest('.monaco-editor'))) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept Ctrl+C, Ctrl+V, Ctrl+X, Cmd+C, Cmd+V, Cmd+X inside practice arena
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
        const target = e.target as HTMLElement;
        if (target && (target.closest('.no-copy-paste') || target.closest('.monaco-editor'))) {
          e.preventDefault();
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.closest('.no-copy-paste') || target.closest('.monaco-editor'))) {
        e.preventDefault();
      }
    };

    window.addEventListener('copy', handleCopyPaste);
    window.addEventListener('paste', handleCopyPaste);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('copy', handleCopyPaste);
      window.removeEventListener('paste', handleCopyPaste);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Save draft code periodically
  const saveDraft = async (codeToSave: string) => {
    if (!problemId || !user?.id) return;
    try {
      await fetch(`/api/student/practice/problems/${problemId}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.id,
          language: selectedLang,
          code: codeToSave
        })
      });
    } catch (err) {
      console.error('Draft save failed:', err);
    }
  };

  const handleCodeChange = (val: string | undefined) => {
    const newCode = val || '';
    setCode(newCode);
    saveDraft(newCode);
  };

  const handleResetCode = () => {
    if (window.confirm('Reset code back to original starter template?')) {
      setCode(starterCode);
      saveDraft(starterCode);
    }
  };

  // RUN: Evaluates against 3 visible test cases only
  const handleRunCode = async () => {
    if (!problemId || !user?.id) return;
    setExecuting(true);
    setExecutionResult(null);

    try {
      const res = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problemId,
          language: selectedLang,
          code,
          student_id: user.id
        })
      });

      const data = await res.json();
      setExecutionResult({
        type: 'run',
        ...data.result
      });
    } catch (err: any) {
      setExecutionResult({
        type: 'run',
        passed: false,
        error_message: err.message,
        visible_test_results: []
      });
    } finally {
      setExecuting(false);
    }
  };

  // SUBMIT: Evaluates against ALL 10 test cases (3 visible + 7 hidden)
  const handleSubmitCode = async () => {
    if (!problemId || !user?.id) return;
    setExecuting(true);
    setExecutionResult(null);

    try {
      const res = await fetch('/api/code/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_id: problemId,
          language: selectedLang,
          code,
          student_id: user.id
        })
      });

      const data = await res.json();
      const result = data.result;

      setExecutionResult({
        type: 'submit',
        ...result
      });

      // If all 10 test cases pass: trigger completion confirmation modal!
      if (result.passed) {
        setNextProblem(result.next_problem);
        setCompletionModalOpen(true);
      }
    } catch (err: any) {
      setExecutionResult({
        type: 'submit',
        passed: false,
        error_message: err.message,
        visible_test_results: []
      });
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-[#FAFAFA] text-zinc-500 text-xs font-semibold animate-pulse">
        Initializing isolated {selectedLang.toUpperCase()} workspace...
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-[#FAFAFA] ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-[calc(100vh-4rem)]'}`}>
      {/* Top Workspace Action Header */}
      <div className="h-12 bg-white border-b border-zinc-200 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/student/practice')}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            title="Back to Problems"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-black text-zinc-900 truncate max-w-[240px] sm:max-w-md">
              {problemData?.title}
            </h2>
            <Badge
              variant={problemData?.difficulty === 'easy' ? 'green' : problemData?.difficulty === 'medium' ? 'yellow' : 'red'}
              size="sm"
            >
              {problemData?.difficulty}
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* LOCKED LANGUAGE INDICATOR: Prompt rule 13: Student cannot switch language mid-session! */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 border border-zinc-200 rounded-md">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Runtime:</span>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-900">{selectedLang}</span>
          </div>

          <button
            onClick={handleResetCode}
            title="Reset code to starter template"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Toggle Fullscreen"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleRunCode}
            disabled={executing}
            className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold rounded-lg border border-zinc-300 shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-zinc-800" /> Run
          </button>

          <button
            onClick={handleSubmitCode}
            disabled={executing}
            className="px-4 py-1.5 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Submit (10 Tests)
          </button>
        </div>
      </div>

      {/* Main Split-Screen Workspace (Inspired by Reference UI) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT PANEL: Problem Description, Submissions, Help */}
        <div className="w-full md:w-1/2 flex flex-col border-r border-zinc-200 bg-white overflow-hidden">
          {/* Sub-tabs */}
          <div className="flex items-center gap-2 px-4 border-b border-zinc-100 bg-zinc-50/50">
            <button
              onClick={() => setActiveTab('description')}
              className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'description' ? 'border-[#EE3124] text-[#EE3124]' : 'border-transparent text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Description
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'submissions' ? 'border-[#EE3124] text-[#EE3124]' : 'border-transparent text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Submissions
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'help' ? 'border-[#EE3124] text-[#EE3124]' : 'border-transparent text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" /> Get Help
            </button>
          </div>

          {/* Tab Content (Protected with Anti-Copy no-copy-paste class) */}
          <div className="flex-1 p-6 overflow-y-auto no-copy-paste text-xs text-zinc-800 space-y-5 leading-relaxed selection:bg-none">
            {activeTab === 'description' && (
              <>
                <div>
                  <h1 className="text-xl font-black text-zinc-950 tracking-tight mb-2">
                    {problemData?.title}
                  </h1>
                  <div className="flex flex-wrap gap-1.5">
                    {(problemData?.topics || []).map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="prose prose-zinc text-xs space-y-3">
                  <p className="whitespace-pre-line text-zinc-700 font-medium leading-relaxed">
                    {problemData?.description}
                  </p>
                </div>

                {problemData?.input_format && (
                  <div className="space-y-1">
                    <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">Input Format</h4>
                    <p className="text-zinc-600 font-mono text-[11px] bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                      {problemData.input_format}
                    </p>
                  </div>
                )}

                {problemData?.output_format && (
                  <div className="space-y-1">
                    <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">Output Format</h4>
                    <p className="text-zinc-600 font-mono text-[11px] bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                      {problemData.output_format}
                    </p>
                  </div>
                )}

                {problemData?.constraints && (
                  <div className="space-y-1">
                    <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">Constraints</h4>
                    <p className="text-zinc-600 font-mono text-[11px] bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                      {problemData.constraints}
                    </p>
                  </div>
                )}

                {/* Visible Examples */}
                {visibleTestCases.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">Visible Examples</h4>
                    {visibleTestCases.map((tc, idx) => (
                      <div key={idx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                        <span className="font-bold text-zinc-700 text-[11px]">Example {idx + 1}:</span>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-zinc-400 block font-mono text-[10px]">Input:</span>
                            <pre className="font-mono bg-white p-2 rounded border border-zinc-200 mt-0.5 overflow-x-auto">{tc.input}</pre>
                          </div>
                          <div>
                            <span className="text-zinc-400 block font-mono text-[10px]">Output:</span>
                            <pre className="font-mono bg-white p-2 rounded border border-zinc-200 mt-0.5 overflow-x-auto">{tc.expected_output}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">Your recent submissions for this problem.</p>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-center text-zinc-400 italic">
                  Run or Submit to record real-time test execution results.
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="space-y-3">
                <h4 className="font-bold text-zinc-900">Pedagogical Hint</h4>
                <p className="text-zinc-600 leading-relaxed">
                  Break down the problem into smaller invariant sub-steps. Trace each nested loop with pencil and paper for boundary conditions (e.g. N=1, N=2).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Monaco Editor (Top) & Test Cases Panel (Bottom) */}
        <div className="w-full md:w-1/2 flex flex-col bg-white overflow-hidden">
          {/* Top: Monaco Editor */}
          <div className="flex-1 relative flex flex-col min-h-[300px]">
            <Editor
              height="100%"
              language={selectedLang === 'cpp' ? 'cpp' : selectedLang === 'python' ? 'python' : selectedLang === 'java' ? 'java' : 'javascript'}
              value={code}
              onChange={handleCodeChange}
              theme="vs-light"
              options={{
                fontSize: fontSize,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                contextmenu: false // Anti-copy/paste context menu suppression
              }}
            />
          </div>

          {/* BOTTOM: Test Case Panel (Case 1 | Case 2 | Case 3) */}
          <div className="h-60 border-t border-zinc-200 bg-zinc-50/50 flex flex-col">
            {/* Test Case Tab Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 bg-white">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1 flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-zinc-500" /> Testcases:
                </span>
                {visibleTestCases.map((_, i) => {
                  const testResult = executionResult?.visible_test_results?.find((r: any) => r.test_index === i + 1);
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveTestCaseTab(i)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        activeTestCaseTab === i
                          ? 'bg-zinc-900 text-white shadow-sm'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      <span>Case {i + 1}</span>
                      {testResult && (
                        testResult.passed ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                        )
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Execution Summary Tag */}
              {executionResult && (
                <div className="flex items-center gap-2 text-xs">
                  <Badge
                    variant={executionResult.passed ? 'green' : 'red'}
                    size="sm"
                  >
                    {executionResult.type === 'submit' 
                      ? `${executionResult.passed_tests} / ${executionResult.total_tests} Passed (10 Tests)`
                      : executionResult.passed ? 'Visible Tests Passed' : 'Test Failed'}
                  </Badge>
                  {executionResult.runtime_ms > 0 && (
                    <span className="text-[11px] font-mono text-zinc-400">{executionResult.runtime_ms}ms</span>
                  )}
                </div>
              )}
            </div>

            {/* Test Case Details */}
            <div className="flex-1 p-4 overflow-y-auto text-xs font-mono">
              {visibleTestCases[activeTestCaseTab] ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Input
                      </span>
                      <pre className="p-2.5 bg-white rounded-lg border border-zinc-200 text-zinc-800 overflow-x-auto text-[11px]">
                        {visibleTestCases[activeTestCaseTab].input}
                      </pre>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Expected Output
                      </span>
                      <pre className="p-2.5 bg-white rounded-lg border border-zinc-200 text-zinc-800 overflow-x-auto text-[11px]">
                        {visibleTestCases[activeTestCaseTab].expected_output}
                      </pre>
                    </div>
                  </div>

                  {/* Actual Output if executed */}
                  {executionResult?.visible_test_results?.[activeTestCaseTab] && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 flex items-center justify-between">
                        <span className={executionResult.visible_test_results[activeTestCaseTab].passed ? 'text-emerald-700' : 'text-[#EE3124]'}>
                          Actual Output ({executionResult.visible_test_results[activeTestCaseTab].passed ? 'Match' : 'Mismatch'})
                        </span>
                        <span className="text-zinc-400 text-[10px]">
                          Runtime: {executionResult.visible_test_results[activeTestCaseTab].runtime_ms}ms
                        </span>
                      </span>
                      <pre className={`p-2.5 rounded-lg border overflow-x-auto text-[11px] ${
                        executionResult.visible_test_results[activeTestCaseTab].passed
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                          : 'bg-red-50/50 border-red-200 text-red-900'
                      }`}>
                        {executionResult.visible_test_results[activeTestCaseTab].actual_output || '<no output>'}
                      </pre>
                    </div>
                  )}

                  {/* Error display if compile/runtime error */}
                  {executionResult?.error_message && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-800 text-[11px]">
                      <strong>Execution Error:</strong> {executionResult.error_message}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-zinc-400 italic py-4">Select a test case tab above.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PROBLEM COMPLETION LOOP MODAL (Strict requirement from prompt section 18) */}
      <Modal
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        title="Problem Solved Successfully!"
        maxWidth="md"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-black text-zinc-950">10 / 10 Test Cases Passed!</h3>
            <p className="text-xs text-zinc-500 mt-1">
              All 3 visible and 7 hidden test cases evaluated successfully on the server.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-[#EE3124] text-xs font-black">
              +50 XP Awarded
            </div>
          </div>

          <p className="text-xs font-semibold text-zinc-700 pt-2">
            Continue to the next problem?
          </p>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setCompletionModalOpen(false);
                navigate('/student/practice');
              }}
              className="px-5 py-2.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
            >
              Cancel (Exit to Practice)
            </button>
            <button
              onClick={() => {
                setCompletionModalOpen(false);
                if (nextProblem) {
                  navigate(`/student/practice/${nextProblem.id}?lang=${selectedLang}`);
                } else {
                  navigate('/student/practice');
                }
              }}
              className="px-6 py-2.5 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              Next Problem &rarr;
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
