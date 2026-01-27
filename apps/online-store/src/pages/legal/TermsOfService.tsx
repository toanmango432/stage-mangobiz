'use client';

import { SEO } from "@/components/SEO";

export default function TermsOfService() {
  return (
    <>
      <SEO title="Terms of Service" description="Read our terms of service to understand the rules and guidelines for using our services." />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-slate max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: March 2024</p>
          
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Booking & Cancellation Policy</h2>
            <p>Appointments must be cancelled at least 24 hours in advance. Late cancellations or no-shows may be subject to a cancellation fee.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Refund Policy</h2>
            <p>Unopened products may be returned within 30 days with receipt. Services are non-refundable but may be rescheduled.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Membership Terms</h2>
            <p>Memberships are billed monthly and can be cancelled at any time. Benefits are valid for the duration of active membership.</p>
          </section>
        </div>
      </div>
    </>
  );
}
