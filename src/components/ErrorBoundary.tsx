import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-md text-center space-y-6">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="text-xl font-semibold text-foreground">
              Une erreur inattendue est survenue
            </h1>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "Quelque chose s'est mal passé."}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={this.handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
              <Button onClick={() => window.location.replace("/")}>
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
