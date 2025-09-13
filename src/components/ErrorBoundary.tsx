import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorBoundaryFallback } from './ErrorBoundaryFallback';

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
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Se um fallback personalizado foi fornecido, use-o; caso contrário, use o fallback padrão
      return this.props.fallback || <ErrorBoundaryFallback />;
    }

    return this.props.children;
  }
}
