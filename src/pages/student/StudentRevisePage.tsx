import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { RotateCcw, CheckCircle2, Code2, ArrowRight, Play } from 'lucide-react';

export const StudentRevisePage: React.FC = () => {
  const { user } = useAuth();
  const [solvedProblems, setSolvedProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState<any>(null);

  useEffect(() => {
    const fetchSolved = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/student/revise/${user.id}`);
        const data = await res.json();
        setSolvedProblems(data.solved_problems || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSolved();
  }, [user?.id]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Revision Hub</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Review previously accepted solutions, examine runtime telemetry, or re-attempt problems to reinforce mastery
        </p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        {solvedProblems.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={RotateCcw}
              title="No solved problems to revise yet"
              description="Once you pass 10/10 test cases on practice problems, your accepted solutions will be preserved here for structured revision."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Problem</th>
                  <th className="px-6 py-3.5">Language</th>
                  <th className="px-6 py-3.5">Solved Date</th>
                  <th className="px-6 py-3.5">Best Submission</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {solvedProblems.map((sp) => (
                  <tr key={sp.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 text-sm">{sp.problem_title}</div>
                      <Badge variant={sp.difficulty === 'easy' ? 'green' : 'yellow'} size="sm" className="mt-1">
                        {sp.difficulty || 'Easy'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded bg-zinc-100 text-zinc-800 font-black text-xs uppercase tracking-wider">
                        {sp.language}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-mono text-[11px]">
                      {new Date(sp.first_solved_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-600 text-xs">
                      {sp.runtime_ms ? `${sp.runtime_ms} ms runtime` : '10 / 10 Tests Passed'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="green" size="sm">Solved</Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSolution(sp);
                          setInspectModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Inspect Solution
                      </button>
                      <Link
                        to={`/student/practice/${sp.problem_id}?lang=${sp.language}`}
                        className="px-3 py-1.5 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Try Again
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Solution Modal */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title={`Accepted Solution: ${selectedSolution?.problem_title}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs pb-3 border-b border-zinc-100">
            <span className="font-bold text-zinc-900 uppercase">
              Language: <strong className="text-[#EE3124]">{selectedSolution?.language}</strong>
            </span>
            <span className="text-zinc-400 font-mono">
              Passed on: {selectedSolution?.first_solved_at ? new Date(selectedSolution.first_solved_at).toLocaleString() : ''}
            </span>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Source Code
            </label>
            <pre className="p-4 bg-zinc-900 text-zinc-100 rounded-xl font-mono text-xs overflow-x-auto max-h-96">
              {selectedSolution?.solved_code || '# Code snippet unavailable'}
            </pre>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
            <Link
              to={`/student/practice/${selectedSolution?.problem_id}?lang=${selectedSolution?.language}`}
              className="px-4 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" /> Try Again in Monaco
            </Link>
            <button
              onClick={() => setInspectModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
