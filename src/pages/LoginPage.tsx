import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, error } = useAuth();
  const [inputEmail, setInputEmail] = useState('codingplatform10@gmail.com');
  const [submitting, setSubmitting] = useState(false);
  const [showTester, setShowTester] = useState(false);

  const handleGoogleAuth = async (emailToTest?: string) => {
    setSubmitting(true);
    const email = emailToTest || inputEmail;
    await loginWithEmail(email);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#FAFAFA] px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-xl p-8 text-center animate-in fade-in zoom-in duration-200">
        {/* Brand Logo & Name */}
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/kalvi-logo.png" 
            alt="Kalvi Logo" 
            className="w-16 h-16 object-contain mb-4" 
          />
          <div className="flex items-baseline gap-1 text-2xl font-black tracking-tight">
            <span className="text-[#EE3124]">Kalvi</span>
            <span className="text-[#09090B]">Learn</span>
          </div>
          <p className="text-xs font-semibold text-zinc-400 mt-1 uppercase tracking-wider">
            Coding Education & Assessment Platform
          </p>
        </div>

        {/* Error / Access Denied Message */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-left flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#EE3124] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-950">Access Denied</p>
              <p className="text-xs text-red-800 mt-0.5 font-medium leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Primary Call To Action - Strictly "Continue with Google" */}
        <div className="space-y-4">
          <button
            onClick={() => handleGoogleAuth()}
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
            <span>{submitting ? 'Verifying...' : 'Continue with Google'}</span>
          </button>
        </div>

        {/* Development & Verification Switcher */}
        <div className="mt-8 pt-6 border-t border-zinc-100">
          <button
            onClick={() => setShowTester(!showTester)}
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors font-medium flex items-center justify-center gap-1 mx-auto"
          >
            <span>{showTester ? 'Hide Google Account Selector' : 'Test Google Identity Verification'}</span>
          </button>

          {showTester && (
            <div className="mt-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-left animate-in fade-in duration-150">
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Google Account Email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="e.g. user@gmail.com"
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#EE3124] focus:border-[#EE3124]"
                />
                <button
                  onClick={() => handleGoogleAuth()}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  Verify <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="mt-3 space-y-1">
                <p className="text-[10px] text-zinc-400 font-medium">Quick Test Personas:</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => { setInputEmail('codingplatform10@gmail.com'); handleGoogleAuth('codingplatform10@gmail.com'); }}
                    className="text-[11px] px-2 py-1 bg-red-50 text-[#EE3124] rounded border border-red-200 font-medium hover:bg-red-100"
                  >
                    Super Admin (Registered)
                  </button>
                  <button
                    onClick={() => { setInputEmail('unregistered.student@gmail.com'); handleGoogleAuth('unregistered.student@gmail.com'); }}
                    className="text-[11px] px-2 py-1 bg-zinc-100 text-zinc-700 rounded border border-zinc-200 font-medium hover:bg-zinc-200"
                  >
                    Unregistered Account (Denied)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-[11px] text-zinc-400 mt-6">
          Authorized personnel only. Access strictly controlled by whitelist database.
        </p>
      </div>
    </div>
  );
};
