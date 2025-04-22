export function calculateOkrProgress(
  keyResults: { progress: number }[],
): number {
  if (!keyResults.length) return 0;
  const total = keyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0);
  return Math.round(total / keyResults.length);
}
