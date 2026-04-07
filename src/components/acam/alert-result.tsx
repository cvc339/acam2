import { cn } from "@/lib/utils"
import { StatusBadge } from "./status-badge"

interface AlertResultProps {
  status?: "success" | "warning" | "error"
  statusLabel?: string
  children: React.ReactNode
  className?: string
}

export function AlertResult({ status, statusLabel, children, className }: AlertResultProps) {
  return (
    <div className={cn("acam-alert-result", className)}>
      {status && statusLabel && (
        <StatusBadge variant={status} className="badge-inline">
          {statusLabel}
        </StatusBadge>
      )}
      <div>{children}</div>
    </div>
  )
}
