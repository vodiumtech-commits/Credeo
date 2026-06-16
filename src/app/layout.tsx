import type { Metadata } from "next";
// import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = { variable: "font-inter" };
const playfair = { variable: "font-playfair" };

/*
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});
*/

export const metadata: Metadata = {
  title: "Vodium Ledger — Africa's credit infrastructure layer",
  description:
    "WhatsApp-first credit tracking and intelligence for African vendors. Track who owes you, recover faster, score smarter.",
  metadataBase: new URL("https://vodiumledger.com"),
  openGraph: {
    title: "Vodium Ledger",
    description: "The credit infrastructure of African vendor commerce.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-vodium-cream text-vodium-black">
        {children}
      </body>
    </html>
  );
}
