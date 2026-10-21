export function Field({
  label,
  name,
  type = 'text',
  error,
  autoComplete,
  inputMode,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  error?: string
  autoComplete?: string
  inputMode?: 'numeric' | 'text' | 'email'
  placeholder?: string
}) {
  const errorId = `${name}-error`
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="rounded-lg border border-store-ink/20 bg-white px-3 py-2 font-normal"
      />
      {error && (
        <span id={errorId} className="text-store-terracotta-dark" data-testid={`error-${name}`}>
          {error}
        </span>
      )}
    </label>
  )
}
