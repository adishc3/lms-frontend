import { forwardRef } from "react"

const Checkbox = forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    className={`h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-cyan-500 focus:ring-cyan-500 ${className}`}
    {...props}
  />
))

export { Checkbox }
