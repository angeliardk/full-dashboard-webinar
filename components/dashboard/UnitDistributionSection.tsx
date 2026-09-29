"use client";

import React from "react";
import { Building2 } from "lucide-react";
import { Card, SectionTitle, StatChip } from "./ui/primitives";
import { UnitBarList } from "./charts/UnitBarList";
import { C, num } from "@/lib/theme";
import type { UnitDistributionRow } from "@/types/analytics";
import { UNIDENTIFIED_UNIT } from "@/lib/analytics/helpers";

export function UnitDistributionSection({
  units,
  companyGroups,
}: {
  units: UnitDistributionRow[];
  companyGroups: UnitDistributionRow[];
}) {
  const total = units.reduce((s, u) => s + u.count, 0);
  const topUnit = units[0];
  const unidentified = units.find((u) => u.unit === UNIDENTIFIED_UNIT)?.count ?? 0;
  const unidentifiedPct = total ? Math.round((unidentified / total) * 1000) / 10 : 0;
  const topCompanyGroup = companyGroups[0];

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionTitle icon={Building2} hint={`${companyGroups.length} kelompok · PLN Pusat & anak perusahaan · basis peserta hadir Zoom valid`}>
          Distribusi per Perusahaan / Anak Perusahaan PLN
        </SectionTitle>
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatChip label="Terbanyak" value={topCompanyGroup ? topCompanyGroup.count : 0} color={C.blue} sub={topCompanyGroup?.unit ?? "-"} />
          <StatChip label="Total Kelompok" value={companyGroups.length} color={C.violet} />
        </div>
        <UnitBarList rows={companyGroups} maxHeight={280} />
      </Card>

      <Card className="p-5">
        <SectionTitle icon={Building2} hint={`${units.length} unit detail · basis peserta hadir Zoom valid`}>
          Distribusi Unit Kerja (Detail)
        </SectionTitle>
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatChip label="Unit Terbanyak" value={topUnit ? topUnit.count : 0} color={C.blue} sub={topUnit?.unit ?? "-"} />
          <StatChip label="Total Unit Berbeda" value={units.length} color={C.violet} />
          <StatChip label="Tidak Teridentifikasi" value={`${unidentifiedPct}%`} color={C.red} sub={`${num(unidentified)} peserta`} />
        </div>
        <UnitBarList rows={units} />
      </Card>
    </div>
  );
}
