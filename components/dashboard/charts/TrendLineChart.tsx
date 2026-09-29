"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { C, colorForIndex } from "@/lib/theme";
import type { SeriesDef } from "./SeriesBarChart";

export function TrendLineChart({
  data,
  series,
  height = 220,
}: {
  data: Record<string, string | number | null>[];
  series: SeriesDef[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} stroke={C.line} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12 }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? colorForIndex(i)}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
