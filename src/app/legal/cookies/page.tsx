import { LegalArticle } from "@/components/ui/legal";

export const metadata = { title: "Cookie Policy · Vodium Ledger" };

export default function CookiePolicyPage() {
  return (
    <LegalArticle title="Cookie Policy" updated="26 June 2026">
      <p>This Policy explains the cookies and similar technologies Vodium Ledger uses. We keep them to the minimum needed to run the Service securely.</p>

      <h2>1. Strictly necessary cookies</h2>
      <ul>
        <li><strong>Session cookies</strong> keep you signed in (vendor and admin sessions are signed, httpOnly cookies).</li>
        <li><strong>One-time-code cookies</strong> hold a short-lived, signed login code during email OTP sign-in.</li>
        <li>These are essential; the Service cannot function without them.</li>
      </ul>

      <h2>2. What we do not do</h2>
      <p>We do not use cookies to sell your data or to build advertising profiles. Any analytics, if enabled, are used in aggregate to improve reliability and product quality.</p>

      <h2>3. Managing cookies</h2>
      <p>You can clear or block cookies in your browser settings, but blocking strictly necessary cookies will prevent you from signing in and using the Service.</p>

      <h2>4. Changes</h2>
      <p>We may update this Policy as the Service evolves. Material changes will be notified in-app or by email.</p>
    </LegalArticle>
  );
}
