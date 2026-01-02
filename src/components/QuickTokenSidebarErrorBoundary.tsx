/**
 * QuickTokenSidebarErrorBoundary
 *
 * Error boundary specifically for the QuickTokenSidebar component.
 * Prevents errors in token rendering from crashing the entire sidebar.
 * Shows a minimal, inline error message that fits within the sidebar layout.
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class QuickTokenSidebarErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[QuickTokenSidebarErrorBoundary] Token sidebar crashed:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 bg-red-900/10 border border-red-900/30 rounded text-sm">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-red-400 font-medium mb-1">Quick Access Error</p>
              <p className="text-xs text-red-300/70 mb-2">
                Unable to load token shortcuts. The rest of your sidebar still works.
              </p>
              <button
                onClick={this.handleReset}
                className="text-xs px-2 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default QuickTokenSidebarErrorBoundary;
