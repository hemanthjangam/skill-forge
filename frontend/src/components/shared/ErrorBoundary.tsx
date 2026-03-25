import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <Card className="w-full max-w-2xl border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Something went wrong.</CardTitle>
              <CardDescription>A component crashed during rendering.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="p-4 bg-muted overflow-auto rounded text-sm w-full font-mono text-destructive-foreground">
                {this.state.error?.toString()}
                {"\n\n"}
                {this.state.error?.stack}
              </pre>
              <Button onClick={() => window.location.href = "/"}>
                Return to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
