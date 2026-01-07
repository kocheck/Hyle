/**
 * Geometric helper functions for different grid types.
 * Supports Square (Lines/Dots), Hexagonal (Horizontal/Vertical), and Isometric grids.
 */

interface Point {
  x: number;
  y: number;
}

/**
 * Converts axial hex coordinates (q, r) to pixel coordinates (x, y)
 * Size is the radius of the hex (distance from center to corner)
 */
export const hexToPixel = (q: number, r: number, size: number, orientation: 'FLAT' | 'POINTY'): Point => {
  if (orientation === 'POINTY') {
    // Pointy top (HEX_V)
    const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
    const y = size * ((3 / 2) * r);
    return { x, y };
  } else {
    // Flat top (HEX_H)
    const x = size * ((3 / 2) * q);
    const y = size * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
    return { x, y };
  }
};

/**
 * Converts pixel coordinates (x, y) to fractional axial hex coordinates (q, r)
 */
export const pixelToHex = (x: number, y: number, size: number, orientation: 'FLAT' | 'POINTY'): { q: number; r: number } => {
  if (orientation === 'POINTY') {
    const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size;
    const r = ((2 / 3) * y) / size;
    return { q, r };
  } else {
    const q = ((2 / 3) * x) / size;
    const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / size;
    return { q, r };
  }
};

/**
 * Rounds fractional hex coordinates to the nearest integer hex coordinates
 */
export const hexRound = (q: number, r: number): { q: number; r: number } => {
  let s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  const q_diff = Math.abs(rq - q);
  const r_diff = Math.abs(rr - r);
  const s_diff = Math.abs(rs - s);

  if (q_diff > r_diff && q_diff > s_diff) {
    rq = -rr - rs;
  } else if (r_diff > s_diff) {
    rr = -rq - rs;
  } else {
    rs = -rq - rr;
  }

  return { q: rq, r: rr };
};

/**
 * Snaps a point to the nearest center of a hex cell
 */
export const snapToHexGrid = (x: number, y: number, gridSize: number, orientation: 'FLAT' | 'POINTY'): Point => {
  // gridSize in UI usually represents the "width" or "height" of the cell.
  // For Hex conversions, 'size' is usually outer radius.
  // If gridSize = "width" (flat-to-flat), then:
  // Pointy: width = sqrt(3) * size => size = gridSize / sqrt(3)
  // Flat: height = sqrt(3) * size => size = gridSize / sqrt(3)
  // Let's assume gridSize matches the cell "step" in the primary axis.

  // Standard approximation: size = gridSize / Math.sqrt(3) usually for width matching
  // Or size = gridSize / 2 if gridSize is "Height" (corner to corner)
  // Let's use gridSize as the MAJOR diameter (corner to corner) ??
  // No, usually gridSize = 50px implies 5 ft.
  // In foundry/roll20, 50px is the cell WIDTH (flat to flat) or HEIGHT (flat to flat).

  // Let's assume gridSize = distance between centers roughly?
  // Let's treat gridSize as the "outer radius" for simplicty, or derive radius.
  // If we assume gridSize is the "short diagonal" (flat to flat distance):
  // R = gridSize / sqrt(3)
  // Let's stick with R = gridSize / 1.732 for now to match typical visual sizing.

  const radius = gridSize / Math.sqrt(3);

  const frac = pixelToHex(x, y, radius, orientation);
  const rounded = hexRound(frac.q, frac.r);
  return hexToPixel(rounded.q, rounded.r, radius, orientation);
};


/**
 * Snaps a point to an Isometric grid
 * Isometric is essentially a grid rotated 45 deg and squashed (2:1 usually).
 */
export const snapToIsoGrid = (x: number, y: number, gridSize: number): Point => {
  // Iso grid standard: 2:1 ratio.
  // Tile width = gridSize * 2 ??? No, typically Iso tiles are 2x Width of Height.
  // Let's assume gridSize is the generic "size" (like cell height).

  // Coordinate transform to standard grid:
  // isoX = (cartX - cartY)
  // isoY = (cartX + cartY) / 2
  // ... this is complicated map logic.

  // Simpler approach:
  // Projected Iso Grid.
  // Cell Width = gridSize * 2
  // Cell Height = gridSize

  const tileWidth = gridSize * 2;
  const tileHeight = gridSize;

  // Convert to grid coords
  const isoX = y / tileHeight + x / tileWidth;
  const isoY = y / tileHeight - x / tileWidth;

  const gridX = Math.round(isoX);
  const gridY = Math.round(isoY);

  // Convert back
  const snapX = (gridX - gridY) * (tileWidth / 2);
  const snapY = (gridX + gridY) * (tileHeight / 2);

  return { x: snapX, y: snapY };
};
