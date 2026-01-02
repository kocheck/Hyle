// 1. External imports (React and core libraries)
import { useEffect, useState, useRef, useMemo } from 'react';

// 2. Third-party UI libraries
import { Stage, Layer, Rect, Line, Shape, Text } from 'react-konva';

// 3. Utilities (relative paths)
import { DungeonGenerator } from '../../utils/DungeonGenerator';
import { isNearDoor } from '../../utils/collisionDetection';

// 4. Stores
import { useGameStore } from '../../store/gameStore';
import type { Drawing, Door } from '../../store/gameStore';

// 5. Components
import PaperNoiseOverlay from '../Canvas/PaperNoiseOverlay';
import FogOfWarLayer from '../Canvas/FogOfWarLayer';
import GridOverlay from '../Canvas/GridOverlay';
// Import DoorLayer for usage
import DoorLayer from '../Canvas/DoorLayer';

// 6. Types
import type { ResolvedTokenData } from '../../hooks/useTokenData';

interface DungeonBackgroundCanvasProps {
  width: number;
  height: number;
  tokens: ResolvedTokenData[];
  children?: React.ReactNode;
  onDungeonGenerated?: (drawings: Drawing[], doors: Door[]) => void;
  onDoorStatesChange?: (doors: Door[]) => void;
}

/**
 * DungeonBackgroundCanvas - Renders dynamic dungeon with fog of war for landing page
 *
 * This component generates a randomized dungeon layout and applies fog of war
 * that reveals as demo tokens move around, showcasing Graphium's core features.
 *
 * Features:
 * - Random dungeon generation using DungeonGenerator
 * - Dynamic fog of war with exploration trail
 * - Performance optimized for smooth 60fps scrolling
 * - Fallback to simple layout if generation fails
 */
