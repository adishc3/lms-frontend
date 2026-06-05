import { forwardRef } from "react"

const variantClasses = {
  default: "bg-blue-500 text-white hover:bg-blue-600",
  secondary: "bg-slate-700 text-white hover:bg-slate-600",
  outline: "border-2 border-blue-400 text-blue-400 hover:bg-blue-400/10",
  ghost: "text-slate-300 hover:bg-slate-800 hover:text-white",
  gradient: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600",
}

const sizeClasses = {
  default: "px-4 py-2.5 text-sm",
  sm: "px-3 py-1.5 text-xs",
  lg: "px-6 py-3 text-base",
  xl: "px-8 py-4 text-lg",
}

const Button = forwardRef(
  ({ variant = "default", size = "default", className = "", children, ...props }, ref) => {
    const variantClass = variantClasses[variant] ?? variantClasses.default
    const sizeClass = sizeClasses[size] ?? sizeClasses.default

    return (
      <button
        ref={ref}
        type={props.type ?? "button"}
        className={`inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 ${variantClass} ${sizeClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
