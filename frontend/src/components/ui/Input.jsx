/**
 * Input — labelled text input with inline error display.
 *
 * Props:
 *   label     — string shown above the input
 *   error     — string error message shown below (red)
 *   className — extra classes on the <input> element
 *   ...props  — all native input props (type, value, onChange, placeholder, etc.)
 */
function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        className={[
          'w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition',
          error
            ? 'border-red-400 focus:ring-2 focus:ring-red-100'
            : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export default Input
