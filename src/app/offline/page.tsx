import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline · Vodium Ledger" };

export default function OfflinePage() {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] text-vodium-cream flex items-center justify-center px-6 safe-y">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-vodium-charcoal border border-vodium-gold/30 flex items-center justify-center mx-auto mb-5">
          <WifiOff className="text-vodium-gold" size={26} />
        </div>
        <h1 className="font-serif text-2xl">You&apos;re offline</h1>
        <p className="text-sm text-vodium-cream/50 mt-2">
          Vodium Ledger needs a connection to load. Check your network and try again.
        </p>
        <Link href="/dashboard" className="btn-gold inline-block mt-6 px-5 py-2.5 rounded-lg text-sm font-semibold">
          Retry
        </Link>
      </div>
    </div>
  );
}
