import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

const CHUNK_RELOAD_KEY = "booksuite:chunk-reloaded";

function isChunkLoadError(error: Error) {
  const msg = `${error?.name || ""} ${error?.message || ""}`.toLowerCase();
  return (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("importing a module script failed") ||
    msg.includes("chunkloaderror")
  );
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (isChunkLoadError(error)) {
      // A new version was published while this page was open — reload once.
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY) !== "1") {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
        window.location.reload();
        return;
      }
    }
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  handleReload = () => {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-background px-6 py-16">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            Sorry — this page ran into an unexpected problem. Reloading usually fixes it.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={this.handleReload}>Reload page</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Back to home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
