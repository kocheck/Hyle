/**
 * Grid Overlay Component with Viewport Culling
 *
 * Renders a grid overlay on the canvas with support for multiple grid geometries:
 * - Square (LINES/DOTS/HIDDEN modes)
 * - Hexagonal (flat-top and pointy-top)
 * - Isometric (horizontal and vertical)
 *
 * Implements viewport culling to only render grid elements within visible bounds.
 */

import React, { useMemo } from 'react';
import { Group, Line, Circle } from 'react-konva';
import { createGridGeometry } from '../../utils/gridGeometry';
import type { GridType } from '../../store/gameStore';

const MAX_DOTS_THRESHOLD = 10000;
let hasWarnedAboutDensity = false;

/**
 * Props for GridOverlay component
 */
interface GridOverlayProps {
  visibleBounds: { x: number; y: number; width: number; height: number };
  gridSize: number;
  stroke?: string;
  opacity?: number;
  type?: GridType;
  hoveredCell?: { q: number; r: number } | null;
}

/**
 * Helper to convert vertex points array to flat coordinate array for Konva Line
 */
const verticesToPoints = (vertices: Array<{ x: number; y: number }>): number[] => {
  const points: number[] = [];
  for (const v of vertices) {
    points.push(v.x, v.y);
  }
  return points;
};

/**
 * GridOverlay renders a grid on the canvas with viewport culling
 * Only renders grid elements within visible bounds for performance
 */
const GridOverlay: React.FC<GridOverlayProps> = ({
  visibleBounds,
  gridSize,
  stroke = '#222',
  opacity = 0.5,
  type = 'LINES',
  hoveredCell = null,
}) => {
  if (type === 'HIDDEN') return null;

  const { x, y, width, height } = visibleBounds || { x: 0, y: 0, width: 0, height: 0 };

  // Render DOTS mode (square grid only)
  const dotElements = useMemo(() => {
    if (type !== 'DOTS') return null;

    const elements = [];

    // Calculate start and end grid numbers based on visible bounds
    const startX = Math.floor(x / gridSize) * gridSize;
    const endX = Math.ceil((x + width) / gridSize) * gridSize;
    const startY = Math.floor(y / gridSize) * gridSize;
    const endY = Math.ceil((y + height) / gridSize) * gridSize;

    const dotsX = Math.ceil((endX - startX) / gridSize) + 1;
    const dotsY = Math.ceil((endY - startY) / gridSize) + 1;
    const totalDots = dotsX * dotsY;

    // If there would be too many dots, fall back to a simpler grid or skip
    if (totalDots > MAX_DOTS_THRESHOLD) {
      const minMultiplier = Math.ceil(Math.sqrt(totalDots / MAX_DOTS_THRESHOLD));
      const powerOf2Multiplier = Math.pow(2, Math.ceil(Math.log2(minMultiplier)));
      const step = gridSize * powerOf2Multiplier;
      if (!hasWarnedAboutDensity) {
        console.warn(
          `Grid too dense for DOTS mode (${totalDots} dots > ${MAX_DOTS_THRESHOLD}), rendering subset with step size ${step}px (multiplier: ${powerOf2Multiplier})`,
        );
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
            />,
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
            />,
          );
        }
      }
    }

    return elements;
  }, [type, x, y, width, height, gridSize, stroke, opacity]);

  // Render LINES mode (square grid only - legacy performance optimization)
  const squareLineElements = useMemo(() => {
    if (type !== 'LINES') return null;

    const elements = [];

    // Calculate start and end grid numbers based on visible bounds
    const startX = Math.floor(x / gridSize) * gridSize;
    const endX = Math.ceil((x + width) / gridSize) * gridSize;
    const startY = Math.floor(y / gridSize) * gridSize;
    const endY = Math.ceil((y + height) / gridSize) * gridSize;

    // Vertical lines
    for (let ix = startX; ix <= endX; ix += gridSize) {
      elements.push(
        <Line
          key={`v-${ix}`}
          points={[ix, y, ix, y + height]} // Draw from top of view to bottom
          stroke={stroke}
          strokeWidth={1}
          opacity={opacity}
        />,
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
        />,
      );
    }

    return elements;
  }, [type, x, y, width, height, gridSize, stroke, opacity]);

  // Render HEXAGONAL or ISOMETRIC grids using geometry abstraction
  // Consolidates render logic for all complex grid types
  const geometryElements = useMemo(() => {
    // Check if it's one of our complex types
    if ((type as string) === 'LINES' || (type as string) === 'DOTS' || (type as string) === 'HIDDEN') return null;

    const geometry = createGridGeometry(type);
    const visibleCells = geometry.getVisibleCells({ x, y, width, height }, gridSize);

    return visibleCells.map((cell) => {
      const vertices = geometry.getCellVertices(cell, gridSize);
      const points = verticesToPoints(vertices);

      return (
        <Line
          key={`cell-${cell.q}-${cell.r}`}
          points={points}
          stroke={stroke}
          strokeWidth={1}
          opacity={opacity}
          closed={true}
        />
      );
    });
  }, [type, x, y, width, height, gridSize, stroke, opacity]);

  // Render hover highlight for hovered cell
  const hoverHighlight = useMemo(() => {
    // DOTS mode deliberately skips hover highlight to avoid extra per-frame geometry work
    if (!hoveredCell || type === 'DOTS') return null;

    const geometry = createGridGeometry(type);
    const vertices = geometry.getCellVertices(hoveredCell, gridSize);
    const points = verticesToPoints(vertices);

    return (
      <Line
        key="hover-highlight"
        points={points}
        fill="rgba(255, 255, 255, 0.1)"
        stroke="rgba(255, 255, 255, 0.5)"
        strokeWidth={2}
        opacity={1}
        closed={true}
      />
    );
  }, [hoveredCell, type, gridSize]);

  return (
    <Group listening={false}>
      {squareLineElements}
      {dotElements}
      {geometryElements}
      {hoverHighlight}
    </Group>
  );
};

export default GridOverlay;
