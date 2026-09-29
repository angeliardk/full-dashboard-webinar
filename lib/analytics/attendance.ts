import type { Participant } from "@/types/webinar";
import type { AttendanceMetrics } from "@/types/analytics";
import { activeParticipants, isUnidentifiedUnit } from "./helpers";

export function calculateAttendanceMetrics(participants: Participant[]): AttendanceMetrics {
  const active = activeParticipants(participants);

  let registeredCount = 0;
  let zoomValidAttendeeCount = 0;
  let registeredAndAttendedCount = 0;
  let attendedWithoutRegistrationCount = 0;
  let registeredNotAttendedCount = 0;
  let unidentifiedUnitCount = 0;
  let belowThresholdZoomCount = 0;

  for (const p of active) {
    const registered = p.attendance.registeredEcadin;
    const validAttendee = p.attendance.zoomValidAttendee;

    if (registered) registeredCount++;
    if (validAttendee) zoomValidAttendeeCount++;
    if (registered && validAttendee) registeredAndAttendedCount++;
    if (validAttendee && !registered) attendedWithoutRegistrationCount++;
    if (registered && !validAttendee) registeredNotAttendedCount++;
    if (validAttendee && isUnidentifiedUnit(p.unitFinal)) unidentifiedUnitCount++;
    if (p.attendance.inZoomCsv && !validAttendee) belowThresholdZoomCount++;
  }

  return {
    databaseParticipantCount: active.length,
    registeredCount,
    zoomValidAttendeeCount,
    registeredAndAttendedCount,
    attendedWithoutRegistrationCount,
    registeredNotAttendedCount,
    unidentifiedUnitCount,
    belowThresholdZoomCount,
  };
}
