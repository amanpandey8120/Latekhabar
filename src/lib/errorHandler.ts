/**
 * Formats and extracts user-friendly error messages from Supabase errors,
 * Postgrest errors, Auth errors, Storage errors, JS Error instances,
 * or unknown objects.
 *
 * Guarantees that "[object Object]" is NEVER returned.
 */
export function formatErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred. Please try again.'
): string {
  if (!error) return fallback;

  // 1. If already a clean string
  if (typeof error === 'string') {
    const trimmed = error.trim();
    if (trimmed && trimmed !== '[object Object]') {
      return trimmed;
    }
    return fallback;
  }

  // 2. If it's an object or Error instance
  if (typeof error === 'object' && error !== null) {
    const errObj = error as Record<string, unknown>;

    // Extract message fields
    const message =
      typeof errObj.message === 'string' &&
      errObj.message.trim() &&
      errObj.message !== '[object Object]'
        ? errObj.message.trim()
        : typeof errObj.error_description === 'string' && errObj.error_description.trim()
        ? errObj.error_description.trim()
        : typeof errObj.error === 'string' &&
          errObj.error.trim() &&
          errObj.error !== '[object Object]'
        ? errObj.error.trim()
        : typeof errObj.statusText === 'string' && errObj.statusText.trim()
        ? errObj.statusText.trim()
        : null;

    const details =
      typeof errObj.details === 'string' &&
      errObj.details.trim() &&
      errObj.details !== '[object Object]'
        ? errObj.details.trim()
        : null;

    const hint =
      typeof errObj.hint === 'string' &&
      errObj.hint.trim() &&
      errObj.hint !== '[object Object]'
        ? errObj.hint.trim()
        : null;

    const code =
      typeof errObj.code === 'string' && errObj.code.trim()
        ? errObj.code.trim()
        : typeof errObj.code === 'number'
        ? String(errObj.code)
        : null;

    if (message) {
      let result = message;
      if (details && details !== message) {
        result += ` — ${details}`;
      }
      if (hint && hint !== message && hint !== details) {
        result += ` (${hint})`;
      }
      if (code && !result.includes(code)) {
        // e.g. RLS or constraint violations
        if (code === '42501') {
          result += ' [Error 42501: Permission Denied / RLS Policy]';
        } else if (code === '23505') {
          result += ' [Error 23505: Unique Constraint Violation]';
        }
      }
      return result;
    }

    if (details) {
      return hint ? `${details} (${hint})` : details;
    }

    if (hint) {
      return hint;
    }

    // Try JSON serialization for simple error payloads
    try {
      const jsonStr = JSON.stringify(error);
      if (jsonStr && jsonStr !== '{}' && jsonStr !== '[]' && jsonStr.length < 200) {
        return jsonStr;
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback to String conversion only when not "[object Object]"
  const str = String(error);
  if (str && str !== '[object Object]' && str !== 'null' && str !== 'undefined') {
    return str;
  }

  return fallback;
}

export default formatErrorMessage;
