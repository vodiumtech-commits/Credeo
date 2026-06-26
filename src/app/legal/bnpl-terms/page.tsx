import { LegalArticle } from "@/components/ui/legal";

export const metadata = { title: "BNPL Customer Terms · Vodium Ledger" };

export default function BnplTermsPage() {
  return (
    <LegalArticle title="Buy-Now-Pay-Later Customer Terms" updated="26 June 2026">
      <p>
        These terms apply when you buy goods on credit (&ldquo;Buy Now, Pay Later&rdquo; or &ldquo;BNPL&rdquo;) from a store
        that uses Vodium Ledger. The <strong>store is the lender</strong>; Vodium provides the software that records your order
        and repayments. Your acceptance of these terms is recorded against your order.
      </p>

      <h2>1. Your agreement to pay</h2>
      <p>
        When you accept an order, you agree to pay the store the outstanding balance shown on your order by the due date, or
        according to the repayment schedule shown. Any down payment is deducted from the total.
      </p>

      <h2>2. Repayments</h2>
      <ul>
        <li>You may pay in cash or through any payment method the store accepts.</li>
        <li>Each payment is recorded against your order; your receipt link always shows the latest balance.</li>
        <li>Paying on time helps build your repayment history.</li>
      </ul>

      <h2>3. Reminders</h2>
      <p>By accepting, you consent to receive reminders about this order (for example by WhatsApp, SMS or email) until the balance is cleared. Reminders are respectful and relate only to your outstanding balance.</p>

      <h2>4. Late or missed payments</h2>
      <p>
        If you do not pay by the due date, the store may follow its <a href="/legal/refund">dispute and collection process</a>.
        Late or missed payments may be reflected in your repayment history. Any late fees or charges, if applied, are set by
        the store and must comply with applicable law — Vodium does not set or collect them.
      </p>

      <h2>5. Goods and disputes</h2>
      <p>Questions about the goods themselves (quality, returns, exchanges) are between you and the store. See the Refund &amp; Dispute Policy for how disputes are handled.</p>

      <h2>6. Your data</h2>
      <p>Your information is handled as described in our <a href="/legal/privacy">Privacy Policy</a>. The store is responsible for your data as its controller; Vodium processes it on the store&rsquo;s behalf.</p>

      <h2>7. Contact</h2>
      <p>For anything about your order or balance, contact the store directly. For data questions you may also contact Vodium using the email below.</p>
    </LegalArticle>
  );
}
