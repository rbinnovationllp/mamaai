import { LegalDocument } from "@/components/LegalDocument";

export default function HelpPage() {
  return (
    <LegalDocument title="Help & Support" updated="23 October 2026">
      <h2>Getting started</h2>
      <p>Create a family profile, add household dietary preferences and allergies, then use the planner to review meal suggestions. Food recommendations are informational and are not medical advice.</p>
      <h2>Subscriptions and billing</h2>
      <p>Subscription availability, billing, cancellation and refunds depend on the plan and payment flow shown in the application. Do not share card, bank, password or one-time-password details with support.</p>
      <h2>Privacy requests</h2>
      <p>For account-data export or deletion requests, use the links in the footer. These requests require identity verification and may be subject to applicable retention obligations.</p>
      <h2>Contact support</h2>
      <p>Contact <a href="mailto:admin@mamaai.in">admin@mamaai.in</a> or <a href="tel:+918450092846">+91 84500 92846</a>. Do not include medical records, passwords, payment credentials or emergency information in a support request.</p>
    </LegalDocument>
  );
}
