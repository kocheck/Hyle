import { GridType } from '../store/gameStore';
import { snapToHexGrid, snapToIsoGrid } from './gridGeometry';

/**
 * Snaps pixel coordinates to the nearest grid intersection or cell center
 *
 * This function provides intelligent snapping based on token dimensions to ensure
 * proper alignment with the tactical grid. Different sized tokens snap differently:
 *
 * **Smart Snapping Logic:**
 * - **Even-sized tokens** (0x0, 2x2, 4x4 cells): Snap to grid intersections
 * - **Odd-sized tokens** (1x1, 3x3, 5x5 cells): Snap to cell centers
 *
 * This ensures all tokens align properly regardless of size. For example:
 * - A Medium creature (1x1, 50px) centers on a cell
 * - A Large creature (2x2, 100px) corners align to intersections
 * - A Huge creature (3x3, 150px) centers on a 3x3 group of cells
 *
 * **Why this matters:**
 * In D&D 5e and similar games, creature size determines grid positioning:
 * - Medium/Small (1x1): Occupy single cell, should center
 * - Large (2x2): Occupy 4 cells, corners at intersections
 * - Huge (3x3): Occupy 9 cells, centered on middle cell
 *
 * **Legacy mode**: When width/height not provided, uses simple top-left
 * rounding for backward compatibility with existing code.
 *
 * **Algorithm details:**
 * 1. Calculate token center point
 * 2. Determine how many grid cells token occupies
 * 3. Check if cell count is odd or even
 * 4. If odd: Snap center to cell center (index + 0.5) * gridSize
 * 5. If even: Snap center to intersection (index * gridSize)
 * 6. Convert back to top-left corner position
 *
 * @param x - Raw X coordinate in pixels (top-left corner, e.g., from drag position)
 * @param y - Raw Y coordinate in pixels (top-left corner, e.g., from drag position)
 * @param gridSize - Size of each grid cell in pixels (typically 50)
 * @param width - Token width in pixels (optional, enables smart snapping)
 * @param height - Token height in pixels (optional, enables smart snapping)
 * @param gridType - Grid Type (LINES, DOTS, HEX_H, HEX_V, ISO_H, ISO_V)
 * @returns Object with snapped x and y coordinates (top-left corner)
 */
export const snapToGrid = (
  x: number,
  y: number,
  gridSize: number,
  width?: number,
  height?: number,
  gridType: GridType = 'LINES'
): { x: number; y: number } => {
  // Center point calculation for non-square grids
  const centerX = width !== undefined ? x + width / 2 : x;
  const centerY = height !== undefined ? y + height / 2 : y;

  if (gridType === 'HEX_H') {
    const snapped = snapToHexGrid(centerX, centerY, gridSize, 'FLAT');
    return {
      x: snapped.x - (width !== undefined ? width / 2 : 0),
      y: snapped.y - (height !== undefined ? height / 2 : 0)
    };
  }

  if (gridType === 'HEX_V') {
    const snapped = snapToHexGrid(centerX, centerY, gridSize, 'POINTY');
    return {
      x: snapped.x - (width !== undefined ? width / 2 : 0),
      y: snapped.y - (height !== undefined ? height / 2 : 0)
    };
  }

  if (gridType === 'ISO_H' || gridType === 'ISO_V') {
    // Treat ISO_V same as ISO_H for now unless specific vertical iso logic needed
    const snapped = snapToIsoGrid(centerX, centerY, gridSize);
    return {
      x: snapped.x - (width !== undefined ? width / 2 : 0),
      y: snapped.y - (height !== undefined ? height / 2 : 0)
    };
  }

  // Fallback to Square Grid Logic (LINES/DOTS/HIDDEN)

  // If dimensions not provided, use simple top-left rounding (legacy behavior)
  if (width === undefined || height === undefined) {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }

  /**
   * Snaps a single dimension (x or y) based on token size
   *
   * @param pos - Current position (top-left corner)
   * @param size - Token size in that dimension (width or height)
   * @returns Snapped position (top-left corner)
   */
  const snapDimension = (pos: number, size: number) => {
    const center = pos + size / 2;
    const cellCount = Math.round(size / gridSize);

    // Even (or 0): Snap to Intersection
    // Odd: Snap to Cell Center
    const isOdd = cellCount % 2 !== 0;

    let snapCenter;
    if (isOdd) {
      // Cell Center: (Index + 0.5) * gridSize
      // We use floor of center/gridSize to find the cell index
      snapCenter = (Math.floor(center / gridSize) + 0.5) * gridSize;
    } else {
      // Intersection: Index * gridSize
      snapCenter = Math.round(center / gridSize) * gridSize;
    }

    return snapCenter - size / 2;
  };

  return {
    x: snapDimension(x, width),
    y: snapDimension(y, height),
  };
};
