import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const sizeMap = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };

const LoadingSpinner = ({ size = "md", text }: LoadingSpinnerProps) => (
  <div className="flex flex-col items-center justify-center gap-3 py-12">
    <Loader2 className={`${sizeMap[size]} animate-spin text-primary`} />
    {text && <p className="text-sm text-muted-foreground">{text}</p>}
  </div>
);

export default LoadingSpinner;
