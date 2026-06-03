/**
 * Main Application Entry Point
 * Initializes state storage and boots up UI rendering systems.
 */

// Launch application once DOM structure is ready
document.addEventListener('DOMContentLoaded', () => {
  // Load local state (seed with defaults if empty)
  portfolioState.loadState();
  
  // Bind handlers and render primary dashboard view
  portfolioUI.initUI();
});
