import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DesignSystemPlayground } from './DesignSystemPlayground';
import { componentExamples } from './playground-registry';

describe('DesignSystemPlayground', () => {
  it('should render the playground with header', () => {
    render(<DesignSystemPlayground />);
    
    expect(screen.getByText('Design System Playground')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search components/i)).toBeInTheDocument();
  });

  it('should display all components by default', () => {
    render(<DesignSystemPlayground />);
    
    const totalCount = componentExamples.length;
    expect(screen.getByText(`Showing all ${totalCount} components`)).toBeInTheDocument();
  });

  it('should filter components based on search query', () => {
    render(<DesignSystemPlayground />);
    
    const searchInput = screen.getByPlaceholderText(/Search components/i);
    
    // Search for "button"
    fireEvent.change(searchInput, { target: { value: 'button' } });
    
    // Should show filtered count
    expect(screen.getByText(/Found \d+ component/i)).toBeInTheDocument();
    
    // Should display button components
    expect(screen.getByText('Primary Button')).toBeInTheDocument();
  });

  it('should show "no results" message when search returns nothing', () => {
    render(<DesignSystemPlayground />);
    
    const searchInput = screen.getByPlaceholderText(/Search components/i);
    
    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: 'xyzabc123' } });
    
    expect(screen.getByText('No components found')).toBeInTheDocument();
  });

  it('should toggle code visibility when clicking "View Code"', () => {
    render(<DesignSystemPlayground />);
    
    // Find first "View Code" button
    const viewCodeButtons = screen.getAllByText('View Code');
    const firstButton = viewCodeButtons[0];
    
    // Initially code should not be visible
    expect(firstButton).toBeInTheDocument();
    
    // Click to show code
    fireEvent.click(firstButton);
    
    // Button text should change
    expect(screen.getByText('Hide Code')).toBeInTheDocument();
    
    // Code should be visible
    expect(screen.getByText(/Copy/i)).toBeInTheDocument();
  });

  it('should render component categories', () => {
    render(<DesignSystemPlayground />);
    
    // Should have category headings
    expect(screen.getByText('Buttons')).toBeInTheDocument();
    expect(screen.getByText('Typography')).toBeInTheDocument();
    expect(screen.getByText('Colors')).toBeInTheDocument();
  });

  it('should have Exit Playground link', () => {
    render(<DesignSystemPlayground />);
    
    const exitLink = screen.getByText('Exit Playground');
    expect(exitLink).toBeInTheDocument();
    expect(exitLink.closest('a')).toHaveAttribute('href', '/');
  });
});
