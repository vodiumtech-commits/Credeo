"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  // Sentry capture removed to test if it's causing the prerender error
  useEffect(() => {
    console.error("Global error captured:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex items-center justify-center min-h-screen bg-vodium-cream text-vodium-black p-4">
        <div className="text-center">
          <h1 className="text-2xl font-serif mb-2">Something went wrong</h1>
          <p className="text-sm text-vodium-black/50">
            We&apos;ve been notified and are looking into it.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 btn-gold px-6 py-2 rounded-lg text-sm"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
