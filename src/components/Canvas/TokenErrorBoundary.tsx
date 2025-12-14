import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  tokenId?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class TokenErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Token rendering error:', error, errorInfo);
    console.error('Token ID:', this.props.tokenId);
  }

  render() {
    if (this.state.hasError) {
      // Return null to hide the broken token instead of showing an error UI
      // This prevents the entire canvas from breaking if one token fails
      return null;
    }

    return this.props.children;
  }
}

export default TokenErrorBoundary;
