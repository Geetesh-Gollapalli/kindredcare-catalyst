'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  HeartHandshake,
  Stethoscope,
  Users,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { CareRole } from '@/types/domain';

interface PasscodeAccessModalProps {
  isOpen: boolean;
  currentRole: CareRole;
  onClose?: () => void;
  onAuthenticated: (data: {
    role: CareRole;
    memberName: string;
    token: string;
  }) => void;
}

const ROLE_PRESETS: Array<{
  role: CareRole;
  title: string;
  memberName: string;
  passcode: string;
  badge: string;
  description: string;
  colorClass: string;
}> = [
  {
    role: 'elder',
    title: 'Smt. Kamala Devi (Age 74)',
    memberName: 'Smt. Kamala Devi',
    passcode: '1234',
    badge: 'Elder Easy-PIN: 1234',
    description:
      'Center of Care • Simplified "My Day" Sanctuary, Voice Read-Aloud, Pill Explainer & Autonomy Controls.',
    colorClass: 'border-teal-600 bg-teal-50/70 text-teal-950',
  },
  {
    role: 'caretaker',
    title: 'Ananya Rao (Primary Caretaker)',
    memberName: 'Ananya Rao',
    passcode: 'CARE2026',
    badge: 'Passcode: CARE2026',
    description:
      'Full Clinical Schedule Management, AI Prescription Scanner, Drug Safety Guard & Proactive Email Rules.',
    colorClass: 'border-blue-600 bg-blue-50/70 text-blue-950',
  },
  {
    role: 'family',
    title: 'Geetesh Gollapalli (Family Circle)',
    memberName: 'Geetesh Gollapalli',
    passcode: 'FAMILY26',
    badge: 'Passcode: FAMILY26',
    description:
      'Real-Time Adherence Monitoring, Missed-Dose Email Alerts, Shared Care Notes & Doctor Visit Briefs.',
    colorClass: 'border-indigo-600 bg-indigo-50/70 text-indigo-950',
  },
];

export function PasscodeAccessModal({
  isOpen,
  currentRole,
  onClose,
  onAuthenticated,
}: PasscodeAccessModalProps) {
  const [circleCode, setCircleCode] = useState('KC-2026');
  const [selectedRole, setSelectedRole] = useState<CareRole>(currentRole);
  const [passcode, setPasscode] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: (typeof ROLE_PRESETS)[number]) => {
    setSelectedRole(preset.role);
    setPasscode(preset.passcode);
    setError(null);
  };

  const handleSubmit = async (
    e?: React.FormEvent,
    overridePreset?: (typeof ROLE_PRESETS)[number]
  ) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const targetRole = overridePreset ? overridePreset.role : selectedRole;
    const targetPasscode = overridePreset ? overridePreset.passcode : passcode;
    const targetName = overridePreset
      ? overridePreset.memberName
      : ROLE_PRESETS.find((r) => r.role === targetRole)?.memberName;

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          circleCode,
          passcode: targetPasscode,
          role: targetRole,
          memberName: targetName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Passcode verification failed.');
        setLoading(false);
        return;
      }

      onAuthenticated({
        role: data.session.role,
        memberName: data.session.memberName,
        token: data.token,
      });
      setLoading(false);
      if (onClose) onClose();
    } catch {
      setError('Network error while verifying passcode.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="passcode-modal-title"
    >
      <div className="w-full max-w-2xl rounded-3xl bg-white border-2 border-slate-200 shadow-2xl overflow-hidden my-8">
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 px-6 py-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 border border-teal-300/30">
                <ShieldCheck className="h-7 w-7 text-teal-300" aria-hidden="true" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-400/20 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-teal-200">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Passcode-Secured Care Circle
                </span>
                <h2
                  id="passcode-modal-title"
                  className="text-2xl font-extrabold tracking-tight mt-0.5"
                >
                  KindredCare Shared Access Gate
                </h2>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20 transition"
                aria-label="Close passcode dialog"
              >
                Close ✕
              </button>
            )}
          </div>
          <p className="mt-3 text-sm text-teal-100 leading-relaxed">
            Each Care Circle profile uses role-scoped cryptographic passcodes (
            <code className="rounded bg-black/30 px-1.5 py-0.5 text-teal-200">
              scrypt + timingSafeEqual
            </code>
            ) so Elderly Individuals, Caretakers, and Family Members collaborate safely while
            keeping the elder in control.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-teal-600" aria-hidden="true" />
              Select Role Profile (1-Click Quick Fill & Switch)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ROLE_PRESETS.map((preset) => {
                const isSelected = selectedRole === preset.role;
                const Icon =
                  preset.role === 'elder'
                    ? HeartHandshake
                    : preset.role === 'caretaker'
                      ? Stethoscope
                      : Users;
                return (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => {
                      handleSelectPreset(preset);
                      void handleSubmit(undefined, preset);
                    }}
                    className={`text-left rounded-2xl border-2 p-4 transition-all flex flex-col justify-between ${
                      isSelected
                        ? `${preset.colorClass} ring-2 ring-teal-600 shadow-md`
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm border border-slate-200">
                          <Icon className="h-5 w-5 text-teal-700" aria-hidden="true" />
                        </span>
                        <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-mono font-bold text-white">
                          {preset.badge}
                        </span>
                      </div>
                      <div className="font-bold text-base text-slate-900">
                        {preset.title}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-teal-800">
                      <span>Enter as {preset.role.toUpperCase()}</span>
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="circle-code-input"
                  className="block text-sm font-bold text-slate-800 mb-1.5"
                >
                  Care Circle Access Code
                </label>
                <input
                  id="circle-code-input"
                  type="text"
                  value={circleCode}
                  onChange={(e) => setCircleCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-base font-mono font-bold text-slate-900 focus:border-teal-600"
                  placeholder="KC-2026"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="passcode-input"
                  className="block text-sm font-bold text-slate-800 mb-1.5"
                >
                  Role Passcode / Elder Easy-PIN
                </label>
                <div className="relative">
                  <input
                    id="passcode-input"
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-300 pl-10 pr-4 py-3 text-base font-mono font-bold text-slate-900 focus:border-teal-600"
                    placeholder="Enter 1234, CARE2026, or FAMILY26"
                    required
                  />
                  <KeyRound
                    className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm font-semibold text-red-900"
              >
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-600">
                <strong>Security Proof:</strong> Salted <code className="font-mono">scrypt</code> +
                HMAC-SHA256 HttpOnly Cookie + 5-attempt lockout
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3.5 text-base font-bold text-white shadow-lg hover:bg-teal-800 disabled:opacity-50 transition"
              >
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                {loading ? 'Verifying Passcode...' : 'Unlock Care Circle Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
