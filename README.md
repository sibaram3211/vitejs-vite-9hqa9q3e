# Camera Coverage Validator

A TypeScript utility that determines whether a set of **hardware cameras** can collectively cover the full operating range of a desired **software camera**.

Each hardware camera works within a specific range of subject distances and light levels. This validator checks whether a proposed set of hardware cameras has **no gaps** in the 2D space of distance × light.

---

## Problem Statement

A software camera must support:
- A **target subject distance** range — e.g. 0m to 100m
- A **target light level** range — e.g. 0 lux to 100 lux

Each hardware camera covers a rectangular sub-region of that space. The goal is to verify that the union of all hardware camera rectangles completely tiles the target rectangle with **no uncovered gaps**.

```
Light
100 |[====cam1====][====cam2====]|
 60 |[====cam1====][====cam2====]|
  0 |[====cam1====][====cam2====]|
     0            50            100   Distance
```

---

## Algorithm — Coordinate Compression + Grid Scan

### Core Insight

Instead of checking every point in continuous 2D space (impossible), we only need to check at **camera boundaries** — the lines where coverage changes.

Between any two consecutive boundaries, no camera starts or stops, so coverage is constant. One midpoint check per cell is both necessary and sufficient.

### Steps

**1. Coordinate Compression**

Collect all unique boundary values from every camera on each axis. Filter to only those inside the target range. Sort them to form intervals.

```
Camera edges on dist axis:  0, 30, 60, 100
Intervals formed:           [0→30]  [30→60]  [60→100]
Midpoints to check:           15      45        80
```

**2. Grid Formation**

The compressed boundaries on each axis form a 2D grid of cells. Each cell is a rectangle where camera membership does not change internally.

**3. Midpoint Check**

For each cell, compute its midpoint and test whether at least one camera covers it. Since no camera boundary crosses the cell interior, a camera either covers the entire cell or none of it — so the midpoint is sufficient and exact.

**4. Short-Circuit on Gap**

The moment any cell is found uncovered, return `false` immediately. If all cells pass, return `true`.

### Why Midpoint is Exact (Not an Approximation)

```
Cell boundary:  [30 ─────────── 60]
                      midpoint = 45

No camera starts or stops between 30 and 60.
If camera covers midpoint 45 → it covers the whole cell.
If camera misses midpoint 45 → the whole cell is a gap.
```

### Complexity

| Step | Cost |
|---|---|
| Collect + sort edges | O(n log n) |
| Grid scan | O(n²) cells × O(n) camera check = **O(n³)** |

Sufficient for hundreds of cameras. For thousands, consider the sweep line + segment tree approach (see below).

---

## Usage

```typescript
import { isCameraPossible } from './cameraCoverageValidator';

const targetDist  = { min: 0, max: 100 };
const targetLight = { min: 0, max: 100 };

const cameras = [
  { dist: { min: 0,  max: 50  }, light: { min: 0, max: 100 } },
  { dist: { min: 50, max: 100 }, light: { min: 0, max: 100 } },
];

console.log(isCameraPossible(targetDist, targetLight, cameras)); // true
```

---

## API

```typescript
function isCameraPossible(
  targetDist:  Range,
  targetLight: Range,
  hwCameras:   Camera[]
): boolean
```

### Types

```typescript
interface Range {
  min: number;
  max: number;
}

interface Camera {
  dist:  Range;
  light: Range;
}
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `targetDist` | `Range` | Required subject distance range for the software camera |
| `targetLight` | `Range` | Required light level range for the software camera |
| `hwCameras` | `Camera[]` | List of hardware cameras with their respective ranges |

### Returns

`true` if the hardware cameras fully cover the target region with no gaps, `false` otherwise.

---

## Examples

### ✅ Full Coverage — returns `true`

```typescript
const cameras = [
  { dist: { min: 0,  max: 50  }, light: { min: 0, max: 100 } },
  { dist: { min: 50, max: 100 }, light: { min: 0, max: 100 } },
];
// Two cameras split the dist axis — full coverage
```

### ❌ Gap in Distance — returns `false`

```typescript
const cameras = [
  { dist: { min: 0,  max: 40  }, light: { min: 0, max: 100 } },
  { dist: { min: 60, max: 100 }, light: { min: 0, max: 100 } },
];
// dist 40–60 has no camera → gap
```

### ❌ Gap in Light — returns `false`

```typescript
const cameras = [
  { dist: { min: 0, max: 100 }, light: { min: 0,  max: 40  } },
  { dist: { min: 0, max: 100 }, light: { min: 60, max: 100 } },
];
// light 40–60 has no camera → gap
```

### ❌ Corner Gap — returns `false`

```typescript
const cameras = [
  { dist: { min: 0,  max: 60  }, light: { min: 0,  max: 60  } },
  { dist: { min: 40, max: 100 }, light: { min: 0,  max: 60  } },
  { dist: { min: 0,  max: 60  }, light: { min: 40, max: 100 } },
  // top-right corner dist[60,100] × light[60,100] is missing
];
```

```
Light
100 |[==cam3==][        ]|  ← gap here
 60 |[==cam3==][        ]|
 40 |[=cam1+3=][==cam2==]|
  0 |[==cam1==][==cam2==]|
     0        60        100  Distance
```

### ✅ Overlapping Cameras — returns `true`

```typescript
const targetDist  = { min: 10, max: 80 };
const targetLight = { min: 20, max: 90 };

const cameras = [
  { dist: { min: 0,  max: 50  }, light: { min: 0,  max: 60  } },
  { dist: { min: 30, max: 100 }, light: { min: 40, max: 100 } },
];
// Cameras overlap in the middle — together they cover the target
```



MIT
