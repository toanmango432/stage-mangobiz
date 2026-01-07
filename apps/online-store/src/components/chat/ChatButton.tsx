import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatButtonProps {
  onClick: () => void;
}

export const ChatButton = ({ onClick }: ChatButtonProps) => {
  return (
    <Button
      onClick={onClick}
      size="icon"
      aria-label="Chat with Mango Assistant"
      className="fixed bottom-20 md:bottom-6 right-6 h-14 w-14 rounded-full shadow-elevated hover:shadow-lg transition-all duration-300 hover:scale-110 z-40 bg-primary hover:bg-primary/90 print:hidden"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
};
