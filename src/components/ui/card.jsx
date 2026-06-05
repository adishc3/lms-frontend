import { forwardRef } from "react"

const Card = forwardRef(({ className = "", children, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm shadow-xl shadow-black/20 ${className}`}
    {...props}
  >
    {children}
  </div>
))

Card.displayName = "Card"

const CardHeader = ({ className = "", children, ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
)

const CardTitle = ({ className = "", children, ...props }) => (
  <h2 className={`text-2xl font-semibold tracking-tight text-white ${className}`} {...props}>
    {children}
  </h2>
)

const CardDescription = ({ className = "", children, ...props }) => (
  <p className={`text-sm leading-6 text-slate-400 ${className}`} {...props}>
    {children}
  </p>
)

const CardContent = ({ className = "", children, ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
)

const CardFooter = ({ className = "", children, ...props }) => (
  <div className={`px-6 pb-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
)

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }

