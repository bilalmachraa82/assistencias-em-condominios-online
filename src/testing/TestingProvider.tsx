import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TestDataManager } from './TestDataManager';

interface TestingContextType {
  testManager: TestDataManager;
  isTestMode: boolean;
  setTestMode: (enabled: boolean) => void;
  mockError: (message: string) => void;
  clearMockError: () => void;
  mockErrorState: string | null;
}

const TestingContext = createContext<TestingContextType | null>(null);

interface TestingProviderProps {
  children: ReactNode;
}

export function TestingProvider({ children }: TestingProviderProps) {
  const [testManager] = useState(() => new TestDataManager());
  const [isTestMode, setIsTestMode] = useState(false);
  const [mockErrorState, setMockErrorState] = useState<string | null>(null);

  const mockError = (message: string) => {
    setMockErrorState(message);
  };

  const clearMockError = () => {
    setMockErrorState(null);
  };

  const value: TestingContextType = {
    testManager,
    isTestMode,
    setTestMode: setIsTestMode,
    mockError,
    clearMockError,
    mockErrorState
  };

  return (
    <TestingContext.Provider value={value}>
      {children}
    </TestingContext.Provider>
  );
}

export function useTestingContext() {
  const context = useContext(TestingContext);
  if (!context) {
    throw new Error('useTestingContext must be used within a TestingProvider');
  }
  return context;
}

/**
 * Error boundary for test components
 */
interface TestErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class TestErrorBoundary extends React.Component<
  TestErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: TestErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Test component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h3 className="text-lg font-semibold text-red-800">Test Error</h3>
          <p className="text-red-600">
            {this.state.error?.message || 'An error occurred in the test component'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap test components with error boundary
 */
export function withTestErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return function TestWrappedComponent(props: P) {
    return (
      <TestErrorBoundary>
        <Component {...props} />
      </TestErrorBoundary>
    );
  };
}