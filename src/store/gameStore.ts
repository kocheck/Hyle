import { create } from 'zustand';

/**
 * Token represents a character, creature, or object on the battlemap
 *
 * Tokens are draggable images that snap to the grid. They represent player
 * characters, NPCs, monsters, or environmental objects in the tactical combat space.
 *
 * @property id - Unique identifier (generated with crypto.randomUUID())
 * @property x - X coordinate in pixels, grid-snapped (e.g., 0, 50, 100, 150...)
 * @property y - Y coordinate in pixels, grid-snapped (e.g., 0, 50, 100, 150...)
 * @property src - Image URL (file:// for uploaded assets, https:// for library tokens)
 * @property scale - Size multiplier for grid cells (1 = 1x1 cell, 2 = 2x2 cells for Large creatures)
 *
 * @example
 * const goblinToken: Token = {
 *   id: crypto.randomUUID(),
 *   x: 150,  // Grid-snapped to cell (gridSize = 50)
 *   y: 100,  // Grid-snapped to cell
 *   src: 'file:///Users/.../temp_assets/goblin.webp',
 *   scale: 1  // Medium creature (1x1 grid cell)
 * };
 *
 * @example
 * // Large creature (2x2 grid cells)
 * const dragonToken: Token = {
 *   id: crypto.randomUUID(),
 *   x: 200,
 *   y: 200,
 *   src: 'file:///Users/.../temp_assets/dragon.webp',
 *   scale: 2  // Occupies 2x2 grid cells
 * };
 */
export interface Token {
  id: string;
  x: number;
  y: number;
  src: string;
  scale: number;
}

/**
 * Drawing represents a freehand stroke drawn with marker or eraser tool
 *
 * Drawings are used for temporary markings on the battlemap (spell effect areas,
 * hazard zones, movement paths, etc.). They are synchronized in real-time to the
 * World View (player-facing projector display).
 *
 * @property id - Unique identifier (generated with crypto.randomUUID())
 * @property tool - Tool used to create this drawing ('marker' or 'eraser')
 * @property points - Flat array of coordinates [x1, y1, x2, y2, x3, y3, ...]
 * @property color - Hex color code (e.g., '#df4b26' for marker, '#000000' for eraser)
 * @property size - Stroke width in pixels (5 for marker, 20 for eraser)
 *
 * @example
 * const markerStroke: Drawing = {
 *   id: crypto.randomUUID(),
 *   tool: 'marker',
 *   points: [100, 100, 105, 102, 110, 105, ...],  // Stroke path
 *   color: '#df4b26',  // Red marker
 *   size: 5  // Thin stroke
 * };
 *
 * @example
 * const eraserStroke: Drawing = {
 *   id: crypto.randomUUID(),
 *   tool: 'eraser',
 *   points: [200, 200, 210, 210, ...],
 *   color: '#000000',  // Black (rendered with destination-out composite)
 *   size: 20  // Thick eraser
 * };
 */
export interface Drawing {
  id: string;
  tool: 'marker' | 'eraser';
  points: number[];
  color: string;
  size: number;
}

/**
 * GameState is the central state interface for the Hyle application
 *
 * This interface defines all game data (tokens, drawings, settings) and actions
 * to mutate that data. State is managed via Zustand and synced between the
 * Architect View (DM control) and World View (player projector) via IPC.
 *
 * **Critical pattern**: Main Window is the source of truth. World Window receives
 * updates via IPC but never modifies state itself (read-only display).
 *
 * @property tokens - Array of all tokens on the battlemap
 * @property drawings - Array of all marker/eraser strokes
 * @property gridSize - Size of grid cells in pixels (default: 50)
 * @property addToken - Adds a new token to the battlemap
 * @property updateTokenPosition - Updates x/y coordinates of existing token
 * @property addDrawing - Adds a new drawing stroke to the battlemap
 * @property setGridSize - Changes grid cell size (affects token snapping)
 * @property setState - Bulk state update (used for load/sync operations)
 * @property setTokens - Replaces entire tokens array (used for load operations)
 */
export interface GameState {
  tokens: Token[];
  drawings: Drawing[];
  gridSize: number;
  addToken: (token: Token) => void;
  updateTokenPosition: (id: string, x: number, y: number) => void;
  addDrawing: (drawing: Drawing) => void;
  setGridSize: (size: number) => void;
  setState: (state: GameState) => void;
  setTokens: (tokens: Token[]) => void;
}

/**
 * Zustand store hook for global game state
 *
 * This is the single source of truth for all game data in Hyle. State is shared
 * between components via this hook and synchronized to the World View via IPC.
 *
 * **Access patterns:**
 *
 * 1. **Component rendering** (triggers re-render on change):
 *    ```typescript
 *    const tokens = useGameStore((state) => state.tokens);
 *    ```
 *
 * 2. **Event handlers** (no re-render, just call action):
 *    ```typescript
 *    const handleClick = () => {
 *      const { addToken } = useGameStore.getState();
 *      addToken(newToken);
 *    };
 *    ```
 *
 * 3. **Bulk updates** (loading campaigns, receiving IPC sync):
 *    ```typescript
 *    useGameStore.setState({ tokens: [...], drawings: [...], gridSize: 50 });
 *    ```
 *
 * 4. **Subscriptions** (side effects like IPC sync):
 *    ```typescript
 *    useEffect(() => {
 *      const unsub = useGameStore.subscribe((state) => {
 *        window.ipcRenderer.send('SYNC_WORLD_STATE', state);
 *      });
 *      return unsub;
 *    }, []);
 *    ```
 *
 * **Critical rules:**
 * - NEVER mutate state directly: `state.tokens.push(...)` ❌
 * - ALWAYS use actions: `addToken(...)` ✅
 * - ALWAYS create new array/object references in actions
 *
 * @example
 * // Add a new token
 * const { addToken } = useGameStore();
 * addToken({
 *   id: crypto.randomUUID(),
 *   x: 100,
 *   y: 100,
 *   src: 'file:///path/to/token.webp',
 *   scale: 1
 * });
 *
 * @example
 * // Subscribe to all state changes
 * useEffect(() => {
 *   const unsubscribe = useGameStore.subscribe((state) => {
 *     console.log('State changed:', state);
 *   });
 *   return unsubscribe;  // Cleanup
 * }, []);
 */
export const useGameStore = create<GameState>((set) => ({
  // Initial state
  tokens: [],
  drawings: [],
  gridSize: 50,  // Default grid cell size in pixels

  // Actions (all use immutable updates)

  /**
   * Adds a new token to the battlemap
   * Creates new tokens array to trigger re-renders and subscriptions
   */
  addToken: (token) => set((state) => ({ tokens: [...state.tokens, token] })),

  /**
   * Updates the position of an existing token
   * Used when tokens are dragged to new grid positions
   */
  updateTokenPosition: (id, x, y) => set((state) => ({
    tokens: state.tokens.map((t) => t.id === id ? { ...t, x, y } : t)
  })),

  /**
   * Adds a new drawing stroke to the battlemap
   * Committed when mouse is released (not during drag for performance)
   */
  addDrawing: (drawing) => set((state) => ({ drawings: [...state.drawings, drawing] })),

  /**
   * Changes the grid cell size
   * Affects token snapping and grid overlay rendering
   */
  setGridSize: (size) => set({ gridSize: size }),

  /**
   * Replaces the entire tokens array
   * Used when loading campaigns or applying bulk changes
   */
  setTokens: (tokens) => set({ tokens }),

  /**
   * Generic bulk state update
   * Used for loading campaigns and receiving IPC sync from Main Window
   */
  setState: (state) => set(state),
}));
