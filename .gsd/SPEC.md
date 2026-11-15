# SPEC.md — KindredCare AI: Elderly Care & Medication Management Platform

**Status: FINALIZED**  
**Repository**: `https://github.com/Geetesh-Gollapalli/kindredcare-catalyst`  
**Track**: PromptWars x Catalyst — Build with AI

---

## 1. Problem Statement & Vision

Elderly individuals managing multiple daily prescriptions, doctor appointments, and chronic health routines face cognitive overload, complex schedules, small illegible interfaces, and fragmented communication with family members and caretakers.

**KindredCare AI** provides a unified, accessible, passcode-secured ecosystem where:
- **Elderly Individuals** remain at the center of their healthcare decisions through a distraction-free **Elder Sanctuary ("My Day")** interface with Braille Institute `Atkinson Hyperlegible` typography, voice readout/check-in, plain-language pill explanations, and granular autonomy/consent controls.
- **Caretakers & Family Members** collaborate through role-scoped cryptographic passcodes to manage medication schedules, monitor real-time adherence, track pill refill inventory, coordinate medical appointments, and configure proactive email alerts.
- **Proactive Email Reminder Engine** automatically dispatches upcoming dose nudges, missed-medication family escalations, appointment preparation checklists, and low-refill alerts with strict idempotency and an auditable delivery log.
- **Google AI & Multimodal Intelligence** (`@google/genai` Gemini 2.5 Flash + Google `gemma-4-31b-it` via Adaption Labs) powers Prescription Label/Bottle scanning, Drug-Drug & Drug-Food Interaction checks, Plain-Language Medication Guides, and Pre-Appointment Doctor Visit Briefs.

---

## 2. Core Functional Requirements

### FR-1: Secure, Role-Scoped Passcode Access & Care Circle Ecosystem
- Each care profile has a unique **Care Circle Code** (e.g., `KC-2026`) and 3 role-scoped passcodes:
  - **Elder Easy-PIN** (`elder` role): Confirm/snooze/skip doses, voice companion, SOS alert, and autonomy/privacy settings.
  - **Caretaker Passcode** (`caretaker` role): Full CRUD on medications, schedules, appointments, vitals, AI prescription scanner, and email reminder rules.
  - **Family Member Passcode** (`family` role): View adherence timeline, log care notes/vitals, view doctor briefs, and receive escalation alerts.
- Passcodes hashed using cryptographic `scrypt` with unique per-role salt and verified via constant-time `timingSafeEqual`.
- Signed HTTP-only HMAC-SHA256 session tokens + server-side brute-force rate limiting.

### FR-2: Medication Schedule, Adherence & Inventory Management
- Add, edit, and delete medications with dosage, form/color/shape visual cues, time slots (`Morning`, `Afternoon`, `Evening`, `Bedtime` + exact clock times), meal instructions (`Before Meal`, `With Meal`, `After Meal`, `Empty Stomach`), prescribing doctor, and remaining pill stock.
- Interactive dose actions: **Take Now**, **Snooze (15 min)**, **Skip with Reason** (*Felt dizzy*, *Waiting for food*, *Doctor advised hold*, *Out of stock*).
- Real-time adherence calculation (daily %, 7-day trend, streak counter) and automatic pill inventory decrement with low-stock warnings (`<= 5 days remaining`).

### FR-3: Medical Appointments & Daily Healthcare Routines
- Manage upcoming doctor appointments with specialty, clinic location, Google Maps navigation link, Google Calendar 1-click export + `.ics` download, and custom preparation checklists (e.g., *12h fasting*, *Bring lab reports*).
- Daily health routine & vitals log: Blood Pressure, Blood Glucose, Hydration (glasses of water), Mood/Energy check-in, and Shared Care Circle Notes.

### FR-4: Proactive Email Reminder & Escalation System
- Server-side reminder evaluation and SMTP email dispatch (`nodemailer` Gmail SMTP + live previewable test transport) for:
  1. **Upcoming Dose Reminder** (15 mins prior to scheduled dose)
  2. **Missed Medication Escalation** (when unconfirmed past Elder's chosen grace window)
  3. **Medical Appointment Reminder** (24h & 2h prior with prep checklist & Google Maps link)
  4. **Low Medication Refill Alert** (when inventory drops below threshold)
  5. **Elder Priority SOS / Feeling Unwell Signal** (instant family/caretaker notification)
- Strict idempotency keys prevent duplicate emails for the same event.
- Full **Email Delivery Outbox & Audit Log** visible in the Caretaker Dashboard with 1-click live test dispatch.

### FR-5: AI Innovations & Elder Autonomy ("Center of Care")
- **Multimodal Prescription & Pill Bottle Scanner**: Extracts structured medication schedules from uploaded prescription images or clinical text using Google `gemma-4-31b-it` (Adaption Labs) & Google Gemini (`@google/genai`).
- **AI Drug-Interaction & Food-Timing Guard**: Detects drug-drug and drug-food interactions across active medications and recommends optimal spacing.
- **Plain-Language Pill Explainer & Voice Companion**: Generates compassionate, jargon-free medication explanations and speaks them aloud via Web Speech API.
- **Doctor Visit Brief Generator**: Synthesizes adherence stats, skipped dose reasons, and vitals into a printable clinical summary + patient questions.
- **Elder Autonomy Center ("My Care, My Choice")**: Allows the elderly individual to control escalation grace time (15m / 30m / 60m), family edit permissions, and voice reminder preferences.

---

## 3. Non-Functional & Evaluation Criteria Requirements

- **Code Quality**: Next.js App Router + TypeScript (`strict: true`), Zod boundary validation, zero lint/type errors.
- **Security**: Salted `scrypt`, `timingSafeEqual`, HMAC-SHA256 cookies, RBAC middleware, rate limiter, `firestore.rules`.
- **Accessibility**: WCAG 2.1 AAA high-contrast support, `Atkinson Hyperlegible` font, Senior Comfort Mode (scalable font + `56px+` tap targets), ARIA live regions, verified by automated `axe-core` tests.
- **Google Services**: `@google/genai` (Gemini), Adaption Labs (`gemma-4-31b-it`), `firebase` / `firebase-admin` (Cloud Firestore + Security Rules), Google Calendar, Google Maps, Google Fonts.
- **Repository Rules**: Single branch (`main`), public repo, `< 10 MB` total size.
