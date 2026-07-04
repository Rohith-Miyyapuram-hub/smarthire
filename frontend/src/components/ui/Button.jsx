/**
 * Button — reusable button with loading state and variants.
 *
 * Props:
 *   variant  — 'primary' | 'secondary' | 'danger'  (default: 'primary')
 *   loading  — boolean, shows spinner and disables click
 *   className — extra Tailwind classes
 *   ...props  — anything else a normal <button> takes (onClick, type, disabled)
 */
function Button({ children, variant = 'primary', loading = false, className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm ' +
    'transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95'

  const variants = {
    primary:   'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    danger:    'bg-red-600 text-white hover:bg-red-700',
    ghost:     'text-gray-600 hover:bg-gray-100',
  }

  return (
    <button
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

export default Button
