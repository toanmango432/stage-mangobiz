interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse bg-gradient-to-r from-[#f3f4f6] via-[#e5e7eb] to-[#f3f4f6]
        bg-[length:200%_100%] rounded-lg
        ${className}
      `}
      style={{
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] p-5 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function TechnicianCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border-2 border-[#e5e7eb] p-5">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-14 h-14 rounded-full" />
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
      <Skeleton className="h-5 w-24 mb-2" />
      <Skeleton className="h-4 w-32 mb-3" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#1a5f4a]/20 border-t-[#1a5f4a] rounded-full animate-spin mx-auto mb-6" />
        <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#1f2937] mb-2">
          Loading...
        </h2>
        <p className="font-['Work_Sans'] text-[#6b7280]">
          Please wait a moment
        </p>
      </div>
    </div>
  );
}

// Add shimmer animation to index.css or use this inline style
export const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;
