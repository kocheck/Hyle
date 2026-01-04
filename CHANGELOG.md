# Changelog

All notable changes to Graphium will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### Hexagonal and Isometric Grid Support
- **New Grid Types**: Added support for Hexagonal (flat-top) and Isometric grids alongside existing Square grids
  - Hexagonal grid uses axial coordinate system for efficient hex addressing
  - Isometric grid uses diamond-shaped cells with 45° rotation
  - All grid types maintain full backward compatibility

- **Grid Geometry Abstraction**: New modular architecture for grid types
  - `GridGeometry` interface for geometry-agnostic operations
  - `SquareGridGeometry`, `HexagonalGridGeometry`, `IsometricGridGeometry` implementations
  - Factory pattern via `createGridGeometry(gridType)` for extensibility

- **Smart Grid-Aware Snapping**:
  - Square grids: Odd-sized tokens snap to cell centers, even-sized snap to intersections
  - Hex/Iso grids: All tokens snap to cell centers (hex center or diamond center)
  - Updated `snapToGrid()` function with `gridType` parameter

- **UI Enhancements**:
  - Map Settings now shows "Square - Lines", "Square - Dots", "Hexagonal", "Isometric", "Hidden"
  - Grid calibration button disabled for non-square grids (with tooltip explanation)

- **Performance Optimizations**:
  - Pre-computed math constants (SQRT3) to avoid repeated calculations
  - Efficient viewport culling for all grid types
  - Minimal object allocations in hot paths (drag/snap operations)
  - DOTS mode remains square-grid only for optimal performance

- **Comprehensive Testing**:
  - 50+ unit tests for grid geometries
  - Coordinate conversion roundtrip tests
  - Performance tests for large viewports
  - Updated existing grid tests with explicit `gridType` parameter

### Changed

- **Grid Type Definition**: Extended `GridType` from `'LINES' | 'DOTS' | 'HIDDEN'` to include `'HEXAGONAL' | 'ISOMETRIC'`
- **snapToGrid() Function**: Added optional `gridType` parameter (defaults to 'LINES' for backward compatibility)
- **GridOverlay Component**: Refactored to support hex/iso rendering using geometry abstraction

### Fixed

- Grid calibration now properly disabled for non-square grids to prevent incorrect results

### Technical Details

**New Files**:
- `src/types/grid.ts` - Grid type definitions and interfaces
- `src/utils/gridGeometry.ts` - Grid geometry implementations
- `src/utils/gridGeometry.test.ts` - Comprehensive grid geometry tests

**Modified Files**:
- `src/store/gameStore.ts` - Extended GridType enum
- `src/utils/grid.ts` - Updated snapToGrid with gridType support
- `src/components/Canvas/GridOverlay.tsx` - Hex/iso rendering support
- `src/components/Canvas/CanvasManager.tsx` - Updated all snap call sites
- `src/components/MapSettingsSheet.tsx` - Added grid type options and calibration fix
- `src/utils/grid.test.ts` - Updated tests with explicit gridType parameter

**Grid Size Semantics**:
- Square: `gridSize` = cell width/height in pixels
- Hexagonal: `gridSize` = circumradius (center to vertex)
- Isometric: `gridSize` = half of diamond width

**Breaking Changes**: None - fully backward compatible with existing square grids

---

## [0.5.3] - 2024-XX-XX

### Fixed
- Logo not appearing in Mac production builds (#223)
- E2E test failures caused by preventDefault() on synthetic events (#219)

### Changed
- Mobile enhancements (#220)

---

_For older changes, see git history._
