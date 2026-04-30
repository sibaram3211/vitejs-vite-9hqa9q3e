import './style.css';
import { isCameraPossibleGrid } from './camera-possible-grid.ts';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<section>
  <div id="isCamPossible"></div>
</section>
`;

/**
 * Determines whether a given set of camera hardware configurations
 * can fully cover a required operating range defined by distance and light level.
 *
 * The function evaluates coverage over a 2D grid formed by:
 *   - Distance range (e.g., meters)
 *   - Light level range (e.g., lux)
 *
 * It checks whether the union of all provided camera specifications
 * completely covers the target range without any gaps ("pinhole" areas).
 *
 * @param targetDistance - The required distance range that must be covered.
 *   Example: { min: 10, max: 50 }
 *
 * @param targetLight - The required light level range that must be covered.
 *   Example: { min: 100, max: 900 }
 *
 * @param cameras - List of available camera hardware configurations.
 *   Each camera defines the range of distance and light levels it can operate in:
 *   {
 *     dist: { min: number, max: number },
 *     light: { min: number, max: number }
 *   }
 *
 * @returns boolean
 *   - true → If the combined coverage of all cameras fully spans the target
 *            distance × light grid with no uncovered regions.
 *   - false → If any portion of the target range is not covered by any camera.
 *
 * @example
 * const isPossible = isCameraPossibleGrid(
 *   { min: 10, max: 50 },
 *   { min: 100, max: 900 },
 *   [
 *     { dist: { min: 10, max: 35 }, light: { min: 100, max: 550 } },
 *     { dist: { min: 30, max: 50 }, light: { min: 100, max: 550 } },
 *     { dist: { min: 10, max: 35 }, light: { min: 500, max: 900 } },
 *     { dist: { min: 30, max: 50 }, light: { min: 500, max: 900 } },
 *     { dist: { min: 25, max: 35 }, light: { min: 400, max: 600 } },
 *   ]
 * );
 *
 * In this example:
 * - The target grid spans distance 10–50 and light 100–900.
 * - Multiple cameras overlap to cover different regions.
 * - If their combined ranges leave no uncovered gaps, the result is true.
 * - Even a small uncovered gap ("pinhole") will result in false.
 */
const isPossible = isCameraPossibleGrid(
  { min: 10, max: 50 },
  { min: 100, max: 900 },
  [
    { dist: { min: 10, max: 35 }, light: { min: 100, max: 550 } },
    { dist: { min: 30, max: 50 }, light: { min: 100, max: 550 } },
    { dist: { min: 10, max: 35 }, light: { min: 500, max: 900 } },
    { dist: { min: 30, max: 50 }, light: { min: 500, max: 900 } },
    { dist: { min: 25, max: 35 }, light: { min: 400, max: 600 } },
  ]
);

document.querySelector<HTMLDivElement>('#isCamPossible')!.innerHTML =
  'Is cameras are sufficient::> ' + '<b>' + isPossible + '</b>';
