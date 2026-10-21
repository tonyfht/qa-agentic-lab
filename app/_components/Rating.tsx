import { StarIcon } from './icons'

export function Rating({ value, className = '' }: { value: number; className?: string }) {
  const text = value.toLocaleString('es-ES', { minimumFractionDigits: 1 })
  return (
    <span className={`inline-flex items-center gap-1 text-sm text-store-muted ${className}`}>
      <StarIcon className="size-4 fill-[#c8902e] text-[#c8902e]" />
      <span aria-hidden="true">{text}</span>
      <span className="sr-only">Valoración {text} de 5</span>
    </span>
  )
}
