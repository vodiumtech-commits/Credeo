"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type DataPoint = { month: string; extended: number; recovered: number };

function formatK(v: number) {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}K`;
  return `₦${v}`;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; fill: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-vodium-charcoal border border-vodium-gold/20 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-vodium-cream/60 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill }} className="font-semibold">
          {p.name === "extended" ? "Extended" : "Recovered"}: {formatK(p.value)}
        </p>
      ))}
    </div>
  );
};

export function RevenueChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barGap={4} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "rgba(250,250,247,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatK} tick={{ fill: "rgba(250,250,247,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(201,169,97,0.06)" }} />
        <Bar dataKey="extended" fill="#C9A961" radius={[4, 4, 0, 0]} name="extended" />
        <Bar dataKey="recovered" fill="#10B981" radius={[4, 4, 0, 0]} name="recovered" fillOpacity={0.8} />
      </BarChart>
    </ResponsiveContainer>
  );
}
