import { Layer, Rect, Shape } from 'react-konva';
import { Token, Drawing } from '../../store/gameStore';

interface FogOfWarLayerProps {
  tokens: Token[];
  drawings: Drawing[];
  gridSize: number;
  visibleBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface Point {
  x: number;
  y: number;
}

interface WallSegment {
  start: Point;
  end: Point;
}

/**
 * FogOfWarLayer renders dynamic vision/lighting for PC tokens
 *
 * Uses raycasting to calculate visibility polygons for each PC token,
 * accounting for walls that block line of sight. The fog starts as
 * opaque black and "cuts out" visible areas using destination-out blending.
 *
 * **Algorithm: 360-degree Raycasting**
 * 1. For each PC token with visionRadius > 0:
 *    - Cast rays at 1-degree intervals (360 rays)
 *    - Each ray extends to visionRadius or until it hits a wall
 *    - Wall collision detection uses line segment intersection
 * 2. Connect ray endpoints to form visibility polygon
 * 3. Render polygon with destination-out to "erase" fog
 *
 * **Performance:**
 * - O(360 × walls.length) per PC token
 * - Typically < 5ms for 10 walls, 3 PC tokens
 *
 * @param tokens - All tokens (only PC tokens with visionRadius emit light)
 * @param drawings - All drawings (walls block vision)
 * @param gridSize - Grid cell size for converting feet to pixels
 * @param visibleBounds - Canvas viewport for culling fog rendering
 */
const FogOfWarLayer = ({ tokens, drawings, gridSize, visibleBounds }: FogOfWarLayerProps) => {
  // Extract PC tokens with vision
  const pcTokens = tokens.filter(
    (t) => t.type === 'PC' && (t.visionRadius ?? 0) > 0
  );

  // Extract walls from drawings
  const walls: WallSegment[] = [];
  drawings
    .filter((d) => d.tool === 'wall')
    .forEach((wall) => {
      // Convert points array [x1, y1, x2, y2, x3, y3, ...] to segments
      const points = wall.points;
      for (let i = 0; i < points.length - 2; i += 2) {
        walls.push({
          start: { x: points[i], y: points[i + 1] },
          end: { x: points[i + 2], y: points[i + 3] },
        });
      }
    });

  // If no PC tokens or all have 0 vision, show full fog
  if (pcTokens.length === 0) {
    return (
      <Layer listening={false}>
        <Rect
          x={visibleBounds.x}
          y={visibleBounds.y}
          width={visibleBounds.width}
          height={visibleBounds.height}
          fill="black"
          opacity={0.9}
        />
      </Layer>
    );
  }

  return (
    <Layer listening={false}>
      {/* Full black fog */}
      <Rect
        x={visibleBounds.x}
        y={visibleBounds.y}
        width={visibleBounds.width}
        height={visibleBounds.height}
        fill="black"
        opacity={0.9}
      />

      {/* Cut out visible areas for each PC */}
      {pcTokens.map((token) => {
        const tokenCenterX = token.x + (gridSize * token.scale) / 2;
        const tokenCenterY = token.y + (gridSize * token.scale) / 2;
        const visionRadiusPx = ((token.visionRadius ?? 60) / 5) * gridSize; // Convert feet to pixels

        // Calculate visibility polygon
        const visibilityPolygon = calculateVisibilityPolygon(
          tokenCenterX,
          tokenCenterY,
          visionRadiusPx,
          walls
        );

        return (
          <Shape
            key={`fog-cutout-${token.id}`}
            sceneFunc={(ctx, shape) => {
              if (visibilityPolygon.length === 0) return;

              ctx.beginPath();
              ctx.moveTo(visibilityPolygon[0].x, visibilityPolygon[0].y);
              for (let i = 1; i < visibilityPolygon.length; i++) {
                ctx.lineTo(visibilityPolygon[i].x, visibilityPolygon[i].y);
              }
              ctx.closePath();
              ctx.fillStrokeShape(shape);
            }}
            fill="black"
            globalCompositeOperation="destination-out"
          />
        );
      })}
    </Layer>
  );
};

/**
 * Calculates visibility polygon using 360-degree raycasting
 *
 * @param originX - Token center X
 * @param originY - Token center Y
 * @param maxRange - Vision radius in pixels
 * @param walls - Wall segments that block vision
 * @returns Array of points forming visibility polygon
 */
function calculateVisibilityPolygon(
  originX: number,
  originY: number,
  maxRange: number,
  walls: WallSegment[]
): Point[] {
  const polygon: Point[] = [];
  const rayCount = 360; // 1-degree resolution
  const angleStep = (Math.PI * 2) / rayCount;

  for (let i = 0; i < rayCount; i++) {
    const angle = i * angleStep;
    const rayEndpoint = castRay(originX, originY, angle, maxRange, walls);
    polygon.push(rayEndpoint);
  }

  return polygon;
}

/**
 * Casts a single ray and finds the closest intersection
 *
 * @param originX - Ray origin X
 * @param originY - Ray origin Y
 * @param angle - Ray angle in radians
 * @param maxRange - Maximum ray length
 * @param walls - Wall segments to test
 * @returns Endpoint of ray (either maxRange or wall intersection)
 */
function castRay(
  originX: number,
  originY: number,
  angle: number,
  maxRange: number,
  walls: WallSegment[]
): Point {
  const rayDirX = Math.cos(angle);
  const rayDirY = Math.sin(angle);
  const rayEndX = originX + rayDirX * maxRange;
  const rayEndY = originY + rayDirY * maxRange;

  let closestDistance = maxRange;
  let closestPoint: Point = { x: rayEndX, y: rayEndY };

  // Test intersection with each wall segment
  for (const wall of walls) {
    const intersection = lineSegmentIntersection(
      originX,
      originY,
      rayEndX,
      rayEndY,
      wall.start.x,
      wall.start.y,
      wall.end.x,
      wall.end.y
    );

    if (intersection) {
      const distance = Math.hypot(
        intersection.x - originX,
        intersection.y - originY
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = intersection;
      }
    }
  }

  return closestPoint;
}

/**
 * Line segment intersection algorithm
 *
 * Tests if line segment (x1,y1)-(x2,y2) intersects (x3,y3)-(x4,y4)
 * Returns intersection point or null if no intersection.
 *
 * @returns Intersection point or null
 */
function lineSegmentIntersection(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): Point | null {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  // Lines are parallel
  if (Math.abs(denom) < 1e-10) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  // Check if intersection is within both segments
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1),
    };
  }

  return null;
}

export default FogOfWarLayer;
