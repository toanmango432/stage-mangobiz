import { SEO } from "@/components/SEO";

export default function Accessibility() {
  return (
    <>
      <SEO title="Accessibility Statement" description="Our commitment to making our website accessible to everyone." />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Accessibility Statement</h1>
        <div className="prose prose-slate max-w-none space-y-6">
          <p>Mango Nail Salon is committed to ensuring digital accessibility for people with disabilities.</p>
          
          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Our Commitment</h2>
            <p>We strive to meet WCAG 2.1 Level AA standards and continuously improve the accessibility of our website.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
            <p>If you encounter any accessibility barriers, please contact us at info@mangonailsalon.com</p>
          </section>
        </div>
      </div>
    </>
  );
}
