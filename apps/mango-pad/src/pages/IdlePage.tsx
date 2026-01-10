/**
 * IdlePage - Idle/Standby Screen with Digital Signage
 * US-002: Displays promotional content, salon logo, date/time while waiting for transactions
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import type { PromoSlide } from '@/types';

const DEFAULT_SLIDE: PromoSlide = {
  id: 'default',
  type: 'announcement',
  title: 'Welcome',
  subtitle: 'Your visit is our priority',
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function ConnectionStatusIndicator() {
  const connectionStatus = useAppSelector((state) => state.pad.mqttConnectionStatus);

  const statusConfig = {
    connected: {
      icon: Wifi,
      color: 'bg-green-500',
      text: 'Connected',
    },
    disconnected: {
      icon: WifiOff,
      color: 'bg-red-500',
      text: 'Disconnected',
    },
    reconnecting: {
      icon: RefreshCw,
      color: 'bg-yellow-500',
      text: 'Reconnecting...',
    },
  };

  const config = statusConfig[connectionStatus];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute bottom-6 right-6 flex items-center gap-2 px-3 py-2 bg-black/20 backdrop-blur-sm rounded-full"
    >
      <div className={`w-2 h-2 rounded-full ${config.color}`} />
      <Icon
        className={`w-4 h-4 text-white/80 ${connectionStatus === 'reconnecting' ? 'animate-spin' : ''}`}
      />
      <span className="text-sm text-white/80">{config.text}</span>
    </motion.div>
  );
}

interface PromoSlideDisplayProps {
  slide: PromoSlide;
}

function PromoSlideDisplay({ slide }: PromoSlideDisplayProps) {
  const renderSlideContent = () => {
    switch (slide.type) {
      case 'promotion':
        return (
          <div className="text-center">
            {slide.imageUrl && (
              <img
                src={slide.imageUrl}
                alt={slide.title || 'Promotion'}
                className="w-64 h-64 object-cover rounded-2xl mx-auto mb-6 shadow-xl"
              />
            )}
            <h2 className="text-4xl font-bold text-white mb-3">{slide.title}</h2>
            <p className="text-xl text-white/80">{slide.subtitle}</p>
          </div>
        );
      case 'staff-spotlight':
        return (
          <div className="text-center">
            {slide.imageUrl && (
              <img
                src={slide.imageUrl}
                alt={slide.title || 'Staff'}
                className="w-48 h-48 object-cover rounded-full mx-auto mb-6 shadow-xl border-4 border-white/30"
              />
            )}
            <p className="text-lg text-white/60 mb-2">Staff Spotlight</p>
            <h2 className="text-3xl font-bold text-white mb-2">{slide.title}</h2>
            <p className="text-xl text-white/80">{slide.subtitle}</p>
          </div>
        );
      case 'testimonial':
        return (
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-6xl text-white/40 mb-4">"</div>
            <p className="text-2xl text-white italic mb-6">{slide.subtitle}</p>
            <p className="text-lg text-white/80">— {slide.title}</p>
          </div>
        );
      case 'social-qr':
        return (
          <div className="text-center">
            {slide.imageUrl && (
              <img
                src={slide.imageUrl}
                alt="QR Code"
                className="w-48 h-48 mx-auto mb-6 rounded-xl bg-white p-4"
              />
            )}
            <h2 className="text-3xl font-bold text-white mb-2">{slide.title}</h2>
            <p className="text-xl text-white/80">{slide.subtitle}</p>
          </div>
        );
      case 'announcement':
      default:
        return (
          <div className="text-center">
            <h2 className="text-5xl font-bold text-white mb-4">{slide.title}</h2>
            <p className="text-2xl text-white/80">{slide.subtitle}</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="flex items-center justify-center min-h-[300px]"
      style={slide.backgroundColor ? { backgroundColor: slide.backgroundColor } : undefined}
    >
      {renderSlideContent()}
    </motion.div>
  );
}

export function IdlePage() {
  const config = useAppSelector((state) => state.config.config);
  const { logoUrl, promoSlides, slideDuration, brandColors } = config;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const slides = promoSlides.length > 0 ? promoSlides : [DEFAULT_SLIDE];
  const currentSlide = slides[currentSlideIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const advanceSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(advanceSlide, slideDuration * 1000);
    return () => clearInterval(timer);
  }, [slides.length, slideDuration, advanceSlide]);

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background: `linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%)`,
      }}
    >
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
            `radial-gradient(circle at 80% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
            `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
            `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Header: Logo and Date/Time */}
      <header className="relative z-10 p-6 flex justify-between items-start">
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Salon Logo"
              className="h-16 w-auto object-contain rounded-lg"
            />
          ) : (
            <div className="h-16 w-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl font-bold text-white">M</span>
            </div>
          )}
        </div>

        <div className="text-right text-white">
          <p className="text-3xl font-light">{formatTime(currentTime)}</p>
          <p className="text-lg text-white/70">{formatDate(currentTime)}</p>
        </div>
      </header>

      {/* Main Content: Promo Carousel */}
      <main className="flex-1 relative z-10 flex items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <PromoSlideDisplay key={currentSlide.id} slide={currentSlide} />
        </AnimatePresence>
      </main>

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="relative z-10 flex justify-center gap-2 pb-6">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlideIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 min-w-[48px] min-h-[48px] flex items-center justify-center`}
              aria-label={`Go to slide ${index + 1}`}
            >
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlideIndex
                    ? 'bg-white scale-125'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Connection Status Indicator */}
      <ConnectionStatusIndicator />
    </div>
  );
}
