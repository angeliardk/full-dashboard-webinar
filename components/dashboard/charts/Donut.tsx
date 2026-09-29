"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { C, num } from "@/lib/theme";

export function Donut({ data, height = 160 }: { data: { name: string; value: number; color: string }[]; height?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12 }}
          formatter={(v) => {
            const value = Number(v ?? 0);
            return [`${num(value)} (${total ? Math.round((value / total) * 100) : 0}%)`, ""];
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
