/**
 * Playground Registry - Component Examples for Design System
 *
 * This file defines all component examples displayed in the Design System Playground.
 * Each example includes the component instance and its usage code snippet.
 */

import ToggleSwitch from '../ToggleSwitch';
import { ComponentExample, ComponentCategory } from './types';

/**
 * Component categories for the playground
 */
export const categories: ComponentCategory[] = [
  {
    id: 'button',
    name: 'Buttons',
    description: 'Primary, secondary, and icon buttons',
  },
  {
    id: 'input',
    name: 'Inputs',
    description: 'Text inputs, search bars, and form controls',
  },
  {
    id: 'toggle',
    name: 'Toggles & Switches',
    description: 'Toggle switches and checkbox replacements',
  },
  {
    id: 'modal',
    name: 'Modals & Dialogs',
    description: 'Confirmation dialogs and modal overlays',
  },
  {
    id: 'typography',
    name: 'Typography',
    description: 'Text styles and heading hierarchy',
  },
  {
    id: 'color',
    name: 'Colors',
    description: 'Theme color palette and variables',
  },
  {
    id: 'card',
    name: 'Cards',
    description: 'Card components and containers',
  },
  {
    id: 'toast',
    name: 'Toasts',
    description: 'Notification components',
  },
];

/**
 * Component examples registry
 */
export const componentExamples: ComponentExample[] = [
  // BUTTONS
  {
    id: 'button-primary',
    name: 'Primary Button',
    category: 'button',
    description: 'Main call-to-action button with accent color',
    component: (
      <button className="px-4 py-2 rounded font-medium transition-all bg-blue-600 hover:bg-blue-500 text-white">
        Primary Action
      </button>
    ),
    code: `<button className="px-4 py-2 rounded font-medium transition-all bg-blue-600 hover:bg-blue-500 text-white">
  Primary Action
</button>`,
    tags: ['button', 'primary', 'action'],
  },
  {
    id: 'button-secondary',
    name: 'Secondary Button',
    category: 'button',
    description: 'Secondary action button with subtle styling',
    component: (
      <button className="px-4 py-2 rounded font-medium transition-all bg-neutral-700 hover:bg-neutral-600 text-white">
        Secondary Action
      </button>
    ),
    code: `<button className="px-4 py-2 rounded font-medium transition-all bg-neutral-700 hover:bg-neutral-600 text-white">
  Secondary Action
</button>`,
    tags: ['button', 'secondary'],
  },
  {
    id: 'button-danger',
    name: 'Danger Button',
    category: 'button',
    description: 'Destructive action button (delete, remove, etc.)',
    component: (
      <button className="px-4 py-2 rounded font-medium transition-all bg-red-600 hover:bg-red-700 text-white">
        Delete
      </button>
    ),
    code: `<button className="px-4 py-2 rounded font-medium transition-all bg-red-600 hover:bg-red-700 text-white">
  Delete
</button>`,
    tags: ['button', 'danger', 'delete'],
  },
  {
    id: 'button-ghost',
    name: 'Ghost Button',
    category: 'button',
    description: 'Transparent button with border only',
    component: (
      <button className="px-4 py-2 rounded font-medium transition-all border border-neutral-600 hover:bg-neutral-800 text-white">
        Ghost Button
      </button>
    ),
    code: `<button className="px-4 py-2 rounded font-medium transition-all border border-neutral-600 hover:bg-neutral-800 text-white">
  Ghost Button
</button>`,
    tags: ['button', 'ghost', 'outline'],
  },

  // INPUTS
  {
    id: 'input-text',
    name: 'Text Input',
    category: 'input',
    description: 'Standard text input field',
    component: (
      <input
        type="text"
        placeholder="Enter text..."
        className="px-3 py-2 rounded bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
      />
    ),
    code: `<input
  type="text"
  placeholder="Enter text..."
  className="px-3 py-2 rounded bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500"
/>`,
    tags: ['input', 'text', 'form'],
  },
  {
    id: 'input-search',
    name: 'Search Input',
    category: 'input',
    description: 'Search input with icon',
    component: (
      <div className="relative">
        <input
          type="search"
          placeholder="Search..."
          className="pl-10 pr-3 py-2 rounded bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500 w-64"
        />
        <svg
          className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    ),
    code: `<div className="relative">
  <input
    type="search"
    placeholder="Search..."
    className="pl-10 pr-3 py-2 rounded bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500 w-64"
  />
  <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
</div>`,
    tags: ['input', 'search', 'icon'],
  },

  // TOGGLES
  {
    id: 'toggle-switch',
    name: 'Toggle Switch',
    category: 'toggle',
    description: 'Modern toggle switch component',
    component: <ToggleSwitch checked={true} onChange={() => {}} label="Enable Feature" />,
    code: `import ToggleSwitch from './components/ToggleSwitch';

<ToggleSwitch
  checked={isEnabled}
  onChange={(checked) => setIsEnabled(checked)}
  label="Enable Feature"
/>`,
    tags: ['toggle', 'switch', 'checkbox'],
  },
  {
    id: 'toggle-switch-description',
    name: 'Toggle with Description',
    category: 'toggle',
    description: 'Toggle switch with explanatory text',
    component: (
      <ToggleSwitch
        checked={false}
        onChange={() => {}}
        label="Dark Mode"
        description="Enable dark theme across the application"
      />
    ),
    code: `<ToggleSwitch
  checked={isDarkMode}
  onChange={(checked) => setIsDarkMode(checked)}
  label="Dark Mode"
  description="Enable dark theme across the application"
/>`,
    tags: ['toggle', 'switch', 'description'],
  },

  // TYPOGRAPHY
  {
    id: 'typography-h1',
    name: 'Heading 1',
    category: 'typography',
    description: 'Primary page heading',
    component: <h1 className="text-4xl font-bold text-white">Heading 1</h1>,
    code: `<h1 className="text-4xl font-bold text-white">Heading 1</h1>`,
    tags: ['typography', 'heading', 'h1'],
  },
  {
    id: 'typography-h2',
    name: 'Heading 2',
    category: 'typography',
    description: 'Section heading',
    component: <h2 className="text-3xl font-bold text-white">Heading 2</h2>,
    code: `<h2 className="text-3xl font-bold text-white">Heading 2</h2>`,
    tags: ['typography', 'heading', 'h2'],
  },
  {
    id: 'typography-h3',
    name: 'Heading 3',
    category: 'typography',
    description: 'Subsection heading',
    component: <h3 className="text-2xl font-semibold text-white">Heading 3</h3>,
    code: `<h3 className="text-2xl font-semibold text-white">Heading 3</h3>`,
    tags: ['typography', 'heading', 'h3'],
  },
  {
    id: 'typography-body',
    name: 'Body Text',
    category: 'typography',
    description: 'Standard paragraph text',
    component: <p className="text-base text-neutral-300">This is body text. The quick brown fox jumps over the lazy dog.</p>,
    code: `<p className="text-base text-neutral-300">This is body text.</p>`,
    tags: ['typography', 'paragraph', 'body'],
  },
  {
    id: 'typography-secondary',
    name: 'Secondary Text',
    category: 'typography',
    description: 'Muted secondary text',
    component: <p className="text-sm text-neutral-400">This is secondary text with lower emphasis.</p>,
    code: `<p className="text-sm text-neutral-400">This is secondary text.</p>`,
    tags: ['typography', 'secondary', 'muted'],
  },
  {
    id: 'typography-caption',
    name: 'Caption Text',
    category: 'typography',
    description: 'Small caption or helper text',
    component: <p className="text-xs text-neutral-500">Caption or helper text</p>,
    code: `<p className="text-xs text-neutral-500">Caption or helper text</p>`,
    tags: ['typography', 'caption', 'small'],
  },

  // COLORS
  {
    id: 'color-neutral-900',
    name: 'Neutral 900 (Darkest BG)',
    category: 'color',
    description: 'Darkest background color',
    component: (
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded bg-neutral-900 border border-neutral-700"></div>
        <div>
          <div className="text-white font-mono text-sm">bg-neutral-900</div>
          <div className="text-neutral-400 text-xs">#171717</div>
        </div>
      </div>
    ),
    code: `<div className="bg-neutral-900">Darkest Background</div>`,
    tags: ['color', 'background', 'neutral'],
  },
  {
    id: 'color-neutral-800',
    name: 'Neutral 800 (Panels)',
    category: 'color',
    description: 'Panel and card background',
    component: (
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded bg-neutral-800 border border-neutral-700"></div>
        <div>
          <div className="text-white font-mono text-sm">bg-neutral-800</div>
          <div className="text-neutral-400 text-xs">#262626</div>
        </div>
      </div>
    ),
    code: `<div className="bg-neutral-800">Panel Background</div>`,
    tags: ['color', 'background', 'neutral'],
  },
  {
    id: 'color-blue-600',
    name: 'Blue 600 (Primary)',
    category: 'color',
    description: 'Primary action color',
    component: (
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded bg-blue-600 border border-blue-500"></div>
        <div>
          <div className="text-white font-mono text-sm">bg-blue-600</div>
          <div className="text-neutral-400 text-xs">#2563eb</div>
        </div>
      </div>
    ),
    code: `<button className="bg-blue-600">Primary Action</button>`,
    tags: ['color', 'primary', 'blue'],
  },
  {
    id: 'color-red-600',
    name: 'Red 600 (Danger)',
    category: 'color',
    description: 'Destructive action color',
    component: (
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded bg-red-600 border border-red-500"></div>
        <div>
          <div className="text-white font-mono text-sm">bg-red-600</div>
          <div className="text-neutral-400 text-xs">#dc2626</div>
        </div>
      </div>
    ),
    code: `<button className="bg-red-600">Delete</button>`,
    tags: ['color', 'danger', 'red'],
  },
  {
    id: 'color-green-600',
    name: 'Green 600 (Success)',
    category: 'color',
    description: 'Success state color',
    component: (
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded bg-green-600 border border-green-500"></div>
        <div>
          <div className="text-white font-mono text-sm">bg-green-600</div>
          <div className="text-neutral-400 text-xs">#16a34a</div>
        </div>
      </div>
    ),
    code: `<div className="bg-green-600">Success Message</div>`,
    tags: ['color', 'success', 'green'],
  },

  // CARDS
  {
    id: 'card-basic',
    name: 'Basic Card',
    category: 'card',
    description: 'Standard card container',
    component: (
      <div className="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-2">Card Title</h3>
        <p className="text-sm text-neutral-300">This is a basic card with some content inside.</p>
      </div>
    ),
    code: `<div className="p-4 rounded-lg bg-neutral-800 border border-neutral-700">
  <h3 className="text-lg font-semibold text-white mb-2">Card Title</h3>
  <p className="text-sm text-neutral-300">Card content here.</p>
</div>`,
    tags: ['card', 'container'],
  },
  {
    id: 'card-hover',
    name: 'Hoverable Card',
    category: 'card',
    description: 'Card with hover state',
    component: (
      <div className="p-4 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 transition-all cursor-pointer">
        <h3 className="text-lg font-semibold text-white mb-2">Hover Me</h3>
        <p className="text-sm text-neutral-300">This card changes on hover.</p>
      </div>
    ),
    code: `<div className="p-4 rounded-lg bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 transition-all cursor-pointer">
  <h3 className="text-lg font-semibold text-white mb-2">Hover Me</h3>
  <p className="text-sm text-neutral-300">This card changes on hover.</p>
</div>`,
    tags: ['card', 'hover', 'interactive'],
  },
];
