import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';
import { 
  LogOut, 
  User, 
  LayoutDashboard, 
  Users, 
  Code2, 
  BookOpen, 
  RotateCcw, 
  Award, 
  TrendingUp, 
  ShieldCheck,
  Building2,
  FileText
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const roleBadgeVariant: Record<string, 'red' | 'black' | 'blue' | 'purple'> = {
    super_admin: 'red',
    campus_manager: 'black',
    growth_mentor: 'blue',
    student: 'purple'
  };

  const roleLabel: Record<string, string> = {
    super_admin: 'Super Admin',
    campus_manager: 'Campus Manager',
    growth_mentor: 'Growth Mentor',
    student: 'Student'
  };

  // Role-specific navigation links
  const getNavLinks = () => {
    switch (user.role) {
      case 'super_admin':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Users & Mentors', path: '/admin/users', icon: Users },
          { name: 'Problem Builder', path: '/admin/problems', icon: Code2 },
          { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck }
        ];
      case 'campus_manager':
        return [
          { name: 'Dashboard', path: '/campus/dashboard', icon: LayoutDashboard },
          { name: 'Mentor Performance', path: '/campus/mentors', icon: TrendingUp },
          { name: 'Top Performers', path: '/campus/top-performers', icon: Award }
        ];
      case 'growth_mentor':
        return [
          { name: 'Dashboard', path: '/mentor/dashboard', icon: LayoutDashboard },
          { name: 'My Students', path: '/mentor/students', icon: Users }
        ];
      case 'student':
        return [
          { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
          { name: 'Learn', path: '/student/learn', icon: BookOpen },
          { name: 'Practice', path: '/student/practice', icon: Code2 },
          { name: 'Revise', path: '/student/revise', icon: RotateCcw },
          { name: 'Profile', path: '/student/profile', icon: User }
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Presentation: Kalvi - RED, Learn - BLACK */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="/kalvi-logo.png" 
                alt="Kalvi Logo" 
                className="w-8 h-8 object-contain transition-transform group-hover:scale-105" 
              />
              <div className="flex items-baseline gap-1 text-xl font-black tracking-tight">
                <span className="text-[#EE3124]">Kalvi</span>
                <span className="text-[#09090B]">Learn</span>
              </div>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-red-50 text-[#EE3124]'
                        : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#EE3124]' : 'text-zinc-400'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-right">
              <div>
                <p className="text-xs font-bold text-zinc-900 leading-tight">{user.full_name}</p>
                <p className="text-[11px] text-zinc-400 leading-tight truncate max-w-[150px]">{user.email}</p>
              </div>
              <Badge variant={roleBadgeVariant[user.role]} size="sm">
                {roleLabel[user.role]}
              </Badge>
            </div>

            <button
              onClick={signOut}
              title="Sign Out"
              className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
