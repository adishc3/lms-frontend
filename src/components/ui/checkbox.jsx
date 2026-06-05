import { forwardRef } from "react"

const Checkbox = forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    className={`h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-950 ${className}`}
    {...props}
  />
))

Checkbox.displayName = "Checkbox"

export { Checkbox }
