import React from 'react';

/**
 * Sidebar provides the asset library for pre-imported tokens
 *
 * Displays a collection of tokens that can be dragged onto the canvas. Unlike
 * file uploads (which trigger cropping UI), library tokens are pre-processed and
 * can be added directly to the battlemap by drag-and-drop.
 *
 * **Current state:** Minimal implementation with 2 hardcoded example tokens.
 *
 * **Drag-and-drop pattern:**
 * - Transfers JSON data via `e.dataTransfer.setData('application/json', ...)`
 * - Payload: `{ type: 'LIBRARY_TOKEN', src: 'https://...' }`
 * - CanvasManager.handleDrop() receives and processes the JSON data
 * - No cropping required (library tokens are pre-sized)
 * - No asset processing (already optimized)
 *
 * **Future enhancements:**
 * - Persistent library (saved separately from campaigns)
 * - Custom token upload to library
 * - Categories (Monsters, Heroes, Terrain, Items)
 * - Search and filter by name/tags
 * - Drag folder for bulk import
 * - Token metadata (size, tags, descriptions)
 *
 * **Why separate library from file uploads:**
 * - Library tokens are reusable across campaigns
 * - File uploads are campaign-specific (cropped for one-time use)
 * - Library can be shared with other DMs (export token packs)
 *
 * @returns Sidebar component with draggable token library
 *
 * @example
 * // In App.tsx (Architect View only)
 * {!isWorldView && <Sidebar />}
 *
 * @example
 * // Drag-and-drop workflow:
 * // 1. User drags token from Sidebar
 * // 2. handleDragStart() sets JSON data
 * // 3. User drops on CanvasManager
 * // 4. CanvasManager.handleDrop() reads JSON
 * // 5. Token added to canvas at drop position
 */
const Sidebar = () => {
    /**
     * Handles drag start event for library tokens
     *
     * Serializes token data to JSON and sets it on the drag event's dataTransfer
     * object. This data is read by CanvasManager.handleDrop() when the user drops
     * the token onto the canvas.
     *
     * **Data format:**
     * ```json
     * {
     *   "type": "LIBRARY_TOKEN",
     *   "src": "https://example.com/token.png"
     * }
     * ```
     *
     * **Why JSON over plain text:**
     * - Allows multiple data fields (type, src, future metadata)
     * - CanvasManager can distinguish library tokens from file uploads
     * - Extensible (can add tags, size, etc. without breaking changes)
     *
     * @param e - React drag event (provides dataTransfer API)
     * @param type - Data type identifier (always 'LIBRARY_TOKEN' currently)
     * @param src - Image URL for the token (http:// or https://)
     */
    const handleDragStart = (e: React.DragEvent, type: string, src: string) => {
        // Serialize token data to JSON and attach to drag event
        e.dataTransfer.setData('application/json', JSON.stringify({ type, src }));

        // Future: Set custom drag image
        // e.dataTransfer.setDragImage(imageElement, offsetX, offsetY);
    };

    return (
        <div className="w-64 bg-neutral-800 border-r border-neutral-700 flex flex-col p-4 z-10 shrink-0">
            <h2 className="text-xl font-bold mb-4">Library</h2>

            <div className="mb-4">
                <h3 className="text-sm text-neutral-400 mb-2 uppercase font-bold">Tokens</h3>

                {/* 2-column grid of draggable tokens */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Example token 1: Lion */}
                    <div
                        className="bg-neutral-700 w-full aspect-square rounded cursor-grab flex items-center justify-center hover:bg-neutral-600 transition"
                        draggable  // Enable HTML5 drag-and-drop
                        onDragStart={(e) => handleDragStart(e, 'LIBRARY_TOKEN', 'https://konvajs.org/assets/lion.png')}
                    >
                        🦁
                    </div>

                    {/* Example token 2: Alien */}
                    <div
                        className="bg-neutral-700 w-full aspect-square rounded cursor-grab flex items-center justify-center hover:bg-neutral-600 transition"
                        draggable  // Enable HTML5 drag-and-drop
                        onDragStart={(e) => handleDragStart(e, 'LIBRARY_TOKEN', 'https://konvajs.org/assets/yoda.jpg')}
                    >
                        👽
                    </div>
                </div>

                {/* Future: Add more token categories (Maps, Terrain, etc.) */}
            </div>
        </div>
    );
};

export default Sidebar;
