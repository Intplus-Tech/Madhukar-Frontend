"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { PlanVsAchievedPoint } from "@/types/domain";

/** Grey "Plan" bar beside a green "Actual" bar, per the admin dashboard frame. */
export function PlanVsAchievedChart({ data }: { data: PlanVsAchievedPoint[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 28, right: 8, bottom: 8, left: 8 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="#F1F3F5" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            interval="preserveStartEnd"
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(17,24,39,0.04)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              fontSize: 12,
              boxShadow: "0 4px 12px -2px rgba(16,24,40,0.08)",
            }}
            formatter={(value: number, name) => [formatCurrency(value), name]}
          />
          <Bar dataKey="plan" name="Plan" fill="#D1D5DB" radius={[2, 2, 0, 0]} maxBarSize={30}>
            <LabelList
              dataKey="plan"
              position="top"
              className="hidden sm:block"
              formatter={(v: number) => formatCurrency(v)}
              style={{ fontSize: 9, fill: "#6B7280" }}
            />
          </Bar>
          <Bar dataKey="actual" name="Actual" fill="#00A76F" radius={[2, 2, 0, 0]} maxBarSize={30}>
            <LabelList
              dataKey="actual"
              position="top"
              className="hidden sm:block"
              formatter={(v: number) => formatCurrency(v)}
              style={{ fontSize: 9, fill: "#6B7280" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
