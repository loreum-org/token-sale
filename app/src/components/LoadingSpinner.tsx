"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  color = "text-blue-500" 
}: LoadingSpinnerProps) {
  // Size mapping
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const sizeClass = sizeMap[size];

  return (
    <div className={`${sizeClass} ${color} inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`}>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface LoadingOverlayProps {
  text?: string;
}

export function LoadingOverlay({ text = "Loading..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-white text-lg">{text}</p>
    </div>
  );
} 