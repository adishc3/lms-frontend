import { forwardRef } from "react"

const variantClasses = {
  default: "bg-cyan-500 text-slate-950 hover:bg-cyan-600",
  secondary: "bg-cyan-500 text-white hover:bg-cyan-400",
  outline: "border border-slate-300 text-white hover:bg-white/10",
  ghost: "text-slate-300 hover:bg-slate-800 hover:text-white",
}

const sizeClasses = {
  default: "px-4 py-3 text-base",
  sm: "px-3 py-2 text-sm",
  lg: "px-5 py-4 text-lg",
}

const Button = forwardRef(
  ({ variant = "default", size = "default", className = "", children, ...props }, ref) => {
    const variantClass = variantClasses[variant] ?? variantClasses.default
    const sizeClass = sizeClasses[size] ?? sizeClasses.default

    return (
      <button
        ref={ref}
        type={props.type ?? "button"}
        className={`inline-flex items-center justify-center rounded-full font-semibold transition-colors duration-200 ${variantClass} ${sizeClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

export { Button }
