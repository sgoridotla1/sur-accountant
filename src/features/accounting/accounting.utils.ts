export function mayContainTransaction(text: string): boolean {
  return /\d/.test(text);
}
