import React, { useEffect, useState } from 'react';
import { StatsCard } from '../../components/ui/StatsCard';
import { Users, Code2, ShieldCheck, Activity, Server, Cpu, Database, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, healthRes] = await Promise.all([
          fetch('/api/admin/overview'),
          fetch('/api/system/health')
        ]);
        const statsData = await statsRes.json();
        const healthData = await healthRes.json();
        setStats(statsData);
        setHealth(healthData);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-zinc-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-zinc-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Super Admin Portal</h1>
          <p className="text-sm text-zinc-500 mt-1">Platform management, capacity governance, and system telemetry</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Manage Users
          </Link>
          <Link
            to="/admin/problems"
            className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Code2 className="w-4 h-4" /> Problem Builder
          </Link>
        </div>
      </div>

      {/* Primary Metrics (No Capacity Denominators in Display) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Students"
          value={stats?.students_count || 0}
          subtitle="Registered student learners"
          icon={Users}
          highlight={true}
        />
        <StatsCard
          title="Growth Mentors"
          value={stats?.growth_mentors_count || 0}
          subtitle="Assigned pedagogical mentors"
          icon={Activity}
        />
        <StatsCard
          title="Campus Managers"
          value={stats?.campus_managers_count || 0}
          subtitle="Single-campus leadership"
          icon={Server}
        />
        <StatsCard
          title="Problems Published"
          value={stats?.problems_count || 0}
          subtitle={`${stats?.total_submissions || 0} total submissions`}
          icon={Code2}
        />
      </div>

      {/* System Health & Execution Sandbox Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#EE3124]" /> System Health & Execution Infrastructure
            </h2>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {health?.status || 'Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
                <Database className="w-4 h-4 text-zinc-700" /> Database Service
              </div>
              <p className="text-sm font-bold text-zinc-900">Supabase PostgreSQL</p>
              <p className="text-xs text-zinc-500 mt-1 font-mono">Status: Connected ({health?.database?.database_name})</p>
            </div>

            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
                <Server className="w-4 h-4 text-zinc-700" /> Sandboxed Execution Engine
              </div>
              <p className="text-sm font-bold text-zinc-900">Judge0 CE Engine</p>
              <p className="text-xs text-zinc-500 mt-1 font-mono">Status: {health?.execution_service?.status}</p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span>Single Campus: <strong className="text-zinc-900">{health?.campus || 'Kalvi Campus'}</strong></span>
            <Link to="/admin/audit-logs" className="text-[#EE3124] hover:underline font-semibold flex items-center gap-1">
              View Audit Logs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Capacity Governance Overview */}
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-zinc-700" /> Platform Capacity Governance
            </h2>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              Enforces hard operational limits. Over-capacity registrations are rejected at the database level.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-zinc-700">Campus Managers (Max 5)</span>
                  <span className="font-bold text-zinc-900">{stats?.campus_managers_count || 0} active</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-zinc-900 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, ((stats?.campus_managers_count || 0) / 5) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-zinc-700">Growth Mentors (Max 20)</span>
                  <span className="font-bold text-zinc-900">{stats?.growth_mentors_count || 0} active</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-[#EE3124] h-2 rounded-full" 
                    style={{ width: `${Math.min(100, ((stats?.growth_mentors_count || 0) / 20) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-zinc-700">Students (Max 300)</span>
                  <span className="font-bold text-zinc-900">{stats?.students_count || 0} active</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-zinc-800 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, ((stats?.students_count || 0) / 300) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 text-[11px] text-zinc-400">
            Hard constraints enforced via PostgreSQL triggers and backend API checks.
          </div>
        </div>
      </div>
    </div>
  );
};
