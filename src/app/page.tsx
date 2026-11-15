import React from 'react';
import { getCareCircleState } from '@/services/store';
import { calculateAdherenceMetrics } from '@/lib/adherence';
import { getAuthenticatedSession } from '@/lib/api-auth';
import { KindredCareApp } from '@/components/KindredCareApp';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getAuthenticatedSession();
  const circle = getCareCircleState();
  const metrics = calculateAdherenceMetrics(
    circle.medications,
    circle.doseLogs,
    new Date(),
    circle.autonomySettings.escalationGraceMinutes
  );

  return (
    <KindredCareApp
      initialCircle={circle}
      initialMetrics={metrics}
      initialRole={session?.role || 'elder'}
      initialMemberName={session?.memberName || 'Smt. Kamala Devi'}
    />
  );
}
