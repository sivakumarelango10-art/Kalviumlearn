import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Code2, Search, ArrowRight, CheckCircle2 } from 'lucide-react';

export const StudentPracticePage: React.FC = () => {
  const { user } = useAuth();
  const [problems, setProblems] = useState<any[]>([]);
  const [solvedMap, setSolvedMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [probRes, revRes] = await Promise.all([
          fetch('/api/student/practice/problems'),
          user?.id ? fetch(`/api/student/revise/${user.id}`) : Promise.resolve(null)
        ]);

        const probData = await probRes.json();
        setProblems(probData.problems || []);

        if (revRes) {
          const revData = await revRes.json();
          const map: Record<string, boolean> = {};
          (revData.solved_problems || []).forEach((s: any) => {
            map[s.problem_id] = true;
          });
          setSolvedMap(map);
        }
      } catch (err) {
        console.error('Failed to load practice problems:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const filtered = problems.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.topics || []).some((t: string) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesDiff = difficultyFilter === 'all' || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Practice Arena</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Solve algorithmic problems in Monaco with multi-language execution and test case verification
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems or topics..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124]"
            />
          </div>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg font-semibold text-zinc-700 focus:outline-none"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Problems Grid / Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Code2}
              title="No practice problems found"
              description={problems.length === 0 ? "The Super Admin has not published any practice problems yet." : "No problems matched your active filters."}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 w-12 text-center">Status</th>
                  <th className="px-6 py-3.5">Problem Title</th>
                  <th className="px-6 py-3.5">Difficulty</th>
                  <th className="px-6 py-3.5">Topics</th>
                  <th className="px-6 py-3.5">Supported Runtimes</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((p) => {
                  const isSolved = solvedMap[p.id];
                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-6 py-4 text-center">
                        {isSolved ? (
                          <span title="Solved" className="inline-flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-zinc-300 inline-block" title="Unattempted"></span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900 text-sm">{p.title}</div>
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
                            const isAvailable = (p.languages || []).includes(lang);
                            return (
                              <span
                                key={lang}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  isAvailable ? 'bg-zinc-100 text-zinc-700' : 'text-zinc-300'
                                }`}
                              >
                                {lang}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/student/practice/${p.id}`}
                          className="px-4 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
                        >
                          {isSolved ? 'Re-Solve' : 'Solve'} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
