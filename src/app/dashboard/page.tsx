import Link from "next/link";
import { formatNaira } from "@/lib/utils";

// Server Component — replace stub data with real Prisma queries once auth is wired.
async function getDashboardData() {
  // TODO: pull current vendor from session, then:
  //   const credits = await prisma.credit.findMany({ where: { vendorId } })
  return {
    vendor: { businessName: "Mama T's Provisions", university: "UNILAG" },
    totalOwed: 87500,
    customersOwing: 12,
    overdueCount: 3,
    dueSoon: [
      { id: "1", studentName: "John Okafor", amount: 2500, dueDate: "Tomorrow" },
      { id: "2", studentName: "Aisha Bello", amount: 1500, dueDate: "Friday" },
    ],
    recentActivity: [
      { id: "a", type: "credit", text: "Added ₦3,000 credit for Tobi Adeyemi", at: "2h ago" },
      { id: "b", type: "paid", text: "Funmi paid ₦5,000", at: "Yesterday" },
    ],
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <main className="min-h-screen bg-vodium-cream">
      {/* Top bar */}
      <header className="bg-vodium-black text-vodium-cream px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-vodium-gold flex items-center justify-center">
            <span className="font-serif text-vodium-gold">V</span>
          </div>
          <div>
            <p className="font-serif text-sm tracking-[0.2em] text-vodium-gold">VODIUM LEDGER</p>
          </div>
        </div>
        <button className="text-sm text-vodium-cream/70 hover:text-vodium-gold">Sign out</button>
      </header>

      {/* Vendor strip */}
      <div className="px-6 py-6 border-b border-border">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          Welcome back
        </p>
        <h1 className="font-serif text-2xl">{data.vendor.businessName}</h1>
        <p className="text-sm text-muted-foreground">{data.vendor.university}</p>
      </div>

      {/* KPIs */}
      <section className="px-6 py-8 grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPI label="Total owed to you" value={formatNaira(data.totalOwed)} accent />
        <KPI label="Customers with credit" value={String(data.customersOwing)} />
        <KPI label="Overdue" value={String(data.overdueCount)} danger />
      </section>

      {/* Quick action */}
      <section className="px-6 mb-8">
        <Link
          href="/dashboard/credit/new"
          className="btn-gold w-full py-4 rounded-md inline-flex items-center justify-center font-medium"
        >
          + Add a credit
        </Link>
      </section>

      {/* Due soon */}
      <section className="px-6 mb-8">
        <h2 className="font-serif text-xl mb-4">Due soon</h2>
        <div className="space-y-2">
          {data.dueSoon.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-border rounded-md px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{c.studentName}</p>
                <p className="text-xs text-muted-foreground">Due {c.dueDate}</p>
              </div>
              <p className="font-medium text-warning">{formatNaira(c.amount)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Activity */}
      <section className="px-6 mb-12">
        <h2 className="font-serif text-xl mb-4">Recent activity</h2>
        <div className="space-y-1 text-sm">
          {data.recentActivity.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <span className="text-vodium-black">{a.text}</span>
              <span className="text-muted-foreground text-xs">{a.at}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function KPI({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-4 border ${
        accent
          ? "bg-vodium-black text-vodium-cream border-vodium-gold"
          : "bg-white border-border"
      }`}
    >
      <p className={`text-xs uppercase tracking-widest mb-2 ${accent ? "text-vodium-gold" : "text-muted-foreground"}`}>
        {label}
      </p>
      <p
        className={`font-serif text-2xl ${
          danger ? "text-danger" : accent ? "text-vodium-cream" : "text-vodium-black"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
