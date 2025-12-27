import type { Drawing } from '../store/gameStore';

/**
 * Room represents a rectangular room in the dungeon
 */
interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Point represents a 2D coordinate
 */
interface Point {
  x: number;
  y: number;
}

/**
 * DungeonGeneratorOptions configures dungeon generation parameters
 */
export interface DungeonGeneratorOptions {
  numRooms: number;
  minRoomSize?: number;
  maxRoomSize?: number;
  gridSize?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  wallColor?: string;
  wallSize?: number;
}

/**
 * DungeonGenerator creates procedural dungeon layouts using a simple
 * room-and-corridor algorithm. Generated dungeons are returned as Drawing
 * objects that can be added to the gameStore.
 */
export class DungeonGenerator {
  private options: Required<DungeonGeneratorOptions>;
  private rooms: Room[] = [];

  constructor(options: DungeonGeneratorOptions) {
    // Set defaults
    this.options = {
      numRooms: options.numRooms,
      minRoomSize: options.minRoomSize ?? 3,
      maxRoomSize: options.maxRoomSize ?? 8,
      gridSize: options.gridSize ?? 50,
      canvasWidth: options.canvasWidth ?? 1920,
      canvasHeight: options.canvasHeight ?? 1080,
      wallColor: options.wallColor ?? '#ff0000',
      wallSize: options.wallSize ?? 8,
    };
  }

  /**
   * Generates a dungeon and returns wall drawings
   */
  public generate(): Drawing[] {
    this.rooms = [];
    const drawings: Drawing[] = [];

    // Generate rooms using simple random placement with overlap checking
    for (let i = 0; i < this.options.numRooms; i++) {
      let attempts = 0;
      const maxAttempts = 50;

      while (attempts < maxAttempts) {
        const room = this.generateRandomRoom();

        if (this.rooms.length === 0 || !this.hasOverlap(room)) {
          this.rooms.push(room);
          break;
        }

        attempts++;
      }
    }

    // Sort rooms by center position for better corridor connections
    this.rooms.sort((a, b) => {
      const centerA = a.x + a.width / 2;
      const centerB = b.x + b.width / 2;
      return centerA - centerB;
    });

    // Draw room walls
    for (const room of this.rooms) {
      drawings.push(this.createRoomWalls(room));
    }

    // Connect rooms with corridors
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const corridorDrawings = this.createCorridor(
        this.getRoomCenter(this.rooms[i]),
        this.getRoomCenter(this.rooms[i + 1])
      );
      drawings.push(...corridorDrawings);
    }

