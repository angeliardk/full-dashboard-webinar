"use client";

import React from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { C } from "@/lib/theme";

export function ScatterPrePost({ pairs, height = 260 }: { pairs: { pre: number; post: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ left: -10, right: 12, top: 8, bottom: 4 }}>
        <CartesianGrid stroke={C.line} />
        <XAxis type="number" dataKey="pre" name="Pre-Test" domain={[0, 100]} tick={{ fontSize: 11, fill: C.slate }} />
        <YAxis type="number" dataKey="post" name="Post-Test" domain={[0, 100]} tick={{ fontSize: 11, fill: C.slate }} />
        <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke={C.slateSoft} strokeDasharray="4 4" />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12 }}
          cursor={{ strokeDasharray: "3 3" }}
          formatter={(v, name) => [String(v), String(name)]}
        />
        <Scatter data={pairs} fill={C.blue} fillOpacity={0.6} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
