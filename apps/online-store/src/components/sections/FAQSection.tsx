import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  limit?: number;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const MOCK_FAQS: FAQItem[] = [
  {
    id: "1",
    question: "How do I book an appointment?",
    answer: "You can easily book an appointment through our online booking system by clicking 'Book Now' on any service page. Select your preferred service, date, time, and staff member. You'll receive an instant confirmation via email and SMS.",
    category: "Booking"
  },
  {
    id: "2",
    question: "What is your cancellation policy?",
    answer: "We require at least 24 hours notice for cancellations or rescheduling. Cancellations made with less than 24 hours notice may incur a 50% charge. No-shows will be charged the full service amount.",
    category: "Policies"
  },
  {
    id: "3",
    question: "Do you accept walk-ins?",
    answer: "Yes, we accept walk-ins based on availability. However, we highly recommend booking an appointment in advance to ensure your preferred time and stylist are available.",
    category: "Booking"
  },
  {
    id: "4",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express), debit cards, cash, and digital payment methods like Apple Pay and Google Pay. Gift cards can also be used for payment.",
    category: "Payment"
  },
  {
    id: "5",
    question: "How do membership plans work?",
    answer: "Our membership plans offer discounted rates on services and products. You pay a monthly fee and receive exclusive benefits like priority booking, member-only discounts, and complimentary services. You can upgrade, downgrade, or cancel anytime.",
    category: "Memberships"
  },
  {
    id: "6",
    question: "Do gift cards expire?",
    answer: "Physical gift cards never expire. Digital gift cards are valid for 12 months from the date of purchase. Both can be used for any services or products in our salon.",
    category: "Gift Cards"
  }
];

export function FAQSection({ 
  title = "Frequently Asked Questions",
  subtitle = "Find answers to common questions about our services, bookings, and policies",
  showViewAll = true,
  limit = 4 
}: FAQSectionProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  useEffect(() => {
    // In production, fetch from API
    setFaqs(MOCK_FAQS.slice(0, limit));
  }, [limit]);

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-3">{title}</h2>
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq) => (
            <AccordionItem 
              key={faq.id} 
              value={faq.id}
              className="border rounded-lg px-6 bg-card"
            >
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {showViewAll && (
          <div className="text-center mt-10">
            <Link href="/info/faq">
              <Button variant="outline" size="lg">
                View All FAQs
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
