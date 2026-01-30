'use client';

export default function PrivacyPolicy() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose prose-slate max-w-none space-y-6">
          <p className="text-muted-foreground">Last updated: March 2024</p>
          
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Information We Collect</h2>
            <p>We collect information you provide directly to us, including name, email, phone number, and payment information when you book appointments or make purchases.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, process bookings and payments, send appointment reminders, and communicate with you about our services.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Data Security</h2>
            <p>We implement appropriate security measures to protect your personal information. All payment information is encrypted and processed securely.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at info@mangonailsalon.com</p>
          </section>
        </div>
      </div>
    </>
  );
}
