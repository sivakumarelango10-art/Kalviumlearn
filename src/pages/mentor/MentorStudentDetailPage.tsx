import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { ArrowLeft, CheckCircle2, Flame, Award, AlertCircle, Code2, BookOpen, Clock } from 'lucide-react';

export const MentorStudentDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      if (!studentId) return;
      try {
        const res = await fetch(`/api/mentor/students/${studentId}/diagnostics?mentor_id=${user?.id}`);
        const d = await res.json();
        if (!res.ok) {
          throw new Error(d.error || 'Failed to load diagnostics');
        }
        setData(d);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDiagnostics();
  }, [studentId, user?.id]);

  if (loading) {
    return <div className="p-8 max-w-7xl mx-auto animate-pulse space-y-6"><div className="h-8 bg-zinc-200 rounded w-64"></div></div>;
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
          {error}
        </div>
        <Link to="/mentor/students" className="text-xs text-[#EE3124] font-bold hover:underline">
          &larr; Back to Assigned Students
        </Link>
      </div>
    );
  }

  const { student, topic_performance, language_performance, recent_submissions, pedagogical_recommendation } = data;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Back button */}
      <div>
        <Link
          to="/mentor/students"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight">{student.full_name}</h1>
            <p className="text-xs font-mono text-zinc-400">{student.email}</p>
          </div>
          <Badge variant={student.belt_name === 'White Belt' ? 'gray' : 'yellow'} size="md">
            {student.belt_name}
          </Badge>
        </div>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Problems</span>
          <span className="text-2xl font-black text-zinc-900 mt-1 block">{student.problems_solved || 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">XP Points</span>
          <span className="text-2xl font-black text-[#EE3124] mt-1 block">{student.xp || 0}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Success Rate</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{student.success_rate || 0}%</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Coding Streak</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">{student.coding_streak_days || 0}d</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Learning Pct</span>
          <span className="text-2xl font-black text-zinc-900 mt-1 block">{Math.round(student.learning_progress_pct || 0)}%</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Submissions</span>
          <span className="text-2xl font-black text-zinc-900 mt-1 block">{student.total_submissions || 0}</span>
        </div>
      </div>

      {/* Actionable Pedagogical Guidance: "What does this student need help with?" */}
      <div className="p-5 rounded-xl bg-red-50/70 border border-red-200 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#EE3124] text-white rounded-lg shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-red-950 uppercase tracking-wider">
              Pedagogical Intervention Guidance
            </h3>
            <p className="text-sm font-semibold text-red-900 mt-1 leading-relaxed">
              {pedagogical_recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Topic Mastery Diagnostic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center justify-between">
            <span>Topic Performance & Mastery</span>
            <span className="text-[11px] text-zinc-400 font-normal">Identifies weak conceptual topics</span>
          </h3>

          <div className="space-y-3 pt-2">
            {topic_performance.map((tp: any) => (
              <div key={tp.topic} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                    {tp.topic}
                    {tp.weak && (
                      <span className="text-[10px] font-bold text-[#EE3124] bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        WEAK AREA
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-zinc-900">{tp.mastery_pct}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full ${tp.weak ? 'bg-[#EE3124]' : 'bg-emerald-500'}`}
                    style={{ width: `${tp.mastery_pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Language Breakdown */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            Language Performance
          </h3>

          <div className="space-y-3 pt-2">
            {language_performance.length === 0 ? (
              <p className="text-xs text-zinc-400 italic py-6 text-center">No language attempts recorded yet.</p>
            ) : (
              language_performance.map((lp: any) => (
                <div key={lp.language} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold uppercase text-zinc-900">{lp.language}</span>
                    <span className="text-zinc-400 ml-2">({lp.submissions} attempts)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-zinc-700">{lp.solved} Solved</span>
                    <span className="font-bold text-emerald-700">{lp.success_rate}% Success</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Submissions Log */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" /> Recent Submission Diagnostics
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Problem</th>
                <th className="px-5 py-3">Language</th>
                <th className="px-5 py-3">Tests Passed</th>
                <th className="px-5 py-3">Runtime</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-mono">
              {recent_submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-zinc-400 italic font-sans">
                    No submissions recorded yet for this student.
                  </td>
                </tr>
              ) : (
                recent_submissions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-zinc-50">
                    <td className="px-5 py-3 text-zinc-400 text-[11px] whitespace-nowrap font-sans">
                      {new Date(sub.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-sans font-bold text-zinc-900">
                      {sub.problem_title}
                    </td>
                    <td className="px-5 py-3 uppercase text-zinc-700 font-bold text-[11px]">
                      {sub.language}
                    </td>
                    <td className="px-5 py-3 text-zinc-700">
                      {sub.passed_tests} / {sub.total_tests}
                    </td>
                    <td className="px-5 py-3 text-zinc-500">
                      {sub.runtime_ms} ms
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={sub.status === 'passed' ? 'green' : 'red'} size="sm">
                        {sub.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
