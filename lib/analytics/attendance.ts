import type { Participant } from "@/types/webinar";
import type { AttendanceMetrics } from "@/types/analytics";
import { activeParticipants, isUnidentifiedUnit } from "./helpers";

/** Looser "showed up at all" bar — separate from the webinar's stricter attendanceThresholdMinutes. */
const PRESENT_THRESHOLD_MINUTES = 5;

function isZoomPresent(p: Participant): boolean {
  if (!p.attendance.inZoomCsv) return false;
  const dur = p.attendance.zoomDurationMinutes;
  return dur == null || dur >= PRESENT_THRESHOLD_MINUTES;
}

export function calculateAttendanceMetrics(participants: Participant[]): AttendanceMetrics {
  const active = activeParticipants(participants);

  let registeredCount = 0;
  let zoomPresentCount = 0;
  let zoomValidAttendeeCount = 0;
  let registeredAndAttendedCount = 0;
  let attendedWithoutRegistrationCount = 0;
  let registeredNotAttendedCount = 0;
  let unidentifiedUnitCount = 0;
  let belowThresholdZoomCount = 0;

  for (const p of active) {
    const registered = p.attendance.registeredEcadin;
    const validAttendee = p.attendance.zoomValidAttendee;
    const present = isZoomPresent(p);

    if (registered) registeredCount++;
    if (present) zoomPresentCount++;
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
    zoomPresentCount,
    zoomValidAttendeeCount,
    registeredAndAttendedCount,
    attendedWithoutRegistrationCount,
    registeredNotAttendedCount,
    unidentifiedUnitCount,
    belowThresholdZoomCount,
  };
}
