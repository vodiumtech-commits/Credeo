import { LegalArticle } from "@/components/ui/legal";

export const metadata = { title: "Refund & Dispute Policy · Vodium Ledger" };

export default function RefundPage() {
  return (
    <LegalArticle title="Refund & Dispute Policy" updated="26 June 2026">
      <p>
        This Policy explains how refunds and disputes are handled for purchases tracked through Vodium Ledger. Because the
        <strong> store is the seller and lender</strong>, refunds for goods are the store&rsquo;s responsibility; Vodium
        records the financial events.
      </p>

      <h2>1. Refunds on goods</h2>
      <p>
        If a store agrees to refund or adjust an order, the change is recorded against the order and reflected in the
        outstanding balance and ledger as a refund or adjustment entry. Refund timing and eligibility are set by the store.
      </p>

      <h2>2. Payment disputes</h2>
      <p>
        If you believe a payment was recorded incorrectly, raise it with the store first. The store can correct the order and
        the ledger. Where a payment was made through a provider (for example Paystack), the provider&rsquo;s chargeback and
        dispute process also applies.
      </p>

      <h2>3. Subscription refunds (vendors)</h2>
      <p>Subscription fees paid by vendors and organizations are generally non-refundable except where required by law or expressly agreed. Trials let you evaluate the Service before paying.</p>

      <h2>4. How to raise a dispute</h2>
      <ul>
        <li>Contact the store with your order number and the issue.</li>
        <li>If unresolved, contact Vodium support with the order number; we can help reconcile the records.</li>
        <li>We aim to acknowledge support requests within 2 business days.</li>
      </ul>

      <h2>5. Collections</h2>
      <p>Recovery of an unpaid balance is carried out by the store under applicable law. Vodium provides reminders and reporting tools but does not act as a debt collector or guarantee recovery.</p>
    </LegalArticle>
  );
}
