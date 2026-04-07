import { cn } from "@/lib/utils"

type IconBoxSize = "sm" | "md" | "lg" | "xl"
type IconBoxColor = "primary" | "amber" | "blue" | "green" | "red"

interface IconBoxProps {
  size?: IconBoxSize
  color?: IconBoxColor
  children: React.ReactNode
  className?: string
}

const sizeClasses: Record<IconBoxSize, string> = {
  sm: "acam-icon-box-sm",
  md: "acam-icon-box-md",
  lg: "acam-icon-box-lg",
  xl: "acam-icon-box-xl",
}

const colorClasses: Record<IconBoxColor, string> = {
  primary: "",
  amber: "acam-icon-box-amber",
  blue: "acam-icon-box-blue",
  green: "acam-icon-box-green",
  red: "acam-icon-box-red",
}

export function IconBox({ size = "lg", color = "primary", children, className }: IconBoxProps) {
  return (
    <div className={cn("acam-icon-box", sizeClasses[size], colorClasses[color], className)}>
      {children}
    </div>
  )
}
