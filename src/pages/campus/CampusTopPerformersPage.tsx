import React, { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ExportTopPerformersModal } from './ExportTopPerformersModal';
import { Award, Download, ArrowUpDown, Flame, CheckCircle2 } from 'lucide-react';

export const CampusTopPerformersPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('problems_solved');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const fetchTopPerformers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campus/top-performers?sort_by=${sortBy}&limit=100`);
      const data = await res.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopPerformers();
  }, [sortBy]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Top Student Performers</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Individual student rankings across problems solved, XP milestones, belts, and coding streaks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sorting Control */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-zinc-200 text-xs shadow-sm">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-500 font-medium">Rank by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="font-bold text-zinc-900 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="problems_solved">Problems Solved</option>
              <option value="xp">XP Growth</option>
              <option value="success_rate">Success Rate</option>
              <option value="streak">Coding Streak</option>
              <option value="learning_progress">Learning Progress</option>
              <option value="overall">Overall Score</option>
            </select>
          </div>

          {/* Export Action Button */}
          <button
            onClick={() => setExportModalOpen(true)}
            disabled={students.length === 0}
            className="px-4 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Top Performers Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        {students.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Award}
              title="No student activity registered yet"
              description="Once students solve practice problems and complete learning modules, top performer rankings will populate here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 text-center w-16">Rank</th>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Growth Mentor</th>
                  <th className="px-6 py-3.5">Current Belt</th>
                  <th className="px-6 py-3.5">Problems Solved</th>
                  <th className="px-6 py-3.5">XP Points</th>
                  <th className="px-6 py-3.5">Success Rate</th>
                  <th className="px-6 py-3.5">Coding Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {students.map((s) => (
                  <tr key={s.student_id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-6 py-4 text-center font-extrabold text-sm">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                        s.rank === 1 ? 'bg-amber-100 text-amber-900 font-black' :
                        s.rank === 2 ? 'bg-zinc-200 text-zinc-800' :
                        s.rank === 3 ? 'bg-amber-50 text-amber-700' :
                        'text-zinc-500'
                      }`}>
                        #{s.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 text-sm">{s.student_name}</div>
                      <div className="text-zinc-400 font-mono text-[11px]">{s.student_email}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-700">
                      {s.growth_mentor}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={s.belt_name === 'White Belt' ? 'gray' : 'yellow'} size="sm">
                        {s.belt_name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-zinc-900 text-sm">{s.problems_solved}</span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-[#EE3124]">
                      {s.xp} XP
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-700">
                      {s.success_rate}%
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-bold text-zinc-700">
                        <Flame className="w-3.5 h-3.5 text-amber-500" /> {s.streak} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export Top Performers Modal */}
      <ExportTopPerformersModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        students={students}
      />
    </div>
  );
};
