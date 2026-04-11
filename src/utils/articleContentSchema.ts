/**
 * Minimal validation for article content payload.
 * Used to report issues without refusing to load; raw JSON remains source of truth.
 */

export interface ContentSchemaValidationResult {
  valid: boolean;
  errors: string[];
}

export interface RawTransitionValidationResult {
  ok: boolean;
  payload?: Record<string, unknown> & { content: unknown[] };
  errors: string[];
}

/**
 * Validate that payload has the minimal structure: { content: array of items with type }.
 * Does not validate item shapes in depth. Invalid payloads can still be loaded; errors are for UI only.
 */
export function validateContentPayload(payload: unknown): ContentSchemaValidationResult {
  const errors: string[] = [];
  if (payload == null || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload must be an object'] };
  }
  const obj = payload as Record<string, unknown>;
  if (!('content' in obj)) {
    errors.push('Payload must have a "content" field');
    return { valid: false, errors };
  }
  const content = obj.content;
  if (!Array.isArray(content)) {
    errors.push('"content" must be an array');
    return { valid: false, errors };
  }
  for (let i = 0; i < content.length; i++) {
    const item = content[i];
    if (item == null || typeof item !== 'object') {
      errors.push(`Content item ${i + 1} must be an object`);
    } else if (!('type' in (item as Record<string, unknown>)) || typeof (item as Record<string, unknown>).type !== 'string') {
      errors.push(`Content item ${i + 1} must have a string "type"`);
    }
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateRawJsonForTransition(raw: string): RawTransitionValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      errors: ['Invalid JSON syntax.'],
    };
  }
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      errors: ['Payload must be a JSON object with a "content" array.'],
    };
  }
  const payload = parsed as Record<string, unknown>;
  if (!Array.isArray(payload.content)) {
    return {
      ok: false,
      errors: ['Payload must have "content" as an array.'],
    };
  }
  const content = payload.content as unknown[];
  const errors: string[] = [];
  for (let i = 0; i < content.length; i++) {
    const item = content[i];
    if (item == null || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`content[${i}] must be an object.`);
      continue;
    }
    const itemType = (item as Record<string, unknown>).type;
    if (typeof itemType !== 'string' || itemType.length === 0) {
      errors.push(`content[${i}] must contain string field "type".`);
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, payload: payload as Record<string, unknown> & { content: unknown[] }, errors: [] };
}
