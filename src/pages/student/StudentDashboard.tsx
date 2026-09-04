import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { StatsCard } from '../../components/ui/StatsCard';
import { Badge } from '../../components/ui/Badge';
import { 
  Flame, 
  Award, 
  Code2, 
  BookOpen, 
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/student/dashboard/${user.id}`);
        const d = await res.json();
        setData(d);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.id]);

  if (loading) {
    return <div className="p-8 max-w-7xl mx-auto animate-pulse space-y-6"><div className="h-8 bg-zinc-200 rounded w-64"></div></div>;
  }

  const { student, topic_performance, continue_learning, recommended_problem, achievements } = data || {};

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Top Banner: Belt & Level Progress */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Current Belt Rank</span>
            <span 
              className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm"
              style={{ 
                backgroundColor: student?.belt?.color === '#09090B' ? '#09090B' : '#FEF2F2',
                color: student?.belt?.color === '#09090B' ? '#FFFFFF' : '#EE3124',
                borderColor: '#FCA5A5'
              }}
            >
              {student?.belt?.name || 'White Belt'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            Welcome back, {student?.name}
          </h1>
          <p className="text-xs text-zinc-500 font-medium">
            Next Tier: <strong className="text-zinc-800">{student?.belt?.next_belt}</strong> • {student?.xp || 0} Total XP
          </p>
        </div>

        {/* Next Belt Progress Meter */}
        <div className="w-full md:w-72 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
          <div className="flex justify-between text-xs font-bold text-zinc-700 mb-1.5">
            <span>Next Tier Progress</span>
            <span className="text-[#EE3124]">{student?.belt?.progress_pct || 0}%</span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-[#EE3124] h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${student?.belt?.progress_pct || 0}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 text-right">
            Solve problems to unlock the next belt
          </p>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Coding Streak"
          value={`${student?.streak_days || 0} Days`}
          subtitle="Consecutive daily practice"
          icon={Flame}
          highlight={true}
        />
        <StatsCard
          title="Problems Solved"
          value={student?.problems_solved || 0}
          subtitle={`${student?.success_rate || 0}% submission accuracy`}
          icon={CheckCircle2}
        />
        <StatsCard
          title="Learning Progress"
          value={`${student?.learning_progress_pct || 0}%`}
          subtitle="Curriculum units completed"
          icon={BookOpen}
        />
        <StatsCard
          title="Total Experience"
          value={`${student?.xp || 0} XP`}
          subtitle={`${student?.total_submissions || 0} total submissions`}
          icon={Award}
        />
      </div>

      {/* Continue Learning & Recommended Practice Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Continue Learning */}
        <div className="bg-zinc-900 text-white rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-red-400 font-bold uppercase tracking-wider mb-2">
              <span>Continue Learning</span>
              <span>{continue_learning?.progress_label}</span>
            </div>
            <h3 className="text-xl font-black text-white">{continue_learning?.course_title}</h3>
            <p className="text-xs text-zinc-400 mt-1 font-medium">{continue_learning?.module_title}</p>
            <div className="mt-4 p-3 bg-zinc-800/80 rounded-xl border border-zinc-700 text-xs">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Active Unit</span>
              <span className="font-bold text-white text-sm mt-0.5 block">{continue_learning?.current_unit}</span>
            </div>
          </div>

          <Link
            to="/student/learn"
            className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-bold rounded-xl transition-colors shadow-sm w-fit"
          >
            Resume Lesson <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Recommended Practice */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2">
              <span>Recommended Practice</span>
              <Badge variant="green" size="sm">Adaptive</Badge>
            </div>
            {recommended_problem ? (
              <>
                <h3 className="text-xl font-black text-zinc-900">{recommended_problem.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={recommended_problem.difficulty === 'easy' ? 'green' : 'yellow'} size="sm">
                    {recommended_problem.difficulty}
                  </Badge>
                  {(recommended_problem.topics || []).map((t: string) => (
                    <span key={t} className="text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                  Recommended based on your learning progression and edge-case test diagnostics.
                </p>
              </>
            ) : (
              <p className="text-xs text-zinc-400 italic py-4">No recommended problems available.</p>
            )}
          </div>

          {recommended_problem ? (
            <Link
              to={`/student/practice/${recommended_problem.id}`}
              className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-sm w-fit"
            >
              Solve in Monaco Arena <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/student/practice"
              className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors shadow-sm w-fit"
            >
              Browse Problems <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Topic Performance Diagnostics & Growth Mentor Pod Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Performance */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Topic Performance & Mastery
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Real-time mastery index across core algorithmic topics</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {(topic_performance || []).map((tp: any) => (
              <div key={tp.topic} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800 flex items-center gap-2">
                    {tp.topic}
                    {tp.weak && (
                      <span className="text-[10px] font-bold text-[#EE3124] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                        NEEDS REVISION
                      </span>
                    )}
                  </span>
                  <span className="font-extrabold text-zinc-900">{tp.mastery_pct}%</span>
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

        {/* Assigned Growth Mentor Card & Achievements */}
        <div className="space-y-6">
          {/* Assigned Growth Mentor Card */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-3">
              Assigned Growth Mentor
            </span>
            {student?.growth_mentor ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center justify-center text-sm border border-blue-200">
                  GM
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">{student.growth_mentor.name}</h4>
                  <p className="text-xs text-zinc-400 font-mono">{student.growth_mentor.email}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold">
                No mentor assigned. Super Admin will assign your mentor.
              </div>
            )}
            <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
              Your Growth Mentor reviews your test case edge submissions, provides remedial problem drills, and tracks your belt progression.
            </p>
          </div>

          {/* Achievements Showcase */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-3">
              Achievements
            </span>
            <div className="space-y-2.5">
              {(achievements || []).slice(0, 3).map((ach: any) => (
                <div key={ach.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-100 bg-zinc-50/50">
                  <div className={`p-2 rounded-lg ${ach.unlocked_at ? 'bg-amber-100 text-amber-700' : 'bg-zinc-200 text-zinc-400'}`}>
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">{ach.title}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{ach.description}</p>
                  </div>
                  {ach.unlocked_at ? (
                    <Badge variant="green" size="sm">Unlocked</Badge>
                  ) : (
                    <span className="text-[10px] font-bold text-zinc-400">{ach.xp_reward} XP</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
