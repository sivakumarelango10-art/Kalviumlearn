import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatsCard } from '../../components/ui/StatsCard';
import { Link } from 'react-router-dom';
import { Users, AlertTriangle, TrendingUp, CheckCircle2, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const MentorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentorPod = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/mentor/dashboard/${user.id}`);
        const d = await res.json();
        setData(d);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMentorPod();
  }, [user?.id]);

  if (loading) {
    return <div className="p-8 max-w-7xl mx-auto animate-pulse space-y-6"><div className="h-8 bg-zinc-200 rounded w-64"></div></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Growth Mentor Pod</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Diagnostics and pedagogical guidance for students assigned exclusively to your pod
          </p>
        </div>
        <Link
          to="/mentor/students"
          className="px-4 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 w-fit"
        >
          <Users className="w-4 h-4" /> View Assigned Students
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Assigned Students"
          value={data?.total_students || 0}
          subtitle={`${data?.active_students || 0} active learners`}
          icon={Users}
          highlight={true}
        />
        <StatsCard
          title="Needing Attention"
          value={data?.students_needing_attention || 0}
          subtitle="Low success rate or stalled progress"
          icon={AlertTriangle}
          trend={data?.students_needing_attention > 0 ? "Review" : "Optimal"}
        />
        <StatsCard
          title="Average Pod Progress"
          value={`${data?.avg_progress || 0}%`}
          subtitle="Curriculum completion velocity"
          icon={TrendingUp}
        />
        <StatsCard
          title="Pod Problems Solved"
          value={data?.problems_solved || 0}
          subtitle={`${data?.avg_success_rate || 0}% avg submission success`}
          icon={CheckCircle2}
        />
      </div>

      {/* Pod Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List in Pod */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-zinc-100">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Assigned Students Status
            </h3>
            <Link to="/mentor/students" className="text-xs font-bold text-[#EE3124] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Belt & XP</th>
                  <th className="px-5 py-3">Problems Solved</th>
                  <th className="px-5 py-3">Success Rate</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Diagnostic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(data?.students || []).slice(0, 8).map((s: any) => (
                  <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-zinc-900">{s.name}</div>
                      <div className="text-zinc-400 font-mono text-[10px]">{s.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-zinc-900">{s.belt_name}</div>
                      <div className="text-[#EE3124] text-[11px] font-bold">{s.xp} XP</div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-zinc-800">
                      {s.problems_solved}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-emerald-700">
                      {s.success_rate}%
                    </td>
                    <td className="px-5 py-3.5">
                      {s.needs_attention ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Needs Attention
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          On Track
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/mentor/students/${s.id}`}
                        className="px-2.5 py-1 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded transition-colors"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity in Pod */}
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" /> Recent Pod Submissions
          </h3>

          <div className="space-y-3">
            {(!data?.recent_activity || data.recent_activity.length === 0) ? (
              <p className="text-xs text-zinc-400 italic py-4 text-center">No recent submissions in pod.</p>
            ) : (
              data.recent_activity.slice(0, 6).map((sub: any) => (
                <div key={sub.id} className="p-2.5 rounded-lg border border-zinc-100 bg-zinc-50/60 text-xs">
                  <div className="flex items-center justify-between font-bold text-zinc-900">
                    <span>{sub.student_name}</span>
                    <Badge variant={sub.status === 'passed' ? 'green' : 'red'} size="sm">
                      {sub.status === 'passed' ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 truncate">
                    {sub.problem_title} ({sub.language})
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">
                    {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
