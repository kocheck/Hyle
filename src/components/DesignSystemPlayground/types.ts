/**
 * Type definitions for the Design System Playground
 */

export interface ComponentExample {
  id: string;
  name: string;
  category: 'button' | 'input' | 'toggle' | 'modal' | 'typography' | 'color' | 'card' | 'toast';
  description: string;
  component: React.ReactNode;
  code: string;
  tags?: string[];
}

export interface ComponentCategory {
  id: string;
  name: string;
  description: string;
}
