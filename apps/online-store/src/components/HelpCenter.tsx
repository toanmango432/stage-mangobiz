import { useState } from "react";
import { HelpCircle, Search, X, MessageCircle, Book, Phone } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

const faqs = [
  {
    question: "How do I cancel or reschedule my appointment?",
    answer: "You can cancel or reschedule your appointment up to 24 hours before your scheduled time through your account dashboard or by calling us at (555) 123-4567."
  },
  {
    question: "What is your cancellation policy?",
    answer: "Cancellations made less than 24 hours before your appointment may be subject to a cancellation fee. We appreciate advance notice whenever possible."
  },
  {
    question: "Do you accept gift cards?",
    answer: "Yes! We accept both physical and digital gift cards. Gift cards can be purchased on our website and used for any service or product."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express, Discover), debit cards, and gift cards."
  },
  {
    question: "How do I track my order?",
    answer: "After your order ships, you'll receive an email with a tracking number. You can also track your order status in your account dashboard."
  },
];

export const HelpCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-lg z-40"
        size="icon"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Help Center
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="pt-6 text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold text-sm">Live Chat</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Chat with our team
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="pt-6 text-center">
                  <Book className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold text-sm">FAQs</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Common questions
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="pt-6 text-center">
                  <Phone className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold text-sm">Call Us</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    (555) 123-4567
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Frequently Asked Questions</h3>
              {filteredFaqs.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq, idx) => (
                    <AccordionItem key={idx} value={`item-${idx}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No results found. Try a different search term.
                </p>
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Can't find what you're looking for?</p>
              <Button variant="link" className="p-0 h-auto">
                Contact Support
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
