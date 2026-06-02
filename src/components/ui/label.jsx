const Label = ({ className = "", children, ...props }) => (
  <label className={`block text-sm font-medium text-zinc-300 ${className}`} {...props}>
    {children}
  </label>
)

export { Label }
