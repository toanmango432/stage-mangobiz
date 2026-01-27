'use client';

import { useEffect, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { faqSchema, injectSchema } from "@/lib/seoSchema";
import { trackEvent } from "@/lib/analytics";

const trackNavClick = (page: string) => trackEvent({ event: 'nav_info_click', page });

const STORE_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store`;

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FAQ() {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQ();
    trackNavClick('FAQ');
  }, []);

  useEffect(() => {
    if (faqItems.length > 0) {
      const cleanup = injectSchema(faqSchema(faqItems));
      return cleanup;
    }
  }, [faqItems]);

  const fetchFAQ = async () => {
    try {
      const response = await fetch(`${STORE_API_URL}/faq`);
      const data = await response.json();
      setFaqItems(data.items);
    } catch (error) {
      console.error('Failed to fetch FAQ:', error);
    } finally {
      setLoading(false);
    }
  };


  const categories = Array.from(new Set(faqItems.map(item => item.category)));
  const filteredItems = selectedCategory 
    ? faqItems.filter(item => item.category === selectedCategory)
    : faqItems;

  const itemsByCategory = categories.reduce((acc, category) => {
    acc[category] = faqItems.filter(item => item.category === category);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  return (
    <>
      <SEOHead 
        title="FAQ — Mango Nail & Beauty Salon"
        description="Find answers to frequently asked questions about our services, booking, policies, and more."
        canonical="/info/faq"
      />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">Frequently Asked Questions</h1>
              <p className="text-xl text-muted-foreground">
                Find answers to common questions
              </p>
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge 
                  variant={selectedCategory === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Badge>
                {categories.map(category => (
                  <Badge 
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : selectedCategory ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredItems.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="space-y-8">
                {categories.map(category => (
                  <div key={category} className="space-y-4">
                    <h2 className="text-2xl font-semibold">{category}</h2>
                    <Accordion type="single" collapsible className="w-full">
                      {itemsByCategory[category].map((item) => (
                        <AccordionItem key={item.id} value={item.id}>
                          <AccordionTrigger className="text-left">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>
    </>
  );
}
