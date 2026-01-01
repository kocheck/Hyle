/**
 * Design System Playground Component
 *
 * A centralized component testing and documentation interface for internal use.
 * Displays all UI primitives with live examples and copyable code snippets.
 *
 * Features:
 * - Component grid with categories
 * - Real-time search filtering
 * - Copy-to-clipboard code snippets
 * - Typography showcase
 * - Color palette viewer
 */

import { useState, useMemo } from 'react';
import { RiSearchLine, RiFileCopyLine, RiCheckLine, RiCloseLine } from '@remixicon/react';
import { componentExamples, categories } from './playground-registry';
import { ComponentExample } from './types';

export function DesignSystemPlayground() {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter components based on search query
  const filteredExamples = useMemo(() => {
    if (!searchQuery.trim()) {
      return componentExamples;
    }

    const query = searchQuery.toLowerCase();
    return componentExamples.filter((example) => {
      return (
        example.name.toLowerCase().includes(query) ||
        example.description.toLowerCase().includes(query) ||
        example.category.toLowerCase().includes(query) ||
        example.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [searchQuery]);

  // Group filtered examples by category
  const groupedExamples = useMemo(() => {
    const groups: Record<string, ComponentExample[]> = {};

    filteredExamples.forEach((example) => {
      if (!groups[example.category]) {
        groups[example.category] = [];
      }
      groups[example.category].push(example);
    });

    return groups;
  }, [filteredExamples]);

  // Handle copy to clipboard
  const handleCopyCode = async (example: ComponentExample) => {
    try {
      await navigator.clipboard.writeText(example.code);
      setCopiedId(example.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <div className="w-full h-screen overflow-auto bg-neutral-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-neutral-900 border-b border-neutral-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Design System Playground</h1>
              <p className="text-neutral-400">
                Component testing and documentation for Graphium's UI primitives
              </p>
            </div>
            <a
              href="/"
              className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-all flex items-center gap-2"
            >
              <RiCloseLine className="w-5 h-5" />
              Exit Playground
            </a>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <RiSearchLine className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              placeholder="Search components (e.g., Button, Input, Typography)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Results count */}
        <div className="mb-6 text-sm text-neutral-400">
          {searchQuery ? (
            <>
              Found {filteredExamples.length} component{filteredExamples.length !== 1 ? 's' : ''}{' '}
              matching "{searchQuery}"
            </>
          ) : (
            <>Showing all {componentExamples.length} components</>
          )}
        </div>

        {/* Component Categories */}
        {Object.entries(groupedExamples).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No components found</h3>
            <p className="text-neutral-400">Try adjusting your search query</p>
          </div>
        ) : (
          Object.entries(groupedExamples).map(([categoryId, examples]) => {
            const category = categories.find((c) => c.id === categoryId);
            if (!category) return null;

            return (
              <div key={categoryId} className="mb-12">
                {/* Category Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-1">{category.name}</h2>
                  <p className="text-neutral-400">{category.description}</p>
                </div>

                {/* Component Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {examples.map((example) => (
                    <ComponentCard
                      key={example.id}
                      example={example}
                      isCopied={copiedId === example.id}
                      onCopy={() => handleCopyCode(example)}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * ComponentCard - Individual component showcase card
 */
interface ComponentCardProps {
  example: ComponentExample;
  isCopied: boolean;
  onCopy: () => void;
}

function ComponentCard({ example, isCopied, onCopy }: ComponentCardProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden hover:border-neutral-600 transition-colors">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-neutral-700">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{example.name}</h3>
            <p className="text-sm text-neutral-400">{example.description}</p>
          </div>
          <button
            onClick={() => setShowCode(!showCode)}
            className="text-xs px-3 py-1.5 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-300 transition-colors whitespace-nowrap ml-4"
          >
            {showCode ? 'Hide Code' : 'View Code'}
          </button>
        </div>
      </div>

      {/* Component Preview */}
      <div className="px-5 py-6 bg-neutral-900/50 flex items-center justify-center min-h-[120px]">
        {example.component}
      </div>

      {/* Code Snippet (Collapsible) */}
      {showCode && (
        <div className="border-t border-neutral-700">
          <div className="relative">
            <pre className="px-5 py-4 overflow-x-auto text-sm bg-neutral-950 text-neutral-300 font-mono">
              <code>{example.code}</code>
            </pre>
            <button
              onClick={onCopy}
              className="absolute top-3 right-3 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-sm flex items-center gap-2 transition-all"
              title="Copy code to clipboard"
            >
              {isCopied ? (
                <>
                  <RiCheckLine className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <RiFileCopyLine className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tags */}
      {example.tags && example.tags.length > 0 && (
        <div className="px-5 py-3 border-t border-neutral-700 flex flex-wrap gap-2">
          {example.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 rounded bg-neutral-700 text-neutral-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
