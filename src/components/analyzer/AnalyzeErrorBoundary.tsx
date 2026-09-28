import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAnalyzerStore } from "@/store/analyzerStore";

interface AnalyzeErrorBoundaryProps {
  children: ReactNode;
}

interface AnalyzeErrorBoundaryState {
  failed: boolean;
}

export class AnalyzeErrorBoundary extends Component<
  AnalyzeErrorBoundaryProps,
  AnalyzeErrorBoundaryState
> {
  state: AnalyzeErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AnalyzeErrorBoundaryState {
    return { failed: true };
  }

  private reset = () => {
    useAnalyzerStore.getState().reset();
    this.setState({ failed: false });
  };

  render() {
    if (this.state.failed) {
      return (
        <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-start justify-center gap-4 px-4 py-16">
          <h1 className="font-display text-2xl font-bold">Something went wrong, try another file</h1>
          <p className="text-sm text-muted">
            The analyzer hit a problem while reading this export. Your ZIP was not uploaded.
          </p>
          <Button type="button" onClick={this.reset}>
            Reset
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
