import { forwardRef } from "react"

const Input = forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`block w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${className}`}
    {...props}
  />
))

Input.displayName = "Input"

export { Input }
