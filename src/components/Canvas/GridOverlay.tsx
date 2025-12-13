import React from 'react';
import { Group, Line } from 'react-konva';

interface GridOverlayProps {
  width: number;
  height: number;
  gridSize: number;
  stroke?: string;
  opacity?: number;
}

const GridOverlay: React.FC<GridOverlayProps> = ({
  width,
  height,
  gridSize,
  stroke = '#222',
  opacity = 0.5
}) => {
  const lines = [];

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke={stroke}
        strokeWidth={1}
        opacity={opacity}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke={stroke}
        strokeWidth={1}
        opacity={opacity}
      />
    );
  }

  return <Group listening={false}>{lines}</Group>;
};

export default GridOverlay;
