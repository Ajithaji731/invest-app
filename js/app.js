/**
 * Main Application Entry Point
 * Initializes state storage and boots up UI rendering systems.
 */

// Launch application once DOM structure is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Show loading overlay
  const loader = document.getElementById('cloudLoader');
  if (loader) loader.style.display = 'flex';

  // Load cloud state
  await portfolioState.loadState();
  
  // Hide loading overlay
  if (loader) loader.style.display = 'none';

  // Bind handlers and render primary dashboard view
  portfolioUI.initUI();
});
