"use client";

/**
 * Vodium admin data-visualisation kit.
 *
 * Palette note — these values are NOT eyeballed. They were run through the
 * dataviz validator against the admin's dark card surface (#1F1F1F):
 *
 *   categorical  #c98500,#3987e5,#d55181  → all six checks PASS
 *                (worst adjacent CVD ΔE 15.9, target ≥8)
 *   sequential   #9ec5f4…#184f95          → ordinal checks PASS
 *
 * The Vodium brand gold (#C9A961) deliberately does NOT encode data: on a dark
 * surface it sits above the lightness band and below the chroma floor, so it
 * reads as grey and fails CVD separation. It stays on chrome — headings, rules,
 * borders — while data marks use the validated steps above.
 */

import { useState, type ReactNode } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";
import { Table2, ChartColumn } from "lucide-react";

// ── tokens ────────────────────────────────────────────────────────────────────

export const SERIES = {
  gold:    "#c98500", // categorical slot 1
  blue:    "#3987e5", // categorical slot 2
  magenta: "#d55181", // categorical slot 3
} as const;

/** Reserved: state only, never a series. Always shipped with a text label. */
export const STATUS = {
  good:     "#0ca30c",
  warning:  "#fab219",
  serious:  "#ec835a",
  critical: "#d03b3b",
} as const;

/** Single-hue magnitude ramp, light → dark. */
export const SEQUENTIAL = ["#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"] as const;

const AXIS = "#8A8574";
const GRID = "rgba(255,255,255,0.06)";
const SURFACE = "#1F1F1F";

// ── chrome ────────────────────────────────────────────────────────────────────

export function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-vodium-cream/60">{title}</h2>
      {sub && <p className="text-xs text-vodium-cream/35 mt-0.5">{sub}</p>}
    </div>
  );
}

/**
 * A chart card with a built-in table view — the accessibility fallback, so no
 * chart is ever the only way to read its numbers.
 */
export function ChartCard({
  title, sub, children, table, className = "",
}: {
  title: string;
  sub?: string;
  children: ReactNode;
  table?: { head: string[]; rows: (string | number)[][] };
  className?: string;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-vodium-charcoal p-5 md:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-vodium-cream">{title}</h3>
          {sub && <p className="text-xs text-vodium-cream/35 mt-0.5">{sub}</p>}
        </div>
        {table && (
          <button
            onClick={() => setAsTable((v) => !v)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2 py-1 text-[11px] text-vodium-cream/45 hover:text-vodium-gold hover:border-vodium-gold/30 transition-colors"
            aria-label={asTable ? "Show chart" : "Show data table"}
          >
            {asTable ? <ChartColumn size={11} /> : <Table2 size={11} />} {asTable ? "Chart" : "Table"}
          </button>
        )}
      </div>
      {asTable && table ? <DataTable head={table.head} rows={table.rows} /> : children}
    </div>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs min-w-[320px]">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-2 py-2 font-medium uppercase tracking-wider text-[10px] text-vodium-cream/35 border-b border-white/[0.06] ${i === 0 ? "text-left" : "text-right"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} className={`px-2 py-2 border-b border-white/[0.04] ${ci === 0 ? "text-left text-vodium-cream/75" : "text-right text-vodium-cream/55"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Empty({ label = "No data yet" }: { label?: string }) {
  return <div className="h-40 flex items-center justify-center text-sm text-vodium-cream/20">{label}</div>;
}

/** Stat tile — the right form for a single number; never a one-bar chart. */
export function StatTile({
  label, value, sub, tone = "neutral", hero = false,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "warning" | "critical";
  hero?: boolean;
}) {
  const toneClass =
    tone === "good" ? "text-[#0ca30c]"
    : tone === "warning" ? "text-[#fab219]"
    : tone === "critical" ? "text-[#d03b3b]"
    : "text-vodium-gold";
  return (
    <div className="rounded-xl border border-white/[0.06] bg-vodium-charcoal px-4 py-3.5">
      <p className="text-[11px] text-vodium-cream/40">{label}</p>
      <p className={`font-serif tabular-nums mt-1 ${hero ? "text-3xl" : "text-2xl"} ${toneClass}`}>{value}</p>
      {sub && <p className="text-[11px] text-vodium-cream/30 mt-1">{sub}</p>}
    </div>
  );
}

// ── tooltip ───────────────────────────────────────────────────────────────────

type TipProps = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }>;
  label?: string | number;
  fmt?: (v: number) => string;
};

