/**
 * Snaps pixel coordinates to the nearest grid intersection
 *
 * Uses rounding to find the closest grid cell intersection point. This ensures
 * tokens and other grid-aligned elements snap precisely to the tactical grid,
 * which is essential for tabletop RPG gameplay where positioning matters.
 *
 * Algorithm: For each axis, divide by grid size, round to nearest integer,
 * then multiply back by grid size to get the snapped coordinate.
 *
 * @param x - Raw X coordinate in pixels (e.g., from mouse position)
 * @param y - Raw Y coordinate in pixels (e.g., from mouse position)
 * @param gridSize - Size of each grid cell in pixels (typically 50)
 * @returns Object containing snapped x and y coordinates aligned to grid
 *
 * @example
 * // Snap mouse position to 50px grid
 * const { x, y } = snapToGrid(127, 83, 50);
 * // Returns: { x: 150, y: 100 }
 *
 * @example
 * // Exact grid position remains unchanged
 * const { x, y } = snapToGrid(100, 50, 50);
 * // Returns: { x: 100, y: 50 }
 *
 * @example
 * // Boundary case: .5 rounds up
 * const { x, y } = snapToGrid(125, 75, 50);
 * // Returns: { x: 150, y: 100 }
 */
export const snapToGrid = (x: number, y: number, gridSize: number): { x: number, y: number } => {
  const snappedX = Math.round(x / gridSize) * gridSize;
  const snappedY = Math.round(y / gridSize) * gridSize;
  return { x: snappedX, y: snappedY };
};
