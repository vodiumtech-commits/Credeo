import { LegalArticle } from "@/components/ui/legal";

export const metadata = { title: "Payment Authorization Terms · Vodium Ledger" };

export default function PaymentAuthorizationPage() {
  return (
    <LegalArticle title="Payment Authorization Terms" updated="26 June 2026">
      <p>
        These terms apply when you authorise a payment toward a Buy-Now-Pay-Later balance through a licensed payment
        provider (for example Paystack) using a store that runs on Vodium Ledger. Vodium provides the software record;
        the licensed provider moves the money.
      </p>

      <h2>1. What you are authorising</h2>
      <p>By completing a payment authorization, you permit the store, through its licensed payment provider, to collect the amount you owe on a specified order, on the date(s) shown in your repayment schedule.</p>

      <h2>2. Licensed providers handle the money</h2>
      <p>Vodium does not store your card or bank details and does not hold your funds. Card and account credentials are handled by the licensed provider under its own terms and security standards. Vodium stores only a reference to the authorization.</p>

      <h2>3. Amounts and timing</h2>
      <ul>
        <li>Charges will not exceed the outstanding balance shown for the order.</li>
        <li>A charge will be attempted on or after each scheduled due date.</li>
        <li>You will be able to see each payment recorded against your order.</li>
      </ul>

      <h2>4. Failed payments</h2>
      <p>If a scheduled charge fails, the store may retry it within a reasonable window and may contact you. Repeated failures may be treated as a missed payment under the <a href="/legal/bnpl-terms">BNPL Customer Terms</a>.</p>

      <h2>5. Cancelling authorization</h2>
      <p>You may withdraw a recurring authorization by contacting the store or the payment provider. Withdrawing authorization does not cancel what you still owe; it only stops automatic collection, and you remain responsible for paying the balance.</p>

      <h2>6. Disputes</h2>
      <p>If you believe a charge was incorrect, raise it with the store and, where relevant, with the payment provider under its dispute process. See our <a href="/legal/refund">Refund &amp; Dispute Policy</a>.</p>
    </LegalArticle>
  );
}
