import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Code2, Plus, CheckCircle2, AlertCircle, Eye, EyeOff, Save, Globe } from 'lucide-react';

export const AdminProblemsPage: React.FC = () => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [langConfigModalOpen, setLangConfigModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [activeLang, setActiveLang] = useState<'python' | 'cpp' | 'java' | 'javascript'>('python');

  // Problem creation form
  const [probForm, setProbForm] = useState({
    title: '',
    difficulty: 'easy',
    description: '',
    input_format: '',
    output_format: '',
    constraints: '',
    sample_explanation: '',
    topics: 'Loops, Math'
  });

  // Test cases editor state (strictly 10 test cases: 3 visible, 7 hidden)
  const [starterCode, setStarterCode] = useState(`def solve():\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    solve()`);
  const [testCases, setTestCases] = useState<any[]>(
    Array.from({ length: 10 }, (_, i) => ({
      order_index: i + 1,
      input: `input_${i + 1}`,
      expected_output: `output_${i + 1}`,
      is_hidden: i >= 3
    }))
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/problems');
      const data = await res.json();
      setProblems(data.problems || []);
    } catch (err) {
      console.error('Failed to load problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const topicsArr = probForm.topics.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch('/api/admin/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...probForm,
          topics: topicsArr,
          actor_email: user?.email
        })
      });
      if (res.ok) {
        setCreateModalOpen(false);
        setProbForm({
          title: '',
          difficulty: 'easy',
          description: '',
          input_format: '',
          output_format: '',
          constraints: '',
          sample_explanation: '',
          topics: 'Loops, Math'
        });
        fetchProblems();
      }
    } catch (err) {
      console.error('Problem creation failed:', err);
    }
  };

  const openLanguageConfig = async (problem: any) => {
    setSelectedProblem(problem);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/admin/problems/${problem.id}`);
      const data = await res.json();
      const existingLang = data.problem?.languages?.[activeLang];
      if (existingLang && existingLang.test_cases?.length === 10) {
        setStarterCode(existingLang.starter_code);
        setTestCases(existingLang.test_cases);
      } else {
        // Provide standard starter code and 10 test case templates
        setStarterCode(
          activeLang === 'python' ? 'def solve():\n    # Enter your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()' :
          activeLang === 'javascript' ? 'const fs = require("fs");\nfunction solve() {\n    const input = fs.readFileSync(0, "utf-8").trim();\n    console.log(input);\n}\nsolve();' :
          '// Starter code\n'
        );
        setTestCases(
          Array.from({ length: 10 }, (_, i) => ({
            order_index: i + 1,
            input: `test_in_${i + 1}`,
            expected_output: `test_out_${i + 1}`,
            is_hidden: i >= 3
          }))
        );
      }
      setLangConfigModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveLanguageConfig = async () => {
    if (!selectedProblem) return;
    setStatusMessage(null);

    // Enforce exactly 10 test cases (3 visible, 7 hidden)
    if (testCases.length !== 10) {
      setStatusMessage('Error: Exactly 10 test cases are required.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/problems/${selectedProblem.id}/languages/${activeLang}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          starter_code: starterCode,
          time_limit_ms: 2000,
          memory_limit_mb: 256,
          test_cases: testCases,
          actor_email: user?.email
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save configuration');
      }

      setStatusMessage(`Configuration for ${activeLang} saved successfully! (3 visible, 7 hidden)`);
      fetchProblems();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const handleTogglePublish = async (problemId: string, currentPublished: boolean) => {
    try {
      const res = await fetch(`/api/admin/problems/${problemId}/publish`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          published: !currentPublished,
          actor_email: user?.email
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Cannot publish problem');
        return;
      }
      fetchProblems();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Problem Builder</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Author problems, multi-language configurations, and strict 10-test-case suites (3 visible, 7 hidden)
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create New Problem
        </button>
      </div>

      {/* Problems List Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        {problems.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Code2}
              title="No problems have been created yet"
              description="Click the button above to author your first coding problem and configure its 10 test cases."
              actionText="Create Problem"
              onAction={() => setCreateModalOpen(true)}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Problem</th>
                  <th className="px-6 py-3.5">Difficulty</th>
                  <th className="px-6 py-3.5">Topics</th>
                  <th className="px-6 py-3.5">Languages Configured</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {problems.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 text-sm">{p.title}</div>
                      <div className="text-zinc-400 font-mono text-[11px]">{p.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={p.difficulty === 'easy' ? 'green' : p.difficulty === 'medium' ? 'yellow' : 'red'}
                        size="sm"
                      >
                        {p.difficulty}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(p.topics || []).map((t: string) => (
                          <span key={t} className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {['python', 'cpp', 'java', 'javascript'].map((lang) => {
                          const isConfigured = (p.languages || []).includes(lang);
                          return (
                            <span
                              key={lang}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isConfigured ? 'bg-red-50 text-[#EE3124] border border-red-200' : 'bg-zinc-100 text-zinc-300'
                              }`}
                            >
                              {lang}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={p.published ? 'green' : 'gray'} size="sm">
                        {p.published ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openLanguageConfig(p)}
                        className="px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
                      >
                        Configure Tests
                      </button>
                      <button
                        onClick={() => handleTogglePublish(p.id, p.published)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                          p.published ? 'text-zinc-500 hover:bg-zinc-100' : 'text-[#EE3124] hover:bg-red-50 font-bold'
                        }`}
                      >
                        {p.published ? 'Unpublish' : 'Publish'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Problem Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Author New Practice Problem"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateProblem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Problem Title *
            </label>
            <input
              type="text"
              required
              value={probForm.title}
              onChange={(e) => setProbForm({ ...probForm, title: e.target.value })}
              placeholder="e.g. Numbers in Right Angled Triangle"
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Difficulty *
              </label>
              <select
                value={probForm.difficulty}
                onChange={(e) => setProbForm({ ...probForm, difficulty: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124]"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Topics (Comma-separated)
              </label>
              <input
                type="text"
                value={probForm.topics}
                onChange={(e) => setProbForm({ ...probForm, topics: e.target.value })}
                placeholder="Loops, Arrays, Math"
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={probForm.description}
              onChange={(e) => setProbForm({ ...probForm, description: e.target.value })}
              placeholder="Detailed statement explaining input, output, and pattern..."
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124]"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Input Format
              </label>
              <input
                type="text"
                value={probForm.input_format}
                onChange={(e) => setProbForm({ ...probForm, input_format: e.target.value })}
                placeholder="Two integers N and M on separate lines"
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Constraints
              </label>
              <input
                type="text"
                value={probForm.constraints}
                onChange={(e) => setProbForm({ ...probForm, constraints: e.target.value })}
                placeholder="1 <= N <= 100"
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-semibold rounded-lg"
            >
              Save Problem
            </button>
          </div>
        </form>
      </Modal>

      {/* Language & Exactly 10 Test Cases Configuration Modal */}
      <Modal
        isOpen={langConfigModalOpen}
        onClose={() => setLangConfigModalOpen(false)}
        title={`Configure Test Suite: ${selectedProblem?.title}`}
        maxWidth="3xl"
      >
        <div className="space-y-6">
          {statusMessage && (
            <div className={`p-3 rounded-lg text-xs font-semibold ${
              statusMessage.startsWith('Error') ? 'bg-red-50 text-[#EE3124] border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {statusMessage}
            </div>
          )}

          {/* Language Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-200">
            {(['python', 'cpp', 'java', 'javascript'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => { setActiveLang(lang); openLanguageConfig(selectedProblem); }}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeLang === lang ? 'border-[#EE3124] text-[#EE3124]' : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Starter Code */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Starter Code ({activeLang.toUpperCase()})
            </label>
            <textarea
              rows={6}
              value={starterCode}
              onChange={(e) => setStarterCode(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 text-zinc-100 rounded-lg focus:outline-none border border-zinc-700"
            />
          </div>

          {/* 10 Test Cases Editor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                Test Cases Suite: Exactly 10 Test Cases (3 Visible, 7 Hidden)
              </label>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <Eye className="w-3.5 h-3.5" /> 3 Visible
                </span>
                <span className="flex items-center gap-1 text-zinc-500 font-semibold">
                  <EyeOff className="w-3.5 h-3.5" /> 7 Hidden
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {testCases.map((tc, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs ${
                    idx < 3 ? 'bg-emerald-50/30 border-emerald-200' : 'bg-zinc-50 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                      Case {idx + 1}
                      {idx < 3 ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                          VISIBLE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-200 px-1.5 py-0.5 rounded">
                          HIDDEN (Never sent to client)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-500 block mb-1">Input Stdin</span>
                      <textarea
                        rows={2}
                        value={tc.input}
                        onChange={(e) => {
                          const updated = [...testCases];
                          updated[idx].input = e.target.value;
                          setTestCases(updated);
                        }}
                        className="w-full px-2 py-1 text-xs font-mono bg-white border border-zinc-300 rounded"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-500 block mb-1">Expected Output</span>
                      <textarea
                        rows={2}
                        value={tc.expected_output}
                        onChange={(e) => {
                          const updated = [...testCases];
                          updated[idx].expected_output = e.target.value;
                          setTestCases(updated);
                        }}
                        className="w-full px-2 py-1 text-xs font-mono bg-white border border-zinc-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <button
              onClick={() => setLangConfigModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
            >
              Close
            </button>
            <button
              onClick={handleSaveLanguageConfig}
              className="px-4 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save 10 Test Cases
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
