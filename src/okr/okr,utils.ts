type KeyResult = {
  id: number;
  parent_key_result_id: number | null;
  progress: number; // 0-100
  weight: number; // 0-100
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

  // Recursively calculate a KR's weighted progress
  function getKRProgress(kr: KeyResult): number {
    const children = childMap.get(kr.id);
    if (!children || children.length === 0) {
      return kr.progress;
    }

    const totalWeight =
      children.reduce((sum, child) => sum + child.weight, 0) || 1;

    const weightedSum = children.reduce(
      (acc, child) => acc + getKRProgress(child) * (child.weight / totalWeight),
      0,
    );

    return weightedSum;
  }

  // Get top-level key results
  const topLevelKRs = keyResults.filter(
    (kr) => kr.parent_key_result_id === null,
  );
  if (!topLevelKRs.length) return 0;

  const totalWeight = topLevelKRs.reduce((sum, kr) => sum + kr.weight, 0) || 1;

  const weightedTotal = topLevelKRs.reduce(
    (acc, kr) => acc + getKRProgress(kr) * (kr.weight / totalWeight),
    0,
  );

  return Math.round(weightedTotal);
}
