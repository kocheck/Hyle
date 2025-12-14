import React from 'react';
import { Group, Line } from 'react-konva';

/**
 * Props for GridOverlay component
 *
 * @property width - Canvas width in pixels (determines grid extent)
 * @property height - Canvas height in pixels (determines grid extent)
 * @property gridSize - Size of each grid cell in pixels (e.g., 50 for 50x50 cells)
 * @property stroke - Optional line color (default: '#222' dark gray)
 * @property opacity - Optional line opacity 0-1 (default: 0.5 semi-transparent)
 */
interface GridOverlayProps {
  width: number;
  height: number;
  gridSize: number;
  stroke?: string;
  opacity?: number;
}

/**
 * GridOverlay renders the tactical grid background for the battlemap
 *
 * Generates vertical and horizontal lines at gridSize intervals to create a grid
 * overlay for the canvas. This grid helps DMs and players visualize movement and
 * positioning in tactical combat (e.g., 5-foot squares in D&D 5e).
 *
 * **Implementation details:**
 * - Creates one Konva Line component per grid line (can be many for large canvases)
 * - Uses `listening={false}` on Group to disable event handling (performance optimization)
 * - Grid lines are non-interactive (clicks pass through to tokens/canvas beneath)
 *
 * **Performance considerations:**
 * For large canvases (e.g., 4096x4096px at 50px grid = 6561 lines), this can create
 * many React components. Consider optimizations:
 * - Memoize component with React.memo()
 * - Use single Konva.Path instead of many Line components
 * - Implement viewport culling (only render visible grid lines)
 *
 * @param props - Grid configuration (size, dimensions, appearance)
 * @returns Konva Group containing all grid line components
 *
 * @example
 * // Standard 50px grid
 * <GridOverlay
 *   width={1920}
 *   height={1080}
 *   gridSize={50}
 * />
 *
 * @example
 * // Custom appearance (brighter, more opaque)
 * <GridOverlay
 *   width={size.width}
 *   height={size.height}
 *   gridSize={gridSize}
 *   stroke="#444"
 *   opacity={0.8}
 * />
 */
const GridOverlay: React.FC<GridOverlayProps> = ({
  width,
  height,
  gridSize,
  stroke = '#222',
  opacity = 0.5
}) => {
  const lines = [];

  // Generate vertical lines (every gridSize pixels along X axis)
  // Creates lines from top (y=0) to bottom (y=height)
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}  // Vertical line: (x, 0) to (x, height)
        stroke={stroke}
        strokeWidth={1}
        opacity={opacity}
      />
    );
  }

  // Generate horizontal lines (every gridSize pixels along Y axis)
  // Creates lines from left (x=0) to right (x=width)
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}  // Horizontal line: (0, y) to (width, y)
        stroke={stroke}
        strokeWidth={1}
        opacity={opacity}
      />
    );
  }

  // listening={false} disables event handling for performance
  // Grid is purely visual, clicks should pass through to tokens beneath
  return <Group listening={false}>{lines}</Group>;
};

export default GridOverlay;
