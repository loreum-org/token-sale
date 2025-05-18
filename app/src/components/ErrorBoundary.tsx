"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 rounded-lg bg-gray-900 border border-red-800 shadow-lg text-white">
          <h2 className="text-xl font-bold text-red-400 mb-4">Something went wrong</h2>
          <p className="text-gray-300 mb-4">
            {this.state.error?.message || "An unknown error occurred"}
          </p>
          <pre className="bg-gray-800 p-4 rounded-md overflow-auto text-sm text-gray-300 mb-6">
            {this.state.error?.stack?.split("\n").slice(0, 3).join("\n")}
          </pre>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="p-4 rounded-lg bg-red-900/20 border border-red-800 text-red-400 mb-4">
      <p className="mb-2">{message}</p>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          className="mt-2 bg-red-800 hover:bg-red-700 text-white text-xs"
          size="sm"
        >
          Try Again
        </Button>
      )}
    </div>
  );
} 