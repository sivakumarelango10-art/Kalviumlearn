import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/ui/Navbar';
import { LoginPage } from './pages/LoginPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminProblemsPage } from './pages/admin/AdminProblemsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

// Campus Pages
import { CampusDashboard } from './pages/campus/CampusDashboard';
import { CampusMentorsPage } from './pages/campus/CampusMentorsPage';
import { CampusTopPerformersPage } from './pages/campus/CampusTopPerformersPage';

// Mentor Pages
import { MentorDashboard } from './pages/mentor/MentorDashboard';
import { MentorStudentsPage } from './pages/mentor/MentorStudentsPage';
import { MentorStudentDetailPage } from './pages/mentor/MentorStudentDetailPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentLearnPage } from './pages/student/StudentLearnPage';
import { StudentPracticePage } from './pages/student/StudentPracticePage';
import { StudentArenaPage } from './pages/student/StudentArenaPage';
import { StudentRevisePage } from './pages/student/StudentRevisePage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Role Guard Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ('super_admin' | 'campus_manager' | 'growth_mentor' | 'student')[];
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-zinc-400 text-xs font-semibold animate-pulse">
        Verifying Google credentials...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's permitted role dashboard
    const roleRedirect: Record<string, string> = {
      super_admin: '/admin/dashboard',
      campus_manager: '/campus/dashboard',
      growth_mentor: '/mentor/dashboard',
      student: '/student/dashboard'
    };
    return <Navigate to={roleRedirect[user.role] || '/login'} replace />;
  }

  return <>{children}</>;
};

// Root index redirector
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-zinc-400 text-xs font-semibold animate-pulse">
        Loading Kalvi Learn...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'super_admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'campus_manager':
      return <Navigate to="/campus/dashboard" replace />;
    case 'growth_mentor':
      return <Navigate to="/mentor/dashboard" replace />;
    case 'student':
      return <Navigate to="/student/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-[#09090B]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Super Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/problems"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminProblemsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminAuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* Campus Manager Routes */}
          <Route
            path="/campus/dashboard"
            element={
              <ProtectedRoute allowedRoles={['campus_manager', 'super_admin']}>
                <CampusDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campus/mentors"
            element={
              <ProtectedRoute allowedRoles={['campus_manager', 'super_admin']}>
                <CampusMentorsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campus/top-performers"
            element={
              <ProtectedRoute allowedRoles={['campus_manager', 'super_admin']}>
                <CampusTopPerformersPage />
              </ProtectedRoute>
            }
          />

          {/* Growth Mentor Routes */}
          <Route
            path="/mentor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['growth_mentor', 'super_admin']}>
                <MentorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentor/students"
            element={
              <ProtectedRoute allowedRoles={['growth_mentor', 'super_admin']}>
                <MentorStudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mentor/students/:studentId"
            element={
              <ProtectedRoute allowedRoles={['growth_mentor', 'super_admin']}>
                <MentorStudentDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['student', 'super_admin']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/learn"
            element={
              <ProtectedRoute allowedRoles={['student', 'super_admin']}>
                <StudentLearnPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/practice"
            element={
              <ProtectedRoute allowedRoles={['student', 'super_admin']}>
                <StudentPracticePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/practice/:problemId"
            element={
              <ProtectedRoute allowedRoles={['student', 'super_admin']}>
                <StudentArenaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/revise"
            element={
              <ProtectedRoute allowedRoles={['student', 'super_admin']}>
                <StudentRevisePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student', 'super_admin']}>
                <StudentProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
