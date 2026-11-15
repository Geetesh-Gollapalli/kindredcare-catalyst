'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { KindredCareGlassLogo } from './GlassIconReveal';
import TechText from './TechText';

export interface ReadinessStep {
  id: string;
  label: string;
  detail: string;
  status: 'pending' | 'active' | 'done';
}

export function BootAndLoginWaitScreen({
  mode = 'boot',
  roleTarget,
  profileName,
  steps,
  progressPercent,
}: {
  mode?: 'boot' | 'role_login';
  roleTarget?: 'elder' | 'caretaker' | 'family';
  profileName?: string;
  steps: ReadinessStep[];
  progressPercent: number;
}) {
  const roleLabelMap = {
    elder: profileName ? `${profileName} — Elder Companion` : 'Elder Companion Workspace',
    caretaker: profileName ? `${profileName} — Clinical Station` : 'Clinical Caretaker Station',
    family: profileName ? `${profileName} — Family Circle` : 'Family Overview Workspace',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-black px-4 py-8 text-[#f5f5f5]"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-xl">
        {/* Hero Centerpiece on Pure Black Canvas: 21st.dev GlassIconReveal Logo + React Bits TechText directly underneath */}
        <div className="flex flex-col items-center text-center">
          <div className="h-44 w-44 sm:h-52 sm:w-52">
            <KindredCareGlassLogo
              className="h-full w-full"
              tileSize={210}
              look="dark"
              background="#000000"
              logoColor="#ffffff"
              speed={1.15}
              hold={1.4}
            />
          </div>

          <div className="mx-auto -mt-2 h-20 w-full max-w-md">
            <TechText
              text="KindredCare AI"
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight={600}
              fontSize={40}
              color="#f5f5f5"
              accentColor="#5227FF"
              align="center"
              reveal="letter"
              dashLength={4}
              dashGap={2}
              specks={15}
              intro="type"
              introDuration={1.8}
              clickKick
              guides={false}
            />
          </div>

          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#5227FF]/40 bg-[#5227FF]/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-violet-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#5227FF]" />
            {mode === 'boot'
              ? 'Initializing Healthcare Vault'
              : roleTarget
                ? roleLabelMap[roleTarget]
                : 'Unlocking Role Workspace'}
          </div>

          <p className="mt-2.5 max-w-md text-sm text-zinc-400">
            {mode === 'boot'
              ? 'Verifying encrypted persistence, AI clinical safety engines, and schema integrity before launch.'
              : 'Hydrating live medication logs, autonomy rules, and role-isolated tools.'}
          </p>
        </div>

        {/* Readiness Progress & Step Checklist */}
        <div className="mt-7 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-zinc-400">
            <span>Backend &amp; State Readiness</span>
            <span className="font-mono text-zinc-200">
              {Math.min(100, Math.round(progressPercent))}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-[#5227FF] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(8, progressPercent))}%` }}
            />
          </div>

          <div className="mt-5 space-y-2">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                  step.status === 'done'
                    ? 'border-[#5227FF]/35 bg-[#5227FF]/10'
                    : step.status === 'active'
                      ? 'border-zinc-700 bg-zinc-900'
                      : 'border-zinc-900 bg-zinc-950 opacity-50'
                }`}
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                  {step.status === 'done' ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      size={18}
                      strokeWidth={2}
                      className="text-violet-300"
                    />
                  ) : step.status === 'active' ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#5227FF] border-t-transparent" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-zinc-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-zinc-100">{step.label}</div>
                  <div className="text-xs text-zinc-400">{step.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
