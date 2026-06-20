/**
 * Shared helpers for pulling structured JSON out of a Claude text response.
 * Claude is instructed to respond with "ONLY a JSON object/array, no preamble"
 * but models sometimes wrap that in a little extra text anyway — these find
 * the first/last bracket of the expected shape and parse what's between them.
 */

export function extractJson<T>(text: string): T {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Claude did not return JSON');
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}

export function extractJsonArray<T>(text: string): T[] {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) {
    throw new Error('Claude did not return a JSON array');
  }
  return JSON.parse(text.slice(start, end + 1)) as T[];
}
