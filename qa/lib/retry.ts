export type Attempt<T> = { ok: true; value: T } | { ok: false; error: string }

export interface RetryOutcome<T> {
  value: T | null
  /** The tool error of the first attempt when the second one measured: the test is then flaky, not failed. */
  firstError: string | null
  error: string | null
}

/**
 * QA-035: an error of the tool itself (it did not measure) is retried once. A measurement that misses its budget is
 * not an attempt error and is never retried: that is a real result.
 */
export async function retryToolError<T>(attempt: () => Promise<Attempt<T>>): Promise<RetryOutcome<T>> {
  const first = await attempt()
  if (first.ok) return { value: first.value, firstError: null, error: null }
  const second = await attempt()
  return second.ok
    ? { value: second.value, firstError: first.error, error: null }
    : { value: null, firstError: first.error, error: second.error }
}
