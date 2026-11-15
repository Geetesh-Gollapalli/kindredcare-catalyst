'use client';

import React from 'react';
import type { CareCircleState, PillShape } from '@/types/domain';

/**
 * Custom KindredCare Vector Emblem:
 * Interlocking protective care hands arc + warm heart + clinical cross
 */
export function KindredCareLogo({
  size = 40,
  showWordmark = true,
  subtitle,
}: {
  size?: number;
  showWordmark?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="inline-flex items-center gap-3 select-none">
      <div
        style={{ width: size, height: size }}
        className="relative flex shrink-0 items-center justify-center rounded-xl bg-[#0F524B] text-white shadow-sm ring-1 ring-black/10"
        aria-hidden="true"
      >
        <svg
          width={Math.round(size * 0.68)}
          height={Math.round(size * 0.68)}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Protective Care Arc */}
          <path
            d="M4.5 18.5C4.5 24.5 9.6 28.5 16 28.5C22.4 28.5 27.5 24.5 27.5 18.5"
            stroke="#FBBF24"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          {/* Heart Shield */}
          <path
            d="M16 23.2L8.9 16.4C6.8 14.3 6.8 10.9 8.9 8.8C10.9 6.8 14.1 7 16 9.2C17.9 7 21.1 6.8 23.1 8.8C25.2 10.9 25.2 14.3 23.1 16.4L16 23.2Z"
            fill="#FFFFFF"
            fillOpacity="0.95"
          />
          {/* Clinical Cross inside Heart */}
          <path
            d="M16 11.4V17.4M13 14.4H19"
            stroke="#0F524B"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-lg font-bold tracking-tight text-[#14171A]">
              KindredCare
            </span>
            <span className="rounded-md bg-[#0F524B]/10 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0F524B]">
              AI
            </span>
          </div>
          {subtitle && (
            <span className="text-xs font-medium text-[#57606A]">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * True-to-life SVG Pill Visual with Stamped Imprint Code
 */
export function PillBadgeSvg({
  colorName = 'White',
  shape = 'round',
  imprint = 'RX',
  size = 48,
}: {
  colorName?: string;
  shape?: PillShape;
  imprint?: string;
  size?: number;
}) {
  const colorMap: Record<string, { fill: string; secondary: string; text: string }> = {
    white: { fill: '#FFFFFF', secondary: '#F1F5F9', text: '#334155' },
    'sky blue': { fill: '#BAE6FD', secondary: '#7DD3FC', text: '#0C4A6E' },
    blue: { fill: '#BAE6FD', secondary: '#7DD3FC', text: '#0C4A6E' },
    'soft yellow': { fill: '#FDE68A', secondary: '#FCD34D', text: '#78350F' },
    'pale yellow': { fill: '#FEF08A', secondary: '#FDE047', text: '#713F12' },
    yellow: { fill: '#FDE68A', secondary: '#FCD34D', text: '#78350F' },
    'rose pink': { fill: '#FBCFE8', secondary: '#F472B6', text: '#831843' },
    pink: { fill: '#FBCFE8', secondary: '#F9A8D4', text: '#831843' },
    'amber gold': { fill: '#FED7AA', secondary: '#FB923C', text: '#7C2D12' },
    'silver capsule': { fill: '#E2E8F0', secondary: '#94A3B8', text: '#1E293B' },
  };

  const key = colorName.toLowerCase().trim();
  const palette = colorMap[key] || colorMap.white;
  const code = (imprint || 'RX').slice(0, 6).toUpperCase();

  return (
    <div
      style={{ width: size, height: size }}
      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-black/10 bg-[#F6F5F1] shadow-inner"
      title={`${colorName} ${shape} pill (Imprint: ${code})`}
    >
      <svg width={size - 6} height={size - 6} viewBox="0 0 44 44" aria-hidden="true">
        {shape === 'capsule' && (
          <>
            <rect
              x="5"
              y="13"
              width="34"
              height="18"
              rx="9"
              fill={palette.fill}
              stroke="#475569"
              strokeWidth="1.6"
            />
            <path
              d="M22 13H30C34.97 13 39 17.03 39 22C39 26.97 34.97 31 30 31H22V13Z"
              fill={palette.secondary}
              stroke="#475569"
              strokeWidth="1.4"
            />
            <text
              x="22"
              y="24.5"
              textAnchor="middle"
              fontSize="7.2"
              fontWeight="800"
              fill={palette.text}
            >
              {code}
            </text>
          </>
        )}
        {shape === 'diamond' && (
          <>
            <polygon
              points="22,5 39,22 22,39 5,22"
              fill={palette.fill}
              stroke="#475569"
              strokeWidth="1.6"
            />
            <text
              x="22"
              y="24.5"
              textAnchor="middle"
              fontSize="7.5"
              fontWeight="800"
              fill={palette.text}
            >
              {code}
            </text>
          </>
        )}
        {shape === 'oval' && (
          <>
            <ellipse
              cx="22"
              cy="22"
              rx="16"
              ry="10.5"
              fill={palette.fill}
              stroke="#475569"
              strokeWidth="1.6"
            />
            <line x1="22" y1="12" x2="22" y2="32" stroke="#94A3B8" strokeWidth="1" />
            <text
              x="22"
              y="24.5"
              textAnchor="middle"
              fontSize="7.2"
              fontWeight="800"
              fill={palette.text}
            >
              {code}
            </text>
          </>
        )}
        {shape === 'round' && (
          <>
            <circle
              cx="22"
              cy="22"
              r="14"
              fill={palette.fill}
              stroke="#475569"
              strokeWidth="1.6"
            />
            <line x1="10" y1="22" x2="34" y2="22" stroke="#CBD5E1" strokeWidth="1" />
            <text
              x="22"
              y="20"
              textAnchor="middle"
              fontSize="7.2"
              fontWeight="800"
              fill={palette.text}
            >
              {code}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

/**
 * Multi-language dictionary & Web Speech API voice helper
 */
export const ELDER_LOCALE_TEXT: Record<
  string,
  {
    langCode: string;
    greeting: string;
    todaysMedsTab: string;
    doctorVisitsTab: string;
    privacyHelpTab: string;
    nextDoseHeadline: string;
    takeNowBtn: string;
    readAloudBtn: string;
    snoozeBtn: string;
    allCaughtUp: string;
    sosBtn: string;
  }
> = {
  English: {
    langCode: 'en-IN',
    greeting: 'Good Morning, Kamala Ji',
    todaysMedsTab: "Today's Medicines",
    doctorVisitsTab: 'My Doctor Visits',
    privacyHelpTab: 'My Privacy & Help',
    nextDoseHeadline: 'Your Next Medicine',
    takeNowBtn: '✓ I Took This Pill',
    readAloudBtn: '🔊 Read Aloud to Me',
    snoozeBtn: '⏰ Remind in 15 Mins',
    allCaughtUp: 'Wonderful! You have completed all your daily medicines today.',
    sosBtn: '🚨 I Need Help / Alert Caretaker & Family',
  },
  Hindi: {
    langCode: 'hi-IN',
    greeting: 'सुप्रभात, कमला जी (Good Morning)',
    todaysMedsTab: 'आज की दवाइयाँ (Today’s Medicines)',
    doctorVisitsTab: 'डॉक्टर अपॉइंटमेंट (Doctor Visits)',
    privacyHelpTab: 'मेरी गोपनीयता और मदद (Privacy & Help)',
    nextDoseHeadline: 'आपकी अगली दवा (Next Medicine)',
    takeNowBtn: '✓ मैंने यह दवा ले ली (I Took This)',
    readAloudBtn: '🔊 बोलकर सुनाएं (Read Aloud)',
    snoozeBtn: '⏰ 15 मिनट बाद याद दिलाएं',
    allCaughtUp: 'बहुत बढ़िया! आज की सभी नियमित दवाइयाँ पूरी हो गईं।',
    sosBtn: '🚨 मुझे तुरंत मदद चाहिए (Alert Family & Nurse)',
  },
  Telugu: {
    langCode: 'te-IN',
    greeting: 'శుభోదయం, కమల గారు (Good Morning)',
    todaysMedsTab: 'నేటి మందులు (Today’s Medicines)',
    doctorVisitsTab: 'డాక్టర్ దర్శనాలు (Doctor Visits)',
    privacyHelpTab: 'గోప్యత & సహాయం (Privacy & Help)',
    nextDoseHeadline: 'మీ తదుపరి మందు (Next Medicine)',
    takeNowBtn: '✓ నేను ఈ మందు వేసుకున్నాను (I Took This)',
    readAloudBtn: '🔊 చదివి వినిపించు (Read Aloud)',
    snoozeBtn: '⏰ 15 నిమిషాల్లో గుర్తు చేయి',
    allCaughtUp: 'చాలా మంచిది! ఈరోజు మందులన్నీ పూర్తయ్యాయి.',
    sosBtn: '🚨 నాకు సహాయం కావాలి (Alert Caretaker & Family)',
  },
  Tamil: {
    langCode: 'ta-IN',
    greeting: 'காலை வணக்கம், கமலா அம்மா (Good Morning)',
    todaysMedsTab: 'இன்றைய மருந்துகள் (Today’s Medicines)',
    doctorVisitsTab: 'மருத்துவர் சந்திப்பு (Doctor Visits)',
    privacyHelpTab: 'தனியுரிமை & உதவி (Privacy & Help)',
    nextDoseHeadline: 'அடுத்த மருந்து (Next Medicine)',
    takeNowBtn: '✓ நான் மாத்திரை போட்டேன் (I Took This)',
    readAloudBtn: '🔊 சத்தமாக வாசி (Read Aloud)',
    snoozeBtn: '⏰ 15 நிமிடத்தில் நினைவூட்டு',
    allCaughtUp: 'மிக சிறப்பு! இன்றைய அனைத்து மருந்துகளும் முடிந்தன.',
    sosBtn: '🚨 எனக்கு உதவி தேவை (Alert Family)',
  },
  Spanish: {
    langCode: 'es-ES',
    greeting: 'Buenos Días, Señora Kamala',
    todaysMedsTab: 'Medicinas de Hoy',
    doctorVisitsTab: 'Visitas al Médico',
    privacyHelpTab: 'Privacidad y Ayuda',
    nextDoseHeadline: 'Su Próxima Medicina',
    takeNowBtn: '✓ Ya Tomé Esta Pastilla',
    readAloudBtn: '🔊 Leer en Voz Alta',
    snoozeBtn: '⏰ Recordar en 15m',
    allCaughtUp: '¡Excelente! Ha completado todas sus medicinas de hoy.',
    sosBtn: '🚨 Necesito Ayuda Ahora',
  },
};

export function speakAloud(text: string, language = 'English', onToast?: (msg: string) => void) {
  const locale = ELDER_LOCALE_TEXT[language]?.langCode || 'en-IN';
  if (onToast) {
    onToast(`🔊 Speaking (${language}): "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"`);
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = locale;
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Safe fallback when headless browser blocks audio
    }
  }
}

/**
 * Crash-Free Schema Normalizer:
 * Guarantees that every array and nested object in CareCircleState is non-null
 */
export function ensureSafeCircleState(raw: Partial<CareCircleState> | null | undefined): CareCircleState {
  return {
    circleId: raw?.circleId || 'circle-kc-2026',
    circleCode: raw?.circleCode || 'KC-2026',
    elderName: raw?.elderName || 'Smt. Kamala Devi',
    elderAge: typeof raw?.elderAge === 'number' ? raw.elderAge : 74,
    bloodGroup: raw?.bloodGroup || 'O+',
    allergies: Array.isArray(raw?.allergies) ? raw.allergies : ['Penicillin', 'Sulfa drugs'],
    conditions: Array.isArray(raw?.conditions)
      ? raw.conditions
      : ['Type 2 Diabetes', 'Essential Hypertension', 'Hypothyroidism'],
    primaryDoctor: raw?.primaryDoctor || 'Dr. Rajesh Sharma, MD (Geriatric Cardiology)',
    emergencyPhone: raw?.emergencyPhone || '+91 98400 11223',
    autonomySettings: {
      escalationGraceMinutes: raw?.autonomySettings?.escalationGraceMinutes || 30,
      allowFamilyScheduleEdits: Boolean(raw?.autonomySettings?.allowFamilyScheduleEdits),
      shareVitalsWithFamily:
        raw?.autonomySettings?.shareVitalsWithFamily !== undefined
          ? Boolean(raw.autonomySettings.shareVitalsWithFamily)
          : true,
      voiceReadoutEnabled:
        raw?.autonomySettings?.voiceReadoutEnabled !== undefined
          ? Boolean(raw.autonomySettings.voiceReadoutEnabled)
          : true,
      seniorComfortMode: Boolean(raw?.autonomySettings?.seniorComfortMode),
      preferredLanguage: raw?.autonomySettings?.preferredLanguage || 'English',
    },
    members: Array.isArray(raw?.members) ? raw.members : [],
    medications: Array.isArray(raw?.medications) ? raw.medications : [],
    doseLogs: Array.isArray(raw?.doseLogs) ? raw.doseLogs : [],
    appointments: Array.isArray(raw?.appointments) ? raw.appointments : [],
    vitals: Array.isArray(raw?.vitals) ? raw.vitals : [],
    emailReminders: Array.isArray(raw?.emailReminders) ? raw.emailReminders : [],
    careNotes: Array.isArray(raw?.careNotes) ? raw.careNotes : [],
    updatedAt: raw?.updatedAt || new Date().toISOString(),
  };
}
