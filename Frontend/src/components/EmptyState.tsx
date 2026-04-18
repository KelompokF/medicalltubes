import { FileX } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

const EmptyState = ({ title = "No data found", description = "There's nothing to show here yet.", icon }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
    <div className="rounded-full bg-muted p-4">
      {icon || <FileX className="h-8 w-8 text-muted-foreground" />}
    </div>
    <div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  </div>
);

export default EmptyState;
