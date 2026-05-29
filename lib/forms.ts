/** Shared shape for `useActionState`-driven form server actions. */
export type FormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  /** Field-level errors keyed by field name (from Zod flatten). */
  fieldErrors?: Record<string, string[]>;
};

export const IDLE_FORM_STATE: FormState = { status: 'idle' };

/** Shape for direct (non-form) server-action calls that return data or an error. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
