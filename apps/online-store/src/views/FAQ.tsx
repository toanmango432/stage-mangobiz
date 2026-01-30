'use client';

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ThumbsUp, ThumbsDown } from "lucide-react";

import { toast } from "sonner";

const faqCategories = {
  "Appointments & Bookings": [
    {
      question: "How do I book an appointment?",
      answer: "You can book an appointment online through our website by visiting the 'Book' page, selecting your desired service, choosing a time slot, and completing the booking form. You can also call us at (555) 123-4567."
    },
    {
      question: "Can I cancel or reschedule my appointment?",
      answer: "Yes, you can cancel or reschedule up to 24 hours before your appointment time through your account dashboard or by contacting us. Cancellations made less than 24 hours in advance may be subject to a fee."
    },
    {
      question: "What if I'm running late?",
      answer: "Please call us as soon as possible if you're running late. We'll do our best to accommodate you, but if you're more than 15 minutes late, we may need to reschedule your appointment."
    },
  ],
  "Services": [
    {
      question: "What services do you offer?",
      answer: "We offer a full range of nail services including manicures, pedicures, gel polish, nail art, acrylic nails, and spa treatments. Visit our Services page for a complete list and pricing."
    },
    {
      question: "How long does each service take?",
      answer: "Service times vary: Classic Manicure (30-45 min), Gel Manicure (45-60 min), Spa Pedicure (60-75 min), Acrylic Full Set (90-120 min). Check individual service descriptions for specific durations."
    },
    {
      question: "Do you offer group bookings or parties?",
      answer: "Yes! We offer group bookings for parties, bridal events, and special occasions. Contact us to discuss your needs and we'll create a customized package for your group."
    },
  ],
  "Products & Shop": [
    {
      question: "Can I purchase products without an appointment?",
      answer: "Yes! You can shop our products online anytime or visit our salon during business hours. We carry professional nail care products, polishes, and accessories."
    },
    {
      question: "Do you offer product recommendations?",
      answer: "Absolutely! Our staff can recommend products based on your nail type and needs. We also provide product recommendations during your service appointments."
    },
    {
      question: "What is your return policy?",
      answer: "Unopened products can be returned within 30 days with receipt for a full refund. Opened products cannot be returned due to health and safety regulations."
    },
  ],
  "Memberships & Gift Cards": [
    {
      question: "What are the membership benefits?",
      answer: "Our memberships offer discounts on services (10-25% off), priority booking, exclusive access to special events, birthday treats, and member-only product offers. View our Memberships page for detailed tier information."
    },
    {
      question: "Can I upgrade my membership?",
      answer: "Yes! You can upgrade your membership at any time. The price difference will be pro-rated based on your current membership period."
    },
    {
      question: "How do gift cards work?",
      answer: "Gift cards can be purchased online or in-salon for any amount. They never expire and can be used for any service or product. Digital gift cards are delivered via email instantly."
    },
  ],
  "Payment & Policies": [
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover), debit cards, cash, and our gift cards. We also accept contactless payments."
    },
    {
      question: "Do you require a deposit?",
      answer: "A deposit may be required for certain services (like full sets) or for appointments during peak times. You'll be notified during the booking process if a deposit is needed."
    },
    {
      question: "What is your tipping policy?",
      answer: "Gratuity is not included in service prices but is greatly appreciated. You can add a tip when paying with a card or leave cash for your technician."
    },
  ],
};

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});

  const handleVote = (questionId: string, helpful: boolean) => {
    setHelpfulVotes(prev => ({ ...prev, [questionId]: helpful }));
    toast.success(helpful ? "Thanks for your feedback!" : "We'll work on improving this answer");
  };

  const filteredCategories = Object.entries(faqCategories).reduce((acc, [category, questions]) => {
    const filtered = questions.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as typeof faqCategories);

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Find answers to common questions about our services and policies
            </p>
            
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </div>

          {Object.keys(filteredCategories).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(filteredCategories).map(([category, questions]) => (
                <div key={category}>
                  <h2 className="text-2xl font-bold mb-4">{category}</h2>
                  <Accordion type="single" collapsible className="space-y-2">
                    {questions.map((faq, idx) => {
                      const questionId = `${category}-${idx}`;
                      return (
                        <Card key={idx}>
                          <AccordionItem value={questionId} className="border-none">
                            <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                              <span className="font-semibold">{faq.question}</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-4">
                              <p className="text-muted-foreground mb-4">{faq.answer}</p>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Was this helpful?</span>
                                <Button
                                  variant={helpfulVotes[questionId] === true ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleVote(questionId, true)}
                                >
                                  <ThumbsUp className="h-4 w-4 mr-1" />
                                  Yes
                                </Button>
                                <Button
                                  variant={helpfulVotes[questionId] === false ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleVote(questionId, false)}
                                >
                                  <ThumbsDown className="h-4 w-4 mr-1" />
                                  No
                                </Button>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Card>
                      );
                    })}
                  </Accordion>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No results found for "{searchQuery}"
                </p>
                <Button onClick={() => setSearchQuery("")} variant="outline">
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="mt-12 bg-primary/5 border-primary/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-4">
                We're here to help! Contact our team for personalized assistance.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button>Contact Support</Button>
                <Button variant="outline">Call (555) 123-4567</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
