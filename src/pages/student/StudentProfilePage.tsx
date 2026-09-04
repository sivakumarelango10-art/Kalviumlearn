import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { User, Mail, Shield, Award, Flame, CheckCircle2, BookOpen } from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/student/dashboard/${user.id}`);
        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id]);

  if (loading) {
    return <div className="p-8 max-w-3xl mx-auto animate-pulse space-y-6"><div className="h-8 bg-zinc-200 rounded w-48"></div></div>;
  }

  const { student } = profileData || {};

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      <div>
        <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Student Profile</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Google authenticated identity, Growth Mentor association, and historical coding records
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm space-y-8">
        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#EE3124]/10 text-[#EE3124] flex items-center justify-center font-black text-2xl border border-red-200">
              {user?.full_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-950">{user?.full_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-mono text-zinc-600">{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="purple" size="md">Student</Badge>
            <Badge variant={user?.status === 'active' ? 'green' : 'gray'} size="md">{user?.status}</Badge>
          </div>
        </div>

        {/* Assigned Growth Mentor */}
        <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Assigned Growth Mentor
            </span>
            {student?.growth_mentor ? (
              <div>
                <h4 className="text-sm font-bold text-zinc-900">{student.growth_mentor.name}</h4>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">{student.growth_mentor.email}</p>
              </div>
            ) : (
              <p className="text-xs text-red-500 font-semibold">No Growth Mentor assigned.</p>
            )}
          </div>
          <Badge variant="blue" size="sm">Pedagogical Mentor</Badge>
        </div>

        {/* Coding Telemetry Summary */}
        <div>
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4">
            Coding Achievements & Telemetry
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-zinc-200 bg-white text-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Belt Tier</span>
              <span className="text-lg font-black text-zinc-900 mt-1 block">{student?.belt?.name}</span>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 bg-white text-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">XP Points</span>
              <span className="text-lg font-black text-[#EE3124] mt-1 block">{student?.xp}</span>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 bg-white text-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Problems Solved</span>
              <span className="text-lg font-black text-zinc-900 mt-1 block">{student?.problems_solved}</span>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 bg-white text-center">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Streak</span>
              <span className="text-lg font-black text-amber-600 mt-1 block">{student?.streak_days} Days</span>
            </div>
          </div>
        </div>

        {/* Security / Whitelist Note */}
        <div className="pt-4 border-t border-zinc-100 text-[11px] text-zinc-400">
          Account authenticated via Google OAuth. Usernames and password authentication are disabled on Kalvi Learn.
        </div>
      </div>
    </div>
  );
};
