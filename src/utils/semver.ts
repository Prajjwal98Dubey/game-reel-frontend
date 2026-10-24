/** Compares dotted numeric versions ("1.2.0"). Pre-release suffixes are ignored. */
export function compareVersions(a: string, b: string): number {
  const pa = a
    .split('-')[0]
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
  const pb = b
    .split('-')[0]
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

export function satisfiesMin(current: string, min: string): boolean {
  return compareVersions(current, min) >= 0;
}
