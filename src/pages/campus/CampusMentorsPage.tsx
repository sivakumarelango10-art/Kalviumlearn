import React, { useEffect, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { TrendingUp, Users, Award, ExternalLink, BookOpen, AlertCircle } from 'lucide-react';

export const CampusMentorsPage: React.FC = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [mentorDetail, setMentorDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campus/mentor-performance');
      const data = await res.json();
      setMentors(data.mentors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const openMentorDrilldown = async (mentor: any) => {
    setSelectedMentor(mentor);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/campus/mentors/${mentor.mentor_id}`);
      const data = await res.json();
      setMentorDetail(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Growth Mentor Aggregate Rankings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Performance evaluated strictly across all assigned students in each mentor's pod (prevents single-star student bias)
        </p>
      </div>

      {/* Mentor Leaderboard Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
        {mentors.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={TrendingUp}
              title="No Growth Mentors added yet"
              description="Once Growth Mentors and student pods are registered, aggregate performance rankings will calculate automatically."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 text-center w-16">Rank</th>
                  <th className="px-6 py-3.5">Mentor</th>
                  <th className="px-6 py-3.5">Assigned Students</th>
                  <th className="px-6 py-3.5">Avg Progress</th>
                  <th className="px-6 py-3.5">Avg Success</th>
                  <th className="px-6 py-3.5">Total Problems</th>
                  <th className="px-6 py-3.5 text-right">Growth Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {mentors.map((m) => (
                  <tr 
                    key={m.mentor_id} 
                    onClick={() => openMentorDrilldown(m)}
                    className="hover:bg-zinc-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-center font-extrabold text-sm">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                        m.rank === 1 ? 'bg-amber-100 text-amber-800 font-black' :
                        m.rank === 2 ? 'bg-zinc-200 text-zinc-700' :
                        m.rank === 3 ? 'bg-amber-50 text-amber-700' :
                        'text-zinc-500'
                      }`}>
                        #{m.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 text-sm flex items-center gap-2">
                        {m.mentor_name}
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100" />
                      </div>
                      <div className="text-zinc-400 font-mono text-[11px]">{m.mentor_email}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-700">
                      {m.student_count} Students
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#EE3124] h-1.5 rounded-full" style={{ width: `${m.avg_progress}%` }}></div>
                        </div>
                        <span className="font-bold text-zinc-800">{m.avg_progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-emerald-700">{m.avg_success_rate}%</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-900">
                      {m.problems_solved}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-[#EE3124] bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                        {m.growth_score} pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mentor Drilldown Modal */}
      <Modal
        isOpen={Boolean(selectedMentor)}
        onClose={() => setSelectedMentor(null)}
        title={`Mentor Pod Diagnostic: ${selectedMentor?.mentor_name}`}
        maxWidth="3xl"
      >
        {detailLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500 animate-pulse">Loading assigned student group...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
              <div>
                <span className="text-zinc-500 block uppercase tracking-wider text-[10px] font-bold">Total Assigned</span>
                <span className="text-lg font-black text-zinc-900">{mentorDetail?.students?.length || 0} Students</span>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase tracking-wider text-[10px] font-bold">Avg Progress</span>
                <span className="text-lg font-black text-[#EE3124]">{selectedMentor?.avg_progress || 0}%</span>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase tracking-wider text-[10px] font-bold">Growth Score</span>
                <span className="text-lg font-black text-zinc-900">{selectedMentor?.growth_score || 0} pts</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-3">
                Assigned Students in Pod
              </h4>
              {mentorDetail?.students?.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No students assigned to this mentor yet.</p>
              ) : (
                <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Student</th>
                        <th className="px-4 py-2.5">Belt</th>
                        <th className="px-4 py-2.5">XP</th>
                        <th className="px-4 py-2.5">Solved</th>
                        <th className="px-4 py-2.5">Success Rate</th>
                        <th className="px-4 py-2.5">Streak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {mentorDetail?.students?.map((s: any) => (
                        <tr key={s.student_id} className="hover:bg-zinc-50">
                          <td className="px-4 py-3 font-bold text-zinc-900">
                            {s.student_name}
                            <span className="block font-mono text-[10px] text-zinc-400 font-normal">{s.student_email}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={s.belt_name === 'White Belt' ? 'gray' : 'yellow'} size="sm">
                              {s.belt_name}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-bold text-[#EE3124]">{s.xp}</td>
                          <td className="px-4 py-3 font-semibold text-zinc-800">{s.problems_solved}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-700">{s.success_rate}%</td>
                          <td className="px-4 py-3 text-zinc-600">{s.streak}d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
