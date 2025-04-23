type KeyResult = {
  id: number;
  parent_key_result_id: number | null;
  progress: number;
};

export function calculateOkrProgress(keyResults: KeyResult[]): number {
  const childMap = new Map<number, KeyResult[]>();

  // Map children by parent ID
  for (const kr of keyResults) {
    if (kr.parent_key_result_id !== null) {
      if (!childMap.has(kr.parent_key_result_id)) {
        childMap.set(kr.parent_key_result_id, []);
      }
      childMap.get(kr.parent_key_result_id)!.push(kr);
    }
  }

  // Recursively calculate a KR's true progress
  function getKRProgress(kr: KeyResult): number {
    const children = childMap.get(kr.id);
    if (!children || children.length === 0) return kr.progress || 0;

    const total = children.reduce(
      (acc, child) => acc + getKRProgress(child),
      0,
    );
    return total / children.length;
  }

  // Get only top-level key results (no parent)
  const topLevelKRs = keyResults.filter(
    (kr) => kr.parent_key_result_id === null,
  );

  if (!topLevelKRs.length) return 0;

  const total = topLevelKRs.reduce((acc, kr) => acc + getKRProgress(kr), 0);
  return Math.round(total / topLevelKRs.length);
}
