const STEPS = ['Carrito', 'Envío y pago', 'Confirmación'] as const

// CHK-006: where the customer is in the purchase; the current step carries aria-current="step".
export function CheckoutSteps({ current }: { current: (typeof STEPS)[number] }) {
  const index = STEPS.indexOf(current)
  return (
    <ol aria-label="Pasos de la compra" className="mb-8 flex items-center gap-2 text-sm sm:gap-4" data-testid="checkout-steps">
      {STEPS.map((step, i) => (
        <li key={step} aria-current={i === index ? 'step' : undefined} className="flex items-center gap-2 sm:gap-4">
          <span className={`flex items-center gap-2 ${i === index ? 'font-semibold text-store-ink' : i < index ? 'text-store-olive' : 'text-store-muted'}`}>
            <span
              className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                i === index ? 'bg-store-terracotta text-white' : i < index ? 'bg-store-olive text-white' : 'border border-store-ink/25'
              }`}
            >
              {i < index ? '✓' : i + 1}
            </span>
            {step}
          </span>
          {i < STEPS.length - 1 && <span aria-hidden="true" className="h-px w-6 bg-store-ink/20 sm:w-12" />}
        </li>
      ))}
    </ol>
  )
}
