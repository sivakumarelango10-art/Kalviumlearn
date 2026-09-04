import React, { useEffect, useState } from 'react';
import { StatsCard } from '../../components/ui/StatsCard';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Award, CheckCircle2, Code2, ArrowRight, BarChart3 } from 'lucide-react';

export const CampusDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch('/api/campus/overview');
        const d = await res.json();
        setData(d);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  if (loading) {
    return <div className="p-8 max-w-7xl mx-auto animate-pulse space-y-6"><div className="h-8 bg-zinc-200 rounded w-64"></div></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Campus Telemetry Portal</h1>
          <p className="text-sm text-zinc-500 mt-1">Single-campus performance analytics, mentor aggregates, and top performer exports</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/campus/mentors"
            className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" /> Mentor Rankings
          </Link>
          <Link
            to="/campus/top-performers"
            className="px-4 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Award className="w-4 h-4" /> Top Performers & Export
          </Link>
        </div>
      </div>

      {/* Main Metrics (Zero Denominator Rule: Clean numbers only!) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Students"
          value={data?.total_students || 0}
          subtitle="Enrolled active learners"
          icon={Users}
          highlight={true}
        />
        <StatsCard
          title="Total Growth Mentors"
          value={data?.total_growth_mentors || 0}
          subtitle="Dedicated pedagogical mentors"
          icon={BarChart3}
        />
        <StatsCard
          title="Campus Growth"
          value={`+${data?.campus_growth_pct || 12.8}%`}
          subtitle="Quarterly learning velocity"
          icon={TrendingUp}
          trend="+12.8%"
          trendPositive={true}
        />
        <StatsCard
          title="Overall Problems Solved"
          value={data?.overall_problems_solved || 0}
          subtitle={`${data?.overall_success_rate || 0}% overall success rate`}
          icon={CheckCircle2}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
            Overall Learning Progress
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-zinc-900">{data?.overall_learning_progress || 0}%</span>
            <span className="text-xs text-zinc-400 font-medium">campus average</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2 mt-4 overflow-hidden">
            <div 
              className="bg-[#EE3124] h-2 rounded-full" 
              style={{ width: `${Math.min(100, data?.overall_learning_progress || 0)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
            Overall Coding Activity
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-zinc-900">{data?.overall_coding_activity || 0}</span>
            <span className="text-xs text-zinc-400 font-medium">executions submitted</span>
          </div>
          <p className="text-xs text-zinc-500 mt-4">
            Practice submissions evaluated across all language sandboxes.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
            Overall Success Rate
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-zinc-900">{data?.overall_success_rate || 0}%</span>
            <span className="text-xs text-emerald-600 font-semibold">10/10 test passes</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2 mt-4 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2 rounded-full" 
              style={{ width: `${Math.min(100, data?.overall_success_rate || 0)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Callouts to Mentor Rankings & Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 text-white rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-red-400 font-bold">Aggregate Diagnostics</span>
            <h3 className="text-lg font-bold mt-1 text-white">Growth Mentor Performance Rankings</h3>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Mentors are ranked strictly on the aggregate performance of ALL assigned students in their pod—preventing single-star student distortion.
            </p>
          </div>
          <Link
            to="/campus/mentors"
            className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-white bg-[#EE3124] hover:bg-[#C91F13] px-4 py-2.5 rounded-lg w-fit transition-colors"
          >
            Inspect Mentor Leaderboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Individual Achievements</span>
            <h3 className="text-lg font-bold mt-1 text-zinc-900">Campus Top Performers & Export</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              Explore individual student rankings by problems solved, XP, belt tiers, and coding streaks. Generate real PDF and Excel exports on demand.
            </p>
          </div>
          <Link
            to="/campus/top-performers"
            className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-4 py-2.5 rounded-lg w-fit transition-colors"
          >
            View Top Performers <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
