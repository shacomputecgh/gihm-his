import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Icon } from './ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 px-8 py-16 text-center">
          <div className="mb-4 rounded-full bg-red-100 p-3">
            <Icon name="alert" className="h-6 w-6 text-g-red" />
          </div>
          <h2 className="text-lg font-bold text-g-ink">Something went wrong</h2>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            An unexpected error occurred. You can try refreshing the page or contact support.
          </p>
          {this.state.error && (
            <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-white p-3 text-left text-xs text-slate-500 shadow-sm">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-6 flex gap-3">
            <Button onClick={() => window.location.reload()} icon="refresh">
              Refresh page
            </Button>
            <Button variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>
              Try again
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
