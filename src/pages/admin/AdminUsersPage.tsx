import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Users, Plus, UserCheck, ShieldAlert, ArrowRightLeft, FolderTree, CheckCircle2, UserX } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'students' | 'mentors' | 'managers' | 'tree'>('students');
  const [users, setUsers] = useState<any[]>([]);
  const [mentorsList, setMentorsList] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newMentorId, setNewMentorId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'student',
    mentor_id: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, treeRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/mentor-tree')
      ]);
      const usersData = await usersRes.json();
      const tree = await treeRes.json();

      setUsers(usersData.users || []);
      setTreeData(tree.tree || []);

      // Filter active mentors for student assignment dropdown
      const mentors = (usersData.users || []).filter((u: any) => u.role === 'growth_mentor' && u.status === 'active');
      setMentorsList(mentors);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validate mandatory Growth Mentor assignment for student
    if (formData.role === 'student' && !formData.mentor_id) {
      setFormError('Growth Mentor assignment is required when creating a Student.');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          actor_email: currentUser?.email
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setFormSuccess(`User ${data.user.email} successfully created!`);
      setFormData({ email: '', full_name: '', role: 'student', mentor_id: '' });
      setTimeout(() => {
        setModalOpen(false);
        setFormSuccess(null);
      }, 1200);
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          actor_email: currentUser?.email
        })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleReassignMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !newMentorId) return;

    try {
      const res = await fetch(`/api/admin/students/${selectedStudent.id}/reassign-mentor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_mentor_id: newMentorId,
          actor_email: currentUser?.email
        })
      });

      if (res.ok) {
        setReassignModalOpen(false);
        setSelectedStudent(null);
        setNewMentorId('');
        fetchData();
      }
    } catch (err) {
      console.error('Reassign failed:', err);
    }
  };

  const filteredUsers = users.filter(u => {
    if (activeTab === 'students') return u.role === 'student';
    if (activeTab === 'mentors') return u.role === 'growth_mentor';
    if (activeTab === 'managers') return u.role === 'campus_manager';
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">User & Mentor Governance</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage single-campus hierarchy, student pods, and mentor assignments</p>
        </div>
        <button
          onClick={() => { setFormError(null); setModalOpen(true); }}
          className="px-4 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New User
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'students' ? 'border-[#EE3124] text-[#EE3124]' : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Students ({users.filter(u => u.role === 'student').length})
        </button>
        <button
          onClick={() => setActiveTab('mentors')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'mentors' ? 'border-[#EE3124] text-[#EE3124]' : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Growth Mentors ({users.filter(u => u.role === 'growth_mentor').length})
        </button>
        <button
          onClick={() => setActiveTab('managers')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'managers' ? 'border-[#EE3124] text-[#EE3124]' : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          Campus Managers ({users.filter(u => u.role === 'campus_manager').length})
        </button>
        <button
          onClick={() => setActiveTab('tree')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'tree' ? 'border-[#EE3124] text-[#EE3124]' : 'border-transparent text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" /> Mentor Hierarchy Tree
        </button>
      </div>

      {/* Content */}
      {activeTab === 'tree' ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">
            Growth Mentor to Student Hierarchy
          </h3>
          {treeData.length === 0 ? (
            <EmptyState title="No Growth Mentors added yet" description="Add Growth Mentors and assign students to view hierarchy." />
          ) : (
            <div className="space-y-6">
              {treeData.map((mentor) => (
                <div key={mentor.mentor_id} className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
                        GM
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">{mentor.mentor_name}</h4>
                        <p className="text-xs text-zinc-500">{mentor.mentor_email}</p>
                      </div>
                    </div>
                    <Badge variant="blue" size="sm">{mentor.students.length} Assigned Students</Badge>
                  </div>

                  {/* Student list */}
                  <div className="mt-4 pl-4 border-l-2 border-zinc-200 space-y-2">
                    {mentor.students.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic py-1">No students assigned to this mentor yet.</p>
                    ) : (
                      mentor.students.map((student: any) => (
                        <div key={student.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-zinc-200 text-xs">
                          <div>
                            <span className="font-semibold text-zinc-900">{student.full_name}</span>
                            <span className="text-zinc-400 ml-2 font-mono">({student.email})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-zinc-700">{student.problems_solved || 0} Solved</span>
                            <span className="text-[#EE3124] font-bold">{student.xp || 0} XP</span>
                            <Badge variant={student.belt_name === 'White Belt' ? 'gray' : 'yellow'} size="sm">
                              {student.belt_name}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
          {filteredUsers.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title={`No ${activeTab} have been added yet.`}
                description="Use the button above to add registered Google accounts to the platform."
                actionText="Add New User"
                onAction={() => setModalOpen(true)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Role</th>
                    {activeTab === 'students' && <th className="px-6 py-3.5">Growth Mentor</th>}
                    {activeTab === 'students' && <th className="px-6 py-3.5">Belt & XP</th>}
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-900 text-sm">{u.full_name}</div>
                        <div className="text-zinc-400 font-mono text-[11px]">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            u.role === 'super_admin' ? 'red' :
                            u.role === 'campus_manager' ? 'black' :
                            u.role === 'growth_mentor' ? 'blue' : 'purple'
                          }
                          size="sm"
                        >
                          {u.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      {activeTab === 'students' && (
                        <td className="px-6 py-4">
                          {u.mentor_name ? (
                            <div>
                              <span className="font-semibold text-zinc-900">{u.mentor_name}</span>
                              <div className="text-zinc-400 text-[11px]">{u.mentor_email}</div>
                            </div>
                          ) : (
                            <span className="text-red-500 font-semibold">Unassigned</span>
                          )}
                        </td>
                      )}
                      {activeTab === 'students' && (
                        <td className="px-6 py-4">
                          <div className="font-bold text-zinc-900">{u.belt_name || 'White Belt'}</div>
                          <div className="text-[#EE3124] font-semibold">{u.xp || 0} XP • {u.problems_solved || 0} Solved</div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <Badge variant={u.status === 'active' ? 'green' : 'gray'} size="sm">
                          {u.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {activeTab === 'students' && (
                          <button
                            onClick={() => {
                              setSelectedStudent(u);
                              setNewMentorId(u.mentor_id || '');
                              setReassignModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors inline-flex items-center gap-1"
                          >
                            <ArrowRightLeft className="w-3 h-3" /> Reassign Mentor
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleStatus(u.id, u.status)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                            u.status === 'active'
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register New User"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-[#EE3124] text-xs font-semibold rounded-lg border border-red-200">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {formSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Google Account Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. learner@gmail.com"
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124] focus:border-[#EE3124]"
            />
            <p className="text-[11px] text-zinc-400 mt-1">Must match the user's authentic Google OAuth account.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Aditi Sharma"
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124] focus:border-[#EE3124]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Platform Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124] focus:border-[#EE3124]"
            >
              <option value="student">Student (Capacity: max 300)</option>
              <option value="growth_mentor">Growth Mentor (Capacity: max 20)</option>
              <option value="campus_manager">Campus Manager (Capacity: max 5)</option>
            </select>
          </div>

          {/* Mandatory Growth Mentor Assignment for Student */}
          {formData.role === 'student' && (
            <div>
              <label className="block text-xs font-bold text-[#EE3124] uppercase tracking-wider mb-1">
                Assign Growth Mentor * (Mandatory)
              </label>
              <select
                required
                value={formData.mentor_id}
                onChange={(e) => setFormData({ ...formData, mentor_id: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-zinc-50 border border-red-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124] focus:border-[#EE3124]"
              >
                <option value="">-- Select Active Growth Mentor --</option>
                {mentorsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.email})
                  </option>
                ))}
              </select>
              {mentorsList.length === 0 && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  Notice: No active Growth Mentors exist. You must create a Growth Mentor first before creating Students.
                </p>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formData.role === 'student' && mentorsList.length === 0}
              className="px-4 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
            >
              Create User
            </button>
          </div>
        </form>
      </Modal>

      {/* Reassign Growth Mentor Modal */}
      <Modal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title={`Reassign Mentor for ${selectedStudent?.full_name}`}
        maxWidth="md"
      >
        <form onSubmit={handleReassignMentor} className="space-y-4">
          <p className="text-xs text-zinc-600 leading-relaxed">
            Reassigning a student updates their active Growth Mentor pod while preserving their historical submissions, XP, streak, and achievements.
          </p>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Select New Growth Mentor *
            </label>
            <select
              required
              value={newMentorId}
              onChange={(e) => setNewMentorId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124]"
            >
              <option value="">-- Select Mentor --</option>
              {mentorsList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setReassignModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#EE3124] hover:bg-[#C91F13] text-white text-xs font-semibold rounded-lg"
            >
              Confirm Reassignment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
