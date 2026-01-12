import { AlertCircle, RefreshCw, Home, WifiOff, HelpCircle } from 'lucide-react';

type ErrorType = 'network' | 'not-found' | 'server' | 'generic';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onStartOver?: () => void;
  showFrontDeskHint?: boolean;
}

const ERROR_CONFIG: Record<ErrorType, { icon: typeof AlertCircle; title: string; message: string }> = {
  network: {
    icon: WifiOff,
    title: 'Connection Lost',
    message: 'Please check your internet connection and try again.',
  },
  'not-found': {
    icon: HelpCircle,
    title: 'Not Found',
    message: "We couldn't find what you're looking for.",
  },
  server: {
    icon: AlertCircle,
    title: 'Something Went Wrong',
    message: 'Our system is having trouble. Please try again in a moment.',
  },
  generic: {
    icon: AlertCircle,
    title: 'Oops!',
    message: 'Something unexpected happened. Please try again.',
  },
};

export function ErrorState({
  type = 'generic',
  title,
  message,
  onRetry,
  onStartOver,
  showFrontDeskHint = false,
}: ErrorStateProps) {
  const config = ERROR_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-24 h-24 bg-[#fef2f2] rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Icon className="w-12 h-12 text-[#ef4444]" />
        </div>

        {/* Title */}
        <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#1f2937] mb-3">
          {title || config.title}
        </h1>

        {/* Message */}
        <p className="font-['Work_Sans'] text-[#6b7280] mb-8">
          {message || config.message}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full py-4 rounded-xl bg-[#1a5f4a] text-white font-['Plus_Jakarta_Sans'] font-semibold shadow-lg shadow-[#1a5f4a]/25 hover:bg-[#154d3c] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </button>
          )}

          {onStartOver && (
            <button
              onClick={onStartOver}
              className="w-full py-4 rounded-xl bg-white border-2 border-[#e5e7eb] text-[#1f2937] font-['Plus_Jakarta_Sans'] font-semibold hover:border-[#1a5f4a] transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Start Over
            </button>
          )}
        </div>

        {/* Front Desk Hint */}
        {showFrontDeskHint && (
          <div className="mt-8 p-4 bg-[#fef3c7] rounded-xl">
            <p className="font-['Work_Sans'] text-sm text-[#92400e]">
              Having trouble? Please see the front desk for assistance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorState;