function VizTooltip({ active, payload, label, fmt }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0A0A0A]/95 px-3 py-2 shadow-xl">
      {label !== undefined && <p className="text-[11px] text-vodium-cream/50 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-vodium-cream flex items-center gap-2 tabular-nums">
          <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-vodium-cream/60">{p.name}</span>
          <span className="ml-auto font-semibold">
            {typeof p.value === "number" && fmt ? fmt(p.value) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

const axisProps = {
  stroke: AXIS,
  tick: { fill: AXIS, fontSize: 10 },
  tickLine: false,
  axisLine: { stroke: GRID },
} as const;

// ── charts ────────────────────────────────────────────────────────────────────

/** Trend over time. Two series = categorical identity (legend + colors). */
export function TrendArea({
  data, series, xKey, fmt, height = 200,
}: {
  data: object[]; // interfaces lack index signatures; recharts takes any[]
  series: { key: string; name: string; color: string }[];
  xKey: string;
  fmt?: (v: number) => string;
  height?: number;
}) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={54} tickFormatter={(v) => compact(Number(v))} />
        <Tooltip content={<VizTooltip fmt={fmt} />} cursor={{ stroke: "rgba(255,255,255,0.18)" }} />
        {series.length > 1 && (
          <Legend iconType="square" wrapperStyle={{ fontSize: 11, color: AXIS, paddingTop: 6 }} />
        )}
        {series.map((s) => (
          <Area
            key={s.key} type="monotone" dataKey={s.key} name={s.name}
            stroke={s.color} strokeWidth={2} fill={`url(#g-${s.key})`} dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: SURFACE }}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** A single rate over time — one series, so no legend box; the title names it. */
export function TrendLine({
  data, dataKey, name, xKey, color = SERIES.blue, height = 200, fmt,
}: {
  data: object[]; // interfaces lack index signatures; recharts takes any[]
  dataKey: string;
  name: string;
  xKey: string;
  color?: string;
  height?: number;
  fmt?: (v: number) => string;
}) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -6, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={52} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip content={<VizTooltip fmt={fmt} />} cursor={{ stroke: "rgba(255,255,255,0.18)" }} />
        <Line
          type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: SURFACE }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Horizontal bars. `colors` lets an ordered scale (repayment lateness, score
 * tiers) carry its own ramp; otherwise every bar is slot 1 — a nominal category
 * never gets a value-ramp.
 */
export function BarsH({
  data, xKey, dataKey, colors, height = 200, fmt,
}: {
  data: object[]; // interfaces lack index signatures; recharts takes any[]
  xKey: string;
  dataKey: string;
  colors?: string[];
  height?: number;
  fmt?: (v: number) => string;
}) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" {...axisProps} tickFormatter={(v) => compact(Number(v))} />
        <YAxis type="category" dataKey={xKey} {...axisProps} width={104} />
        <Tooltip content={<VizTooltip fmt={fmt} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={false}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors?.[i] ?? SERIES.gold} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Day × hour magnitude grid — sequential, one hue. */
export function Heatmap({
  cells, days, hours, fmtLabel,
}: {
  cells: Record<string, number>; // "day-hour" → count
  days: string[];
  hours: number[];
  fmtLabel?: (d: string, h: number, v: number) => string;
}) {
  const values = Object.values(cells);
  const max = Math.max(1, ...values);
  if (!values.some((v) => v > 0)) return <Empty label="No activity recorded yet" />;

  const stepFor = (v: number) => {
    if (v === 0) return "rgba(255,255,255,0.035)";
    const idx = Math.min(SEQUENTIAL.length - 1, Math.floor((v / max) * SEQUENTIAL.length));
    return SEQUENTIAL[idx];
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="flex gap-[2px] mb-1 pl-9">
          {hours.map((h) => (
            <div key={h} className="flex-1 text-center text-[9px] text-vodium-cream/25">
              {h % 3 === 0 ? `${h}` : ""}
            </div>
          ))}
        </div>
        {days.map((d) => (
          <div key={d} className="flex items-center gap-[2px] mb-[2px]">
            <div className="w-9 shrink-0 text-[10px] text-vodium-cream/40">{d}</div>
            {hours.map((h) => {
              const v = cells[`${d}-${h}`] ?? 0;
              return (
                <div
                  key={h}
                  className="flex-1 h-5 rounded-[3px] cursor-default"
                  style={{ backgroundColor: stepFor(v) }}
                  title={fmtLabel ? fmtLabel(d, h, v) : `${d} ${h}:00 — ${v}`}
                />
              );
            })}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-3 text-[10px] text-vodium-cream/35">
          <span>Fewer</span>
          {SEQUENTIAL.map((c) => <span key={c} className="w-4 h-2.5 rounded-[2px]" style={{ backgroundColor: c }} />)}
          <span>More</span>
          <span className="ml-auto">Peak {max} in one hour</span>
        </div>
      </div>
    </div>
  );
}

/** Labelled proportion bars — status or ordinal scales, never colour alone. */
export function BreakdownBars({
  rows, total,
}: {
  rows: { label: string; count: number; color: string; note?: string }[];
  total: number;
}) {
  if (!total) return <Empty />;
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const pct = total > 0 ? (r.count / total) * 100 : 0;
        return (
          <div key={r.label}>
            <div className="flex items-center justify-between mb-1.5 text-xs gap-2">
              <span className="text-vodium-cream/70 flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: r.color }} />
                <span className="truncate">{r.label}</span>
              </span>
              <span className="text-vodium-cream/40 tabular-nums shrink-0">
                {r.count.toLocaleString()} · {pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: r.color }} />
            </div>
            {r.note && <p className="text-[10px] text-vodium-cream/25 mt-1">{r.note}</p>}
          </div>
        );
      })}
    </div>
  );
}

export function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(n));
}
