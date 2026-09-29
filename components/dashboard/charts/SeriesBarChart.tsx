"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { C, colorForIndex } from "@/lib/theme";

export interface SeriesDef {
  key: string;
  label: string;
  color?: string;
}

/**
 * Generic bar chart driven entirely by a `series` list — used for every
 * cross-webinar comparison instead of hardcoded w1/w2 bars. Passing however
 * many webinars just adds bars/legend entries.
 */
export function SeriesBarChart({
  data,
  series,
  height = 220,
  yDomain,
}: {
  data: Record<string, string | number | null>[];
  series: SeriesDef[];
  height?: number;
  /** Fixed Y-axis range, e.g. [0, 5] for a Likert scale, instead of Recharts' auto "nice" max. */
  yDomain?: [number, number];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke={C.line} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
        <YAxis domain={yDomain} tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12 }} cursor={{ fill: "rgba(37,99,235,.05)" }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color ?? colorForIndex(i)} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