    return drawings;
  }

  /**
   * Generates a random room with size constraints
   */
  private generateRandomRoom(): Room {
    const { minRoomSize, maxRoomSize, gridSize, canvasWidth, canvasHeight } = this.options;

    // Room size in grid cells
    const widthCells = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;
    const heightCells = Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1)) + minRoomSize;

    // Convert to pixels
    const width = widthCells * gridSize;
    const height = heightCells * gridSize;

    // Random position (snapped to grid)
    const maxX = Math.floor((canvasWidth - width) / gridSize);
    const maxY = Math.floor((canvasHeight - height) / gridSize);

    const x = Math.floor(Math.random() * maxX) * gridSize;
    const y = Math.floor(Math.random() * maxY) * gridSize;

    return { x, y, width, height };
  }

  /**
   * Checks if a room overlaps with existing rooms (with padding)
   */
  private hasOverlap(newRoom: Room): boolean {
    const padding = this.options.gridSize * 2; // 2 grid cells of padding

    for (const room of this.rooms) {
      if (
        newRoom.x < room.x + room.width + padding &&
        newRoom.x + newRoom.width > room.x - padding &&
        newRoom.y < room.y + room.height + padding &&
        newRoom.y + newRoom.height > room.y - padding
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Creates wall drawings for a rectangular room
   */
  private createRoomWalls(room: Room): Drawing {
    const { x, y, width, height } = room;
    const { wallColor, wallSize } = this.options;

    // Create a closed rectangle: top -> right -> bottom -> left -> back to start
    const points = [
      x, y, // Top-left
      x + width, y, // Top-right
      x + width, y + height, // Bottom-right
      x, y + height, // Bottom-left
      x, y, // Back to top-left (close the rectangle)
    ];

    return {
      id: crypto.randomUUID(),
      tool: 'wall',
      points,
      color: wallColor,
      size: wallSize,
    };
  }

  /**
   * Gets the center point of a room
   */
  private getRoomCenter(room: Room): Point {
    return {
      x: room.x + room.width / 2,
      y: room.y + room.height / 2,
    };
  }

  /**
   * Creates corridor walls connecting two points using L-shaped path
   */
  private createCorridor(start: Point, end: Point): Drawing[] {
    const { wallColor, wallSize, gridSize } = this.options;
    const corridorWidth = gridSize; // Corridor width matches grid size

    // Choose whether to go horizontal-first or vertical-first randomly
    const horizontalFirst = Math.random() > 0.5;

    const drawings: Drawing[] = [];

    if (horizontalFirst) {
      // Horizontal segment
      const hStart = { x: start.x, y: start.y - corridorWidth / 2 };
      const hEnd = { x: end.x, y: start.y - corridorWidth / 2 };

      // Top and bottom walls of horizontal corridor
      drawings.push({
        id: crypto.randomUUID(),
        tool: 'wall',
        points: [hStart.x, hStart.y, hEnd.x, hEnd.y],
        color: wallColor,
        size: wallSize,
      });

      drawings.push({
        id: crypto.randomUUID(),
        tool: 'wall',
        points: [
          hStart.x,
          hStart.y + corridorWidth,
          hEnd.x,
          hEnd.y + corridorWidth,
        ],
        color: wallColor,
        size: wallSize,
      });

      // Vertical segment
      const vStart = { x: end.x - corridorWidth / 2, y: start.y };
      const vEnd = { x: end.x - corridorWidth / 2, y: end.y };

      // Left and right walls of vertical corridor
      drawings.push({
        id: crypto.randomUUID(),
        tool: 'wall',
        points: [vStart.x, vStart.y, vEnd.x, vEnd.y],
        color: wallColor,
        size: wallSize,
      });

      drawings.push({
        id: crypto.randomUUID(),
        tool: 'wall',
        points: [
          vStart.x + corridorWidth,
          vStart.y,
          vEnd.x + corridorWidth,
          vEnd.y,
        ],
        color: wallColor,
        size: wallSize,
      });
    } else {
      // Vertical segment first
      const vStart = { x: start.x - corridorWidth / 2, y: start.y };
      const vEnd = { x: start.x - corridorWidth / 2, y: end.y };

      drawings.push({
        id: crypto.randomUUID(),
        tool: 'wall',
        points: [vStart.x, vStart.y, vEnd.x, vEnd.y],
        color: wallColor,
        size: wallSize,
      });

      drawings.push({
        id: crypto.randomUUID(),
        tool: 'wall',
        points: [
          vStart.x + corridorWidth,
          vStart.y,
          vEnd.x + corridorWidth,
          vEnd.y,
        ],
        color: wallColor,
        size: wallSize,
      });

      // Horizontal segment
      const hStart = { x: start.x, y: end.y - corridorWidth / 2 };
      const hEnd = { x: end.x, y: end.y - corridorWidth / 2 };

      drawings.push({
        id: crypto.randomUUID(),
        tool: 'wall',
        points: [hStart.x, hStart.y, hEnd.x, hEnd.y],
        color: wallColor,
        size: wallSize,
      });

      drawings.push({
        id: crypto.randomUUID(),
        tool: 'wall',
        points: [
          hStart.x,
          hStart.y + corridorWidth,
          hEnd.x,
          hEnd.y + corridorWidth,
        ],
        color: wallColor,
        size: wallSize,
      });
    }

    return drawings;
  }

  /**
   * Gets the generated rooms (useful for debugging or adding floor tiles)
   */
  public getRooms(): Room[] {
    return this.rooms;
  }
}
