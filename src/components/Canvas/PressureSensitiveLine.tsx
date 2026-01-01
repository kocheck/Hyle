import { useEffect, useRef } from 'react';
import { Shape } from 'react-konva';
import Konva from 'konva';

interface PressureSensitiveLineProps {
  id?: string;
  name?: string;
  points: number[]; // [x1, y1, x2, y2, ...]
  pressures?: number[]; // [p1, p2, p3, ...] Optional pressure values (0.0-1.0)
  stroke: string;
  strokeWidth: number; // Base stroke width (multiplied by pressure)
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  globalCompositeOperation?: string;
  opacity?: number;
  listening?: boolean;
  scale?: { x: number; y: number };
  x?: number;
  y?: number;
}

/**
 * PressureSensitiveLine - Renders variable-width strokes based on pointer pressure
 *
 * This component renders a smooth, pressure-sensitive line by interpolating
 * stroke width between points based on pressure values. If no pressure data
 * is provided, it falls back to a constant-width line.
 *
 * Implementation:
 * - Uses Konva's Shape with custom sceneFunc for variable-width rendering
 * - Draws multiple quadratic curves with varying stroke widths
 * - Smoothly interpolates between pressure values for natural strokes
 */
const PressureSensitiveLine = ({
  id,
  name,
  points,
  pressures,
  stroke,
  strokeWidth,
  lineCap = 'round',
  lineJoin = 'round',
  globalCompositeOperation,
  opacity,
  listening = false,
  scale,
  x,
  y,
}: PressureSensitiveLineProps) => {
  const shapeRef = useRef<Konva.Shape>(null);

  // Custom rendering function for variable-width strokes
  const sceneFunc = (context: Konva.Context, shape: Konva.Shape) => {
    if (points.length < 4) return; // Need at least 2 points

    context.beginPath();
    context.moveTo(points[0], points[1]);

    // If no pressure data, render as regular line
    if (!pressures || pressures.length === 0) {
      for (let i = 2; i < points.length; i += 2) {
        context.lineTo(points[i], points[i + 1]);
      }
      context.strokeShape(shape);
      return;
    }

    // Render pressure-sensitive line with variable width
    // We'll draw multiple segments with different stroke widths
    const numPoints = points.length / 2;

    for (let i = 1; i < numPoints; i++) {
      const x1 = points[(i - 1) * 2];
      const y1 = points[(i - 1) * 2 + 1];
      const x2 = points[i * 2];
      const y2 = points[i * 2 + 1];

      const pressure1 = pressures[i - 1] || 0.5;
      const pressure2 = pressures[i] || 0.5;

      // Calculate average pressure for this segment
      const avgPressure = (pressure1 + pressure2) / 2;

      // Vary stroke width based on pressure (0.3x to 1.5x base width)
      const pressureMultiplier = 0.3 + avgPressure * 1.2;
      const segmentWidth = strokeWidth * pressureMultiplier;

      // Draw line segment with calculated width
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.lineWidth = segmentWidth;
      context.stroke();
    }
  };

  return (
    <Shape
      ref={shapeRef}
      id={id}
      name={name}
      sceneFunc={sceneFunc}
      stroke={stroke}
      strokeWidth={strokeWidth}
      lineCap={lineCap}
      lineJoin={lineJoin}
      globalCompositeOperation={globalCompositeOperation}
      opacity={opacity}
      listening={listening}
      scale={scale}
      x={x}
      y={y}
    />
  );
};

export default PressureSensitiveLine;
