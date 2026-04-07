interface ProgressBarProps {
  label: string
  value: string
  percent: number
}

export function ProgressBar({ label, value, percent }: ProgressBarProps) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="acam-progress-label">{label}</span>
        <span className="acam-progress-value">{value}</span>
      </div>
      <div className="acam-progress">
        <div className="acam-progress-bar acam-progress-bar-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
