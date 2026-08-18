/**
 * Main Application Entry Point
 * Initializes state storage and boots up UI rendering systems.
 */

// Launch application once DOM structure is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Remove any cloud loader element immediately
  const loader = document.getElementById('cloudLoader');
  if (loader) loader.remove();

  // Load local state instantly so the UI renders immediately (0-second wait)
  portfolioState.loadLocalFallback();
  
  // Render primary dashboard view
  portfolioUI.initUI();

  // Perform background cloud sync without blocking the user
  portfolioState.loadState().then(() => {
    // Re-render UI just in case new data came from the cloud
    if (window.renderCurrentView) {
      window.renderCurrentView();
    }
  });
});
