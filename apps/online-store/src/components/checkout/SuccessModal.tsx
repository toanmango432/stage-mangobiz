import { motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  autoClose?: number;
  showConfetti?: boolean;
}

export const SuccessModal = ({
  open,
  onClose,
  title,
  description,
  icon,
  actions,
  autoClose,
  showConfetti = true
}: SuccessModalProps) => {
  useEffect(() => {
    if (open && showConfetti) {
      triggerConfetti();
    }
  }, [open, showConfetti]);

  useEffect(() => {
    if (open && autoClose) {
      const timer = setTimeout(onClose, autoClose);
      return () => clearTimeout(timer);
    }
  }, [open, autoClose, onClose]);

  const triggerConfetti = async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      console.error('Confetti failed to load', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="flex flex-col items-center text-center space-y-4 py-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, duration: 0.6 }}
          >
            {icon || <CheckCircle2 className="h-16 w-16 text-primary" />}
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>

          {actions && <div className="w-full pt-4">{actions}</div>}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
