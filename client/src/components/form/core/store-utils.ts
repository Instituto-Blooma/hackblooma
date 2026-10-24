export function unsubscribeStore(subscription: unknown): void {
  if (typeof subscription === 'function') {
    subscription();
    return;
  }

  if (
    subscription &&
    typeof subscription === 'object' &&
    'unsubscribe' in subscription &&
    typeof (subscription as { unsubscribe: () => void }).unsubscribe === 'function'
  ) {
    (subscription as { unsubscribe: () => void }).unsubscribe();
  }
}
