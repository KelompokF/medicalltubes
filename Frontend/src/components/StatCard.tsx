import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "primary" | "success" | "warning" | "emergency";
}

const variantStyles = {
  default: "bg-card",
  primary: "bg-primary/5 border-primary/20",
  success: "bg-success/5 border-success/20",
  warning: "bg-warning/5 border-warning/20",
  emergency: "bg-emergency/5 border-emergency/20",
};

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  emergency: "bg-emergency/10 text-emergency",
};

const StatCard = ({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) => (
  <Card className={`${variantStyles[variant]} shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5`}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {trend && <p className="text-xs text-success mt-1">{trend}</p>}
        </div>
        <div className={`rounded-xl p-3 ${iconVariantStyles[variant]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default StatCard;
