import { X, Send, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  cards?: Array<{
    type: string;
    id?: string;
    title?: string;
    description?: string;
    price?: number;
    action?: { label: string; path: string };
    slots?: string[];
  }>;
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Import local chat API
import { handleChatMessage, startChatSession, getChatSuggestions } from '@/lib/api/local/chat';

export const ChatDrawer = ({ isOpen, onClose }: ChatDrawerProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize chat session
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initChat();
    }
  }, [isOpen]);

  const initChat = async () => {
    try {
      const data = await startChatSession();
      setSessionId(data.sessionId);
      setSuggestions(data.suggestions || []);
      setMessages([{ role: "assistant", content: data.greeting }]);
    } catch (error) {
      console.error('Chat init error:', error);
      setMessages([{ 
        role: "assistant", 
        content: "Hi! I'm Mango Assistant 🤍 How can I help you today?" 
      }]);
      setSuggestions(['Book appointment', 'View services', 'Store hours']);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || message;
    if (!messageText.trim()) return;
    
    setMessages(prev => [...prev, { role: "user", content: messageText }]);
    setMessage("");
    setIsLoading(true);
    
    try {
      const data = await handleChatMessage(sessionId, messageText, pathname);
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.message,
        cards: data.cards 
      }]);
      
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm having trouble connecting right now. Please try again in a moment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-96 p-0 flex flex-col"
        onEscapeKeyDown={onClose}
      >
        <SheetHeader className="border-b px-6 py-4 flex flex-row items-center justify-between">
          <SheetTitle className="text-lg font-semibold">
            Chat with Mango Assistant 🤍
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close chat"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-2">
                <div
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
                
                {msg.cards && msg.cards.length > 0 && (
                  <div className="space-y-2">
                    {msg.cards.map((card, cardIdx) => (
                      <Card key={cardIdx} className="max-w-[80%]">
                        <CardContent className="p-4">
                          {card.type === 'service' && (
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold">{card.title}</h4>
                                  <p className="text-sm text-muted-foreground">{card.description}</p>
                                </div>
                                <Badge variant="secondary">${card.price}</Badge>
                              </div>
                              {card.action && (
                                <Button 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => {
                                    router.push(card.action!.path);
                                    onClose();
                                  }}
                                >
                                  {card.action.label}
                                </Button>
                              )}
                            </div>
                          )}
                          
                          {card.type === 'availability' && card.slots && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <Calendar className="h-4 w-4" />
                                Available Times
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {card.slots.map((slot, slotIdx) => (
                                  <Badge key={slotIdx} variant="outline">
                                    {slot}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <span className="animate-bounce delay-0">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t px-6 py-4 space-y-3">
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(suggestion)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              aria-label="Chat message input"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              size="icon"
              disabled={!message.trim() || isLoading}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
