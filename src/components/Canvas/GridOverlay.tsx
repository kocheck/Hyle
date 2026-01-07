/**
 * Grid Overlay Component with Viewport Culling
 *
 * Renders a grid overlay on the canvas with three modes: LINES, DOTS, or HIDDEN.
 * Implements viewport culling to only render grid elements within visible bounds.
 *
 * **Three grid types:**
 * 1. **LINES** - Traditional grid with vertical and horizontal lines
 * 2. **DOTS** - Minimalist grid with dots at intersections (performance optimized)
 * 3. **HIDDEN** - No grid rendered
 *
 * **Viewport culling (performance optimization):**
 * Only renders grid elements within visibleBounds, dramatically improving
 * performance for large maps. Without culling, a 10,000x10,000px map with
 * 50px gridSize would render 40,000 lines (200 vertical × 200 horizontal).
 * With culling, only ~20 lines rendered at typical zoom levels.
 *
 * **DOT mode performance optimization:**
 * DOTS mode uses individual Circle components at grid intersections.
 * Performance degrades with many dots (e.g., zoomed out on large map).
 * When dot count exceeds MAX_DOTS_THRESHOLD (10,000), automatically
 * renders a subset by increasing step size, maintaining visual grid
 * while preventing performance issues.
 *
 * **Performance calculations:**
 * - LINES: O(visibleWidth/gridSize + visibleHeight/gridSize)
 * - DOTS normal: O((visibleWidth/gridSize) × (visibleHeight/gridSize))
 * - DOTS subset: Capped at ~MAX_DOTS_THRESHOLD via adaptive step size
 *
 * **Algorithm for subset rendering:**
 * 1. Calculate totalDots = (width/gridSize) × (height/gridSize)
 * 2. If totalDots > MAX_DOTS_THRESHOLD:
 *    - stepMultiplier = ceil(sqrt(totalDots / MAX_DOTS_THRESHOLD))
 *    - newStep = stepMultiplier × gridSize
 *    - Render with newStep instead of gridSize
 * 3. Example: 20,000 dots → multiplier ~1.4 → render every ~1.4 grids
 *
 * @example
 * // Basic usage in Canvas
 * <GridOverlay
 *   visibleBounds={getVisibleBounds()}
 *   gridSize={50}
 *   type="LINES"
 * />
 *
 * @example
 * // DOT mode with custom styling
 * <GridOverlay
 *   visibleBounds={viewport}
 *   gridSize={25}
 *   stroke="#333"
 *   opacity={0.3}
 *   type="DOTS"
 * />
 *
 * @example
 * // Hidden grid (user preference)
 * <GridOverlay
 *   visibleBounds={viewport}
 *   gridSize={50}
 *   type="HIDDEN"
 * />
 *
 * @component
 */

import React from 'react';
import { Group, Line, Circle, RegularPolygon } from 'react-konva';
import { GridType } from '../../store/gameStore';
import { hexToPixel, pixelToHex } from '../../utils/gridGeometry';

const MAX_DOTS_THRESHOLD = 10000;
let hasWarnedAboutDensity = false;

interface GridOverlayProps {
  visibleBounds: { x: number; y: number; width: number; height: number };
  gridSize: number;
  stroke?: string;
  opacity?: number;
  type?: GridType;
}

