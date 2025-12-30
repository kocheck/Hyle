/**
 * CollapsibleSection Component - Accordion Section
 *
 * A collapsible section with a header and toggleable content.
 * Used for organizing sidebar content into collapsible groups.
 *
 * @component
 */

import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition"
        aria-expanded={isOpen}
      >
        <h3 className="text-sm uppercase font-bold tracking-wider" style={{ color: 'var(--app-text-secondary)' }}>
          {title}
        </h3>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--app-text-secondary)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {isOpen && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
