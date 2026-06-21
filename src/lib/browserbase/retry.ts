// Browserbase's API gateway occasionally returns a transient 500
// ("An internal server error occurred") on individual act/extract calls
// within an otherwise-healthy session. Retry a couple times before
// surfacing an error to the user.
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, delayMs = 1500, label = 'operation' }: { attempts?: number; delayMs?: number; label?: string } = {},
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`[withRetry] ${label} failed (attempt ${i + 1}/${attempts}):`, err);
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}
