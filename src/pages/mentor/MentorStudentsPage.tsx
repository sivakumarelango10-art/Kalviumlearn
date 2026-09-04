import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Users, Search, Flame, ArrowRight } from 'lucide-react';

export const MentorStudentsPage: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/mentor/dashboard/${user.id}`);
        const data = await res.json();
        setStudents(data.students || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [user?.id]);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Assigned Students Directory</h1>
          <p className="text-sm text-zinc-500 mt-1">Students assigned exclusively to your mentorship pod</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No students assigned yet"
              description="The Super Admin assigns students to your mentorship pod during onboarding."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Student</th>
                  <th className="px-6 py-3.5">Belt Tier</th>
                  <th className="px-6 py-3.5">XP Earned</th>
                  <th className="px-6 py-3.5">Problems Solved</th>
                  <th className="px-6 py-3.5">Success Rate</th>
                  <th className="px-6 py-3.5">Coding Streak</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 text-sm">{s.name}</div>
                      <div className="text-zinc-400 font-mono text-[11px]">{s.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={s.belt_name === 'White Belt' ? 'gray' : 'yellow'} size="sm">
                        {s.belt_name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#EE3124]">
                      {s.xp} XP
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-900">
                      {s.problems_solved}
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-700">
                      {s.success_rate}%
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-bold text-zinc-700">
                        <Flame className="w-3.5 h-3.5 text-amber-500" /> {s.streak}d
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.needs_attention ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Attention
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/mentor/students/${s.id}`}
                        className="px-3 py-1.5 text-xs font-bold text-[#EE3124] hover:text-white hover:bg-[#EE3124] border border-[#EE3124]/30 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        Inspect Diagnostics <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