export function DungeonBackgroundCanvas({
  width,
  height,
  tokens,
  children,
  onDungeonGenerated,
  onDoorStatesChange
}: DungeonBackgroundCanvasProps) {
  const [dimensions, setDimensions] = useState({ width, height });
  const [dungeonDrawings, setDungeonDrawings] = useState<Drawing[]>([]);
  const [dungeonDoors, setDungeonDoors] = useState<Door[]>([]);
  const [generationFailed, setGenerationFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Grid configuration
  const gridSize = 50;

  const backgroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--app-bg-base')
    .trim() || '#1a1a1a';



  // Sync state with props when they change (e.g. initial window size detection)
  useEffect(() => {
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }
  }, [width, height]);

  // Update dimensions on resize (fallback)
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Only update if actually changed and valid
        if (rect.width > 0 && rect.height > 0 && (rect.width !== dimensions.width || rect.height !== dimensions.height)) {
          setDimensions({ width: rect.width, height: rect.height });
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [dimensions.width, dimensions.height]);

  // Generate dungeon on mount
  useEffect(() => {
    const generateDungeon = () => {
      try {
        console.log('[DungeonBackgroundCanvas] Generating dungeon...');
        const startTime = performance.now();

        // Create generator with moderate complexity for landing page
        const generator = new DungeonGenerator({
          numRooms: 8, // Moderate number - enough to show off, not cluttered
          minRoomSize: 3,
          maxRoomSize: 6, // Smaller rooms for tighter layout
          gridSize,
          canvasWidth: dimensions.width,
          canvasHeight: dimensions.height,
          wallColor: '#ff0000', // Red walls (classic D&D style)
          wallSize: 8,
        });

        const result = generator.generate();
        const generationTime = performance.now() - startTime;

        console.log('[DungeonBackgroundCanvas] Generation complete:', {
          drawings: result.drawings.length,
          doors: result.doors.length,
          generationTime: `${generationTime.toFixed(2)}ms`,
        });

        // Clear timeout on successful generation
        if (generationTimeoutRef.current) {
          clearTimeout(generationTimeoutRef.current);
          generationTimeoutRef.current = null;
        }

        setDungeonDrawings(result.drawings);
        setDungeonDoors(result.doors);
        setGenerationFailed(false);

        // Notify parent component
        onDungeonGenerated?.(result.drawings, result.doors);

      } catch (error) {
        console.error('[DungeonBackgroundCanvas] Generation failed:', error);
        // Clear timeout on error
        if (generationTimeoutRef.current) {
          clearTimeout(generationTimeoutRef.current);
          generationTimeoutRef.current = null;
        }
        setGenerationFailed(true);
      }
    };

    // Only generate if dimensions are valid
    if (dimensions.width > 0 && dimensions.height > 0) {
      // Clear any existing timeout from previous dimension changes
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }

      // Timeout fallback - if generation doesn't complete in 1000ms, use fallback
      generationTimeoutRef.current = setTimeout(() => {
        console.warn('[DungeonBackgroundCanvas] Generation timeout, using fallback');
        setGenerationFailed(true);
        generationTimeoutRef.current = null;
      }, 1000);

      generateDungeon();
    }

    return () => {
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
        generationTimeoutRef.current = null;
      }
    };
  }, [dimensions.width, dimensions.height, onDungeonGenerated]);

  // Fallback dungeon layout (simple cross pattern)
  const fallbackDrawings = useMemo(() => {
    if (!generationFailed) return [];

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const roomSize = gridSize * 6;

    // Create a simple closed square room
    // Points array contains all coordinates in sequence to form a connected path
    const drawings: Drawing[] = [
      {
        id: 'fallback-wall-square',
        tool: 'wall',
        points: [
          // Top-left to top-right
          centerX - roomSize, centerY - roomSize,
          // Top-right to bottom-right
          centerX + roomSize, centerY - roomSize,
          // Bottom-right to bottom-left
          centerX + roomSize, centerY + roomSize,
          // Bottom-left back to top-left (close the square)
          centerX - roomSize, centerY + roomSize,
          centerX - roomSize, centerY - roomSize,
        ],
        color: '#ff0000',
        size: 8,
      },
    ];

    return drawings;
  }, [generationFailed, dimensions.width, dimensions.height, gridSize]);

  // Use fallback if generation failed, otherwise use generated dungeon
  const activeDrawings = generationFailed ? fallbackDrawings : dungeonDrawings;
  const [activeDoors, setActiveDoors] = useState<Door[]>([]);

  // Update active doors when dungeon doors change
  useEffect(() => {
    setActiveDoors(generationFailed ? [] : dungeonDoors);
  }, [generationFailed, dungeonDoors]);

  // Door opening mechanic - open doors when tokens get near
  useEffect(() => {
    if (tokens.length === 0) return;

    const interactionRange = gridSize * 1.5; // 1.5 grid cells

    setActiveDoors((prevDoors) => {
      if (prevDoors.length === 0) return prevDoors;

      let doorsChanged = false;
      const updatedDoors = prevDoors.map((door) => {
        // Skip if already open
        if (door.isOpen) return door;

        // Check if any token is near this door
        const nearbyToken = tokens.some((token) => {
          // Token positioning model: token.x/y is top-left corner
          // Token size in pixels: gridSize * token.scale
          // Token center: top-left + (size / 2)
          const tokenCenterX = token.x + (gridSize * token.scale) / 2;
          const tokenCenterY = token.y + (gridSize * token.scale) / 2;
          return isNearDoor(tokenCenterX, tokenCenterY, door, interactionRange);
        });

        if (nearbyToken) {
          console.log('[DungeonBackgroundCanvas] Opening door:', door.id);
          doorsChanged = true;
          return { ...door, isOpen: true };
        }

        return door;
      });

      if (doorsChanged) {
        onDoorStatesChange?.(updatedDoors);
        return updatedDoors;
      }

      return prevDoors;
    });
  }, [tokens, gridSize, onDoorStatesChange]);

  // Calculate visible bounds for fog of war
  const visibleBounds = {
    x: 0,
    y: 0,
    width: dimensions.width,
    height: dimensions.height,
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Only render stage if dimensions are valid to prevent Konva errors */}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Stage width={dimensions.width} height={dimensions.height}>
          {/* Single Combined Layer - for proper fog of war compositing */}
          <Layer listening={false}>
            {/* Solid background color */}
            <Rect
              x={0}
              y={0}
              width={dimensions.width}
              height={dimensions.height}
              fill={backgroundColor}
            />

            {/* Grid Overlay - Consistent with Main App */}


            {/* Grid Overlay - Consistent with Main App */}
            <GridOverlay
              visibleBounds={visibleBounds}
              gridSize={gridSize}
              type="DOTS"
              stroke="#666666" // Visible grey
              opacity={0.5}
            />

            <PaperNoiseOverlay
              x={0}
              y={0}
              width={dimensions.width}
              height={dimensions.height}
              scaleX={1}
              scaleY={1}
              opacity={0.3}
            />

            {/* Dungeon Walls - Rendered as Lines for smooth curves and consistent style */}
            {activeDrawings.map((drawing) => {
              if (drawing.tool === 'wall') {
                return (
                  <Line
                    key={drawing.id}
                    points={drawing.points}
                    stroke={drawing.color}
                    strokeWidth={drawing.size}
                    tension={0.5}
                    lineCap="round"
                    dash={[10, 5]} // Standard wall dash pattern
                    listening={false}
                  />
                );
              }
              return null;
            })}

            {/* Dungeon Doors - Reusing main app component for consistent look */}
            <DoorLayer
              doors={activeDoors}
              isWorldView={true} // Non-interactive in background
            />

          </Layer>

          {/* Layer 2: Fog of War - Top Layer */}
          <Layer listening={false}>
            <FogOfWarLayer
              tokens={tokens}
              walls={activeDrawings}
              doors={activeDoors}
              gridSize={gridSize}
              visibleBounds={visibleBounds}
              map={null}
            />
          </Layer>

           {/* Token Layer - tokens always visible on top of fog */}
           {children && <Layer>{children}</Layer>}

            <Layer>
            <Text
                text={`DEBUG: Drawings: ${activeDrawings.length}, Doors: ${activeDoors.length}\nFirst Drawing Tool: ${activeDrawings[0]?.tool}\nFirst Drawing Points: ${activeDrawings[0]?.points?.slice(0, 4).join(', ')}`}
                x={20}
                y={20}
                fontSize={20}
                fill="red"
            />
            </Layer>
        </Stage>
      )}

    </div>
  );
}
