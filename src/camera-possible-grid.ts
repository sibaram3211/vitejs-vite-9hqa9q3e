interface Range {
  min: number;
  max: number;
}

interface Camera {
  dist: Range;
  light: Range;
}

/**
 * Checks whether a set of hardware cameras fully covers a target
 * subject-distance × light-level region.
 *
 * APPROACH — Coordinate Compression + Grid Scan
 * ─────────────────────────────────────────────
 * The target region is a 2D rectangle:
 *   X-axis → subject distance   [targetDist.min,  targetDist.max]
 *   Y-axis → light level        [targetLight.min, targetLight.max]
 *
 * Each hardware camera covers a sub-rectangle of that space.
 * We need to verify their UNION covers the entire target with no gaps.
 *
 * KEY INSIGHT — Coordinate Compression:
 *   Instead of checking every point in a continuous space (impossible),
 *   we only need to check at camera boundaries — the lines where
 *   coverage changes. Between two consecutive boundaries, coverage
 *   is constant (no camera starts or stops), so one midpoint check
 *   per interval is both necessary and sufficient.
 *
 *   Example on the dist axis:
 *     Cameras end/start at: 0, 30, 60, 100
 *     Intervals formed:     [0→30]  [30→60]  [60→100]
 *     Midpoints checked:      15      45        80
 *
 * KEY INSIGHT — Midpoint Sufficiency:
 *   Within any grid cell, no camera boundary crosses the interior.
 *   Therefore a camera either covers the ENTIRE cell or NONE of it.
 *   Checking the midpoint tells us exactly which case applies.
 *
 * CORRECTNESS:
 *   All cells covered  →  full 2D area covered  →  return true
 *   Any cell uncovered →  gap exists             →  return false
 *
 * COMPLEXITY:
 *   n = number of hardware cameras
 *   Building edges  : O(n log n)  — dedup + sort
 *   Grid scan       : O(n²)  cells  ×  O(n) camera check  =  O(n³)
 */
export function isCameraPossibleGrid(
  targetDist: Range,
  targetLight: Range,
  hwCameras: Camera[]
): boolean {
  // ── STEP 1: COORDINATE COMPRESSION ──────────────────────────────────────
  // Gather every camera boundary on each axis and add the target's own
  // boundaries as anchors. Then filter to only points inside the target —
  // outside boundaries create no new cells within the region we care about.
  // Finally sort so consecutive entries form valid intervals.
  const distEdges = [
    ...new Set<number>([
      targetDist.min,
      targetDist.max,
      ...hwCameras.flatMap((c) => [c.dist.min, c.dist.max]),
    ]),
  ]
    .filter((d) => d >= targetDist.min && d <= targetDist.max)
    .sort((a, b) => a - b);

  const lightEdges = [
    ...new Set<number>([
      targetLight.min,
      targetLight.max,
      ...hwCameras.flatMap((c) => [c.light.min, c.light.max]),
    ]),
  ]
    .filter((l) => l >= targetLight.min && l <= targetLight.max)
    .sort((a, b) => a - b);

  // ── STEP 2: GRID SCAN ────────────────────────────────────────────────────
  // Each (i, j) pair defines one cell:
  //   dist  interval: [distEdges[i],  distEdges[i+1]]
  //   light interval: [lightEdges[j], lightEdges[j+1]]
  //
  // We test the cell's midpoint against every camera.
  // The moment we find an uncovered cell we short-circuit and return false —
  // no need to check the remaining cells.
  for (let i = 0; i < distEdges.length - 1; i++) {
    for (let j = 0; j < lightEdges.length - 1; j++) {
      const midDist = (distEdges[i] + distEdges[i + 1]) / 2;
      const midLight = (lightEdges[j] + lightEdges[j + 1]) / 2;
      const covered = hwCameras.some(
        (c) =>
          midDist >= c.dist.min &&
          midDist <= c.dist.max &&
          midLight >= c.light.min &&
          midLight <= c.light.max
      );
      if (!covered) return false; // gap found — hardware set is insufficient
    }
  }
  // Every cell in the compressed grid is covered → no gap exists
  return true;
}
