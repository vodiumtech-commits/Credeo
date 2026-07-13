"use client";

import { Download } from "lucide-react";

/**
 * Opens the browser's print dialog, where the customer chooses "Save as PDF".
 * The page carries a print stylesheet that renders the invoice as a clean,
 * ink-friendly A4 document — no PDF library needed.
 */
export function InvoiceDownloadButton({ brand }: { brand: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print w-full mt-4 py-2.5 rounded-xl text-sm font-bold text-vodium-black inline-flex items-center justify-center gap-2"
      style={{ backgroundColor: brand }}
    >
      <Download size={15} /> Download PDF
    </button>
  );
}
