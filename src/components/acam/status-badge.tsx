import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusBadgeVariant = "success" | "warning" | "error" | "info" | "primary" | "accent" | "dev"

interface StatusBadgeProps {
  variant: StatusBadgeVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<StatusBadgeVariant, string> = {
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
  info: "badge-info",
  primary: "badge-primary",
  accent: "badge-accent",
  dev: "badge-dev",
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <Badge className={cn(variantClasses[variant], className)}>
      {children}
    </Badge>
  )
}
