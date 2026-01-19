
/**
 * Debounce utility to prevent high-frequency operations from overloading the system.
 * Used for optimizing IndexedDB writes and API state synchronization.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;
  return (...args: Parameters<T>) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
}
