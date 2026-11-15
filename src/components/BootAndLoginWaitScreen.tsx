'use client';

import React from 'react';
import { KindredCareLogo } from './KindredCareBrand';

export interface ReadinessStep {
  id: string;
  label: string;
  detail: string;
  status: 'pending' | 'active' | 'done';
}

export function BootAndLoginWaitScreen({
  mode = 'boot',
  roleTarget,
  steps,
  progressPercent,
}: {
  mode?: 'boot' | 'role_login';
  roleTarget?: 'elder' | 'caretaker' | 'family';
  steps: ReadinessStep[];
  progressPercent: number;
}) {
  const roleLabelMap = {
    elder: 'Smt. Kamala Devi — Calm Elder Companion',
    caretaker: 'Ananya Rao — Clinical Caretaker Station',
    family: 'Geetesh Gollapalli — Family Peace-of-Mind Hub',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F6F5F1] px-4 py-8"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-lg rounded-2xl border border-black/10 bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-2xl bg-[#0F524B]/8 p-3">
            <KindredCareLogo size={56} showWordmark={false} />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0F524B]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0F524B]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#0F524B]" />
            {mode === 'boot'
              ? 'Initializing Crash-Free Healthcare Vault'
              : `Unlocking ${roleTarget?.toUpperCase()} Workspace`}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#14171A]">
            {mode === 'boot'
              ? 'KindredCare AI'
              : roleTarget
                ? roleLabelMap[roleTarget]
                : 'Preparing Care Circle Workspace'}
          </h1>
          <p className="mt-1 text-sm text-[#57606A]">
            {mode === 'boot'
              ? 'Verifying backend services, AI safety engines, and schema integrity before launch.'
              : 'Hydrating live medication logs, autonomy rules, and role-isolated tools.'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#57606A]">
            <span>Backend &amp; State Readiness</span>
            <span>{Math.min(100, Math.round(progressPercent))}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EFECE6]">
            <div
              className="h-full rounded-full bg-[#0F524B] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(8, progressPercent))}%` }}
            />
          </div>
        </div>

        {/* Step-by-Step Verification Checklist */}
        <div className="mt-6 space-y-2.5">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                step.status === 'done'
                  ? 'border-[#0E6B50]/25 bg-[#0E6B50]/5'
                  : step.status === 'active'
                    ? 'border-[#0F524B]/40 bg-[#F6F5F1]'
                    : 'border-black/5 bg-white opacity-60'
              }`}
            >
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                {step.status === 'done' ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0E6B50] text-white">
                    ✓
                  </span>
                ) : step.status === 'active' ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0F524B] border-t-transparent" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-[#14171A]">{step.label}</div>
                <div className="text-xs text-[#57606A]">{step.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