const GridOverlay: React.FC<GridOverlayProps> = ({
  visibleBounds,
  gridSize,
  stroke = '#222',
  opacity = 0.5,
  type = 'LINES'
}) => {
  if (type === 'HIDDEN') return null;

  const elements = [];
  const { x, y, width, height } = visibleBounds || { x: 0, y: 0, width: 0, height: 0 };

  const startX = Math.floor(x / gridSize) * gridSize;
  const endX = Math.ceil((x + width) / gridSize) * gridSize;

  const startY = Math.floor(y / gridSize) * gridSize;
  const endY = Math.ceil((y + height) / gridSize) * gridSize;

  if (type === 'LINES') {
    // Vertical lines
    for (let ix = startX; ix <= endX; ix += gridSize) {
      elements.push(
        <Line
          key={`v-${ix}`}
          points={[ix, y, ix, y + height]}
          stroke={stroke}
          strokeWidth={1}
          opacity={opacity}
        />
      );
    }

    // Horizontal lines
    for (let iy = startY; iy <= endY; iy += gridSize) {
      elements.push(
        <Line
          key={`h-${iy}`}
          points={[x, iy, x + width, iy]}
          stroke={stroke}
          strokeWidth={1}
          opacity={opacity}
        />
      );
    }
  } else if (type === 'DOTS') {
    // ... DOTS implementation (abbreviated/preserved) ...
    const dotsX = Math.ceil((endX - startX) / gridSize) + 1;
    const dotsY = Math.ceil((endY - startY) / gridSize) + 1;
    const totalDots = dotsX * dotsY;

    if (totalDots > MAX_DOTS_THRESHOLD) {
      const minMultiplier = Math.ceil(Math.sqrt(totalDots / MAX_DOTS_THRESHOLD));
      const powerOf2Multiplier = Math.pow(2, Math.ceil(Math.log2(minMultiplier)));
      const step = gridSize * powerOf2Multiplier;
      if (!hasWarnedAboutDensity) {
        console.warn(`Grid too dense for DOTS mode, rendering subset with step size ${step}px`);
        hasWarnedAboutDensity = true;
      }
      for (let ix = startX; ix <= endX; ix += step) {
        for (let iy = startY; iy <= endY; iy += step) {
          elements.push(
            <Circle
              key={`dot-${ix}-${iy}`}
              x={ix}
              y={iy}
              radius={2}
              fill={stroke}
              opacity={opacity}
            />
          );
        }
      }
    } else {
      hasWarnedAboutDensity = false;
      for (let ix = startX; ix <= endX; ix += gridSize) {
        for (let iy = startY; iy <= endY; iy += gridSize) {
          elements.push(
            <Circle
              key={`dot-${ix}-${iy}`}
              x={ix}
              y={iy}
              radius={2}
              fill={stroke}
              opacity={opacity}
            />
          );
        }
      }
    }
  } else if (type === 'HEX_H' || type === 'HEX_V') {
    // Hexagonal Grid
    // Radius of hex
    // For Flat Top (HEX_H): Width = 2*size, Height = sqrt(3)*size, Spacing H = 1.5*size, Spacing V = sqrt(3)*size
    // For Pointy Top (HEX_V): Width = sqrt(3)*size, Height = 2*size, Spacing H = sqrt(3)*size, Spacing V = 1.5*size
    // gridSize usually defines the "short diagonal" (flat-to-flat).

    // We used: radius = gridSize / Math.sqrt(3).
    // HEX_V (Pointy): Width = sqrt(3)*size = gridSize. Correct.
    // HEX_H (Flat): Height = sqrt(3)*size = gridSize. Correct.

    const radius = gridSize / Math.sqrt(3);
    const orientation = type === 'HEX_V' ? 'POINTY' : 'FLAT';

    // Calculate bounds in axial coords (q, r) using all 4 corners to ensure coverage
    const tl = pixelToHex(x, y, radius, orientation);
    const tr = pixelToHex(x + width, y, radius, orientation);
    const bl = pixelToHex(x, y + height, radius, orientation);
    const br = pixelToHex(x + width, y + height, radius, orientation);

    const minQ = Math.floor(Math.min(tl.q, tr.q, bl.q, br.q)) - 1;
    const maxQ = Math.ceil(Math.max(tl.q, tr.q, bl.q, br.q)) + 1;
    const minR = Math.floor(Math.min(tl.r, tr.r, bl.r, br.r)) - 1;
    const maxR = Math.ceil(Math.max(tl.r, tr.r, bl.r, br.r)) + 1;

    // Limit iteration to prevent freezing if bounds are huge
    if ((maxQ - minQ) * (maxR - minR) < 20000) {
       for (let q = minQ; q <= maxQ; q++) {
        for (let r = minR; r <= maxR; r++) {
             const px = hexToPixel(q, r, radius, orientation);

             // Culling check: skip if outside viewport + toggle
             // Add buffer of 1 grid size
             if (px.x < x - gridSize || px.x > x + width + gridSize ||
                 px.y < y - gridSize || px.y > y + height + gridSize) {
                continue;
             }

             elements.push(
                <RegularPolygon
                   key={`hex-${q}-${r}`}
                   x={px.x}
                   y={px.y}
                   sides={6}
                   radius={radius}
                   stroke={stroke}
                   strokeWidth={1}
                   opacity={opacity}
                   rotation={orientation === 'POINTY' ? 0 : 30}
                />
             );
        }
       }
    }
  } else if (type === 'ISO_H' || type === 'ISO_V') {
      // Isometric Grid (Projected Square Grid)
      // Draw diagonal lines
      // Isometric grid is rotated 45 degrees and scaled.
      // Usually represented as a diamond grid.
      // Lines: y = x/2 + offset, y = -x/2 + offset (approx)

      const isoWidth = gridSize * 2;
      const isoHeight = gridSize;

      // We need to draw the diagonals.
      // Line equation: Y = (1/2)X + C  and Y = -(1/2)X + C
      // We iterate C to cover the Viewport.

      // Map Viewport corners to determine range of C
      // ... complex math.

      // Simpler: Draw individual tiles (Diamonds) -> Polygon 4 sides.
      // OR: transform a normal grid? No, context transform is messy for overlay.

      // Render individual diamonds (inefficient?)
      // Viewport culling matches Square grid but rotated.

      // Let's use the iteration logic from square grid but transform points.
      // Or just draw many diagonal lines.

      // This is hard to cull efficiently without good math.
      // Let's brute force "enough lines" around the center? No.

      // Iterate "grid coordinates" (row/col) and draw diamonds.
      // ISO_H: Width = 2 * Height.
      const tileHalfW = isoWidth / 2;
      const tileHalfH = isoHeight / 2;

      // Estimate grid indices roughly
      const minCol = Math.floor((x / tileHalfW + y / tileHalfH) / 2) - 1;
      const maxCol = Math.ceil(((x + width) / tileHalfW + (y+height) / tileHalfH) / 2) + 1;

      const minRow = Math.floor((y / tileHalfH - (x+width) / tileHalfW) / 2) - 1;
      const maxRow = Math.ceil(((y+height) / tileHalfH - x / tileHalfW) / 2) + 1;

      if ((maxCol - minCol) * (maxRow - minRow) < 10000) {
          for (let col = minCol; col <= maxCol; col++) {
             for (let row = minRow; row <= maxRow; row++) {
                // Center of iso tile
                const cx = (col - row) * tileHalfW;
                const cy = (col + row) * tileHalfH;

                 // Culling
                 if (cx < x - isoWidth || cx > x + width + isoWidth ||
                     cy < y - isoHeight || cy > y + height + isoHeight) {
                    continue;
                 }

                elements.push(
                     <Line
                        key={`iso-${col}-${row}`}
                        points={[
                            cx, cy - tileHalfH, // Top
                            cx + tileHalfW, cy, // Right
                            cx, cy + tileHalfH, // Bottom
                            cx - tileHalfW, cy, // Left
                            cx, cy - tileHalfH  // Close loop
                        ]}
                        stroke={stroke}
                        strokeWidth={1}
                        opacity={opacity}
                     />
                );
             }
          }
      }
  }

  return <Group listening={false}>{elements}</Group>;
};

export default GridOverlay;
