'use client';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
}

export function LoadingSkeleton({
  className = '',
  variant = 'rect',
  width,
  height,
}: LoadingSkeletonProps) {
  const baseStyles = 'animate-pulse bg-gray-700';
  
  const variants = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'circle' ? '40px' : '100%'),
    height: height || (variant === 'text' ? '16px' : variant === 'circle' ? '40px' : '100px'),
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={style}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
      <LoadingSkeleton variant="text" width="60%" className="mb-4" />
      <LoadingSkeleton variant="text" className="mb-2" />
      <LoadingSkeleton variant="text" width="80%" className="mb-4" />
      <div className="flex gap-2">
        <LoadingSkeleton variant="rect" width={80} height={32} />
        <LoadingSkeleton variant="rect" width={80} height={32} />
      </div>
    </div>
  );
}

export function WorkoutCardSkeleton() {
  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <LoadingSkeleton variant="text" width={150} height={20} />
        <LoadingSkeleton variant="text" width={80} height={16} />
      </div>
      <LoadingSkeleton variant="text" width="90%" className="mb-2" />
      <LoadingSkeleton variant="text" width="70%" />
    </div>
  );
}
