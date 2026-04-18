import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorAlertProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

const ErrorAlert = ({ title = "Something went wrong", message = "An error occurred. Please try again.", onRetry }: ErrorAlertProps) => (
  <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
    <div className="rounded-full bg-destructive/10 p-4">
      <AlertTriangle className="h-8 w-8 text-destructive" />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{message}</p>
    </div>
    {onRetry && <Button onClick={onRetry} variant="outline">Try Again</Button>}
  </div>
);

export default ErrorAlert;
