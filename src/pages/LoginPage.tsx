import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, ShieldCheck, User, Users, GraduationCap, Building2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, signInWithGoogle, error } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [inputEmail, setInputEmail] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  const handleGoogleAuth = async (overrideEmail?: string) => {
    setSubmitting(true);
    setCustomError(null);
    try {
      if (overrideEmail || inputEmail) {
        const ok = await loginWithEmail(overrideEmail || inputEmail);
        if (!ok) {
          // Handled via context error
        }
      } else {
        await signInWithGoogle();
      }
    } catch (err: any) {
      setCustomError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const demoAccounts = [
    {
      role: 'Super Admin',
      email: 'codingplatform10@gmail.com',
      name: 'Super Admin',
      description: 'System governance, problem authoring with 10 test cases, user management & audit logs',
      badgeColor: 'bg-red-50 text-[#EE3124] border-red-200',
      icon: ShieldCheck,
      iconColor: 'text-[#EE3124]'
    },
    {
      role: 'Growth Mentor',
      email: 'mentor@kalvilearn.edu',
      name: 'Mentor Priya Raman',
      description: 'Assigned student pod, diagnostic deep-dive ("What does this student need help with?")',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Users,
      iconColor: 'text-blue-600'
    },
    {
      role: 'Student',
      email: 'student@kalvilearn.edu',
      name: 'Kavya Subramanian',
      description: 'Monaco coding arena, 10 test case verification, belt progression & revision hub',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: GraduationCap,
      iconColor: 'text-purple-600'
    },
    {
      role: 'Campus Manager',
      email: 'campusmanager@kalvilearn.edu',
      name: 'Campus Lead Rajesh',
      description: 'Campus telemetry, weighted aggregate mentor rankings & top performers PDF/XLSX export',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Building2,
      iconColor: 'text-amber-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-zinc-200 shadow-sm p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Logo & Wordmark */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <img
            src="/kalvi-logo.png"
            alt="Kalvi Logo"
            className="w-14 h-14 object-contain shadow-sm rounded-xl p-1 bg-white border border-zinc-100"
          />
          <div>
            <span className="text-2xl font-black tracking-tight text-[#EE3124]">Kalvi</span>
            <span className="text-2xl font-black tracking-tight text-[#09090B] ml-1.5">Learn</span>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Production Coding Education & Assessment Platform
            </p>
          </div>
        </div>

        {/* Whitelist Alert / Access Denied Banner */}
        {(error || customError) && (
          <div className="p-4 bg-red-50/80 border border-red-200 rounded-2xl text-left flex items-start gap-3 animate-in shake duration-200">
            <AlertCircle className="w-5 h-5 text-[#EE3124] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-red-900 font-semibold">
              {error || customError}
            </div>
          </div>
        )}

        {/* Primary Call To Action - Strictly "Continue with Google" */}
        <div className="space-y-3">
          <button
            onClick={() => handleGoogleAuth('codingplatform10@gmail.com')}
            disabled={submitting}
            className="w-full h-12 flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-sm rounded-xl border border-zinc-300 shadow-sm transition-all hover:shadow hover:border-zinc-400 active:scale-[0.99] disabled:opacity-50"
          >
            {/* Official Google 'G' icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{submitting ? 'Verifying Credentials...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Instant Demo Quick Access Section */}
        <div className="pt-6 border-t border-zinc-100 text-left space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              1-Click Demo Personas
            </h3>
            <span className="text-[10px] text-zinc-400 font-medium">Instant Role Access</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {demoAccounts.map((acc) => {
              const Icon = acc.icon;
              return (
                <button
                  key={acc.role}
                  onClick={() => handleGoogleAuth(acc.email)}
                  disabled={submitting}
                  className="w-full p-3 bg-zinc-50/70 hover:bg-zinc-100/80 border border-zinc-200 rounded-xl transition-all text-left flex items-start justify-between group disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-white border border-zinc-200 ${acc.iconColor} shrink-0 mt-0.5 shadow-2xs`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900">{acc.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${acc.badgeColor}`}>
                          {acc.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{acc.description}</p>
                      <span className="text-[10px] font-mono text-zinc-400 mt-1 block">{acc.email}</span>
                    </div>
                  </div>
                  <div className="self-center pl-2 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Email Whitelist Tester */}
        <div className="pt-4 border-t border-zinc-100 text-left space-y-2">
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Or test arbitrary email for whitelist rejection:
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="e.g. unregistered.student@gmail.com"
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124]"
            />
            <button
              onClick={() => handleGoogleAuth()}
              disabled={submitting || !inputEmail}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
            >
              Test
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-zinc-400 pt-2">
          Google OAuth Whitelist Architecture • Kalvi Campus (KALVI-01)
        </p>
      </div>
    </div>
  );
};
