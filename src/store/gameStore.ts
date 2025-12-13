import { create } from 'zustand';

export interface Token {
  id: string;
  x: number;
  y: number;
  src: string;
  scale: number;
}

export interface Drawing {
  id: string;
  tool: 'marker' | 'eraser';
  points: number[];
  color: string;
  size: number;
}

export interface GameState {
  tokens: Token[];
  drawings: Drawing[];
  gridSize: number;
  addToken: (token: Token) => void;
  updateTokenPosition: (id: string, x: number, y: number) => void;
  addDrawing: (drawing: Drawing) => void;
  setGridSize: (size: number) => void;
  setState: (state: GameState) => void; // Generic set state
  setTokens: (tokens: Token[]) => void;
}

export const useGameStore = create<GameState>((set) => ({
  tokens: [],
  drawings: [],
  gridSize: 50,
  addToken: (token) => set((state) => ({ tokens: [...state.tokens, token] })),
  updateTokenPosition: (id, x, y) => set((state) => ({
    tokens: state.tokens.map((t) => t.id === id ? { ...t, x, y } : t)
  })),
  addDrawing: (drawing) => set((state) => ({ drawings: [...state.drawings, drawing] })),
  setGridSize: (size) => set({ gridSize: size }),
  setTokens: (tokens) => set({ tokens }),
  setState: (state) => set(state),
}));
