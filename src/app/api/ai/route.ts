import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/api-auth';
import { getCareCircleState } from '@/services/store';
import {
  analyzeDrugInteractionsWithAI,
  explainMedicationForElderWithAI,
  generateDoctorVisitBriefWithAI,
  scanPrescriptionWithAI,
} from '@/services/ai-engine';

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json(
      { error: 'Passcode authentication required.' },
      { status: 401 }
    );
  }

  const body = (await req.json()) as {
    action?: 'drug_safety' | 'scan_prescription' | 'doctor_brief' | 'explain_pill';
    prescriptionText?: string;
    imageBase64DataUrl?: string;
    medicationId?: string;
    language?: string;
  };

  const circle = getCareCircleState();

  switch (body.action) {
    case 'drug_safety': {
      const report = await analyzeDrugInteractionsWithAI(
        circle.medications,
        circle.allergies
      );
      return NextResponse.json({ report });
    }

    case 'scan_prescription': {
      const scanned = await scanPrescriptionWithAI({
        prescriptionText: body.prescriptionText,
        imageBase64DataUrl: body.imageBase64DataUrl,
      });
      return NextResponse.json({ scanned });
    }

    case 'doctor_brief': {
      const brief = await generateDoctorVisitBriefWithAI(circle);
      return NextResponse.json({ brief });
    }

    case 'explain_pill': {
      const med =
        circle.medications.find((m) => m.id === body.medicationId) ||
        circle.medications[0];
      if (!med) {
        return NextResponse.json(
          { error: 'Medication not found.' },
          { status: 404 }
        );
      }
      const result = await explainMedicationForElderWithAI({
        medication: med,
        language: body.language || circle.autonomySettings.preferredLanguage,
        elderName: circle.elderName,
      });
      return NextResponse.json(result);
    }

    default:
      return NextResponse.json(
        { error: 'Unsupported AI action.' },
        { status: 400 }
      );
  }
}
