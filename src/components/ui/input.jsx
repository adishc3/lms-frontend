import { forwardRef } from "react"

const Input = forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`block w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-zinc-50 placeholder:text-zinc-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 ${className}`}
    {...props}
  />
))

export { Input }
