/**
 * Main Application Entry Point
 * Initializes state storage, handles auth, and boots up UI rendering systems.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Screens
  const loginScreen = document.getElementById('loginScreen');
  const appScreen = document.getElementById('appScreen');
  const cloudLoader = document.getElementById('cloudLoader');
  
  // Login Elements
  const loginForm = document.getElementById('loginForm');
  const userIdInput = document.getElementById('userIdInput');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');

  // Authentication Flow
  if (currentUserId) {
    initializeApp();
  } else {
    showLogin();
  }

  // --- Login Logic ---
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = userIdInput.value.trim();
    if (!id) return;
    
    showLoading('Verifying Secure ID...', 'Authenticating with Google Apps Script');
    
    try {
      const config = portfolioState.getCloudConfig();
      // Test the credentials against the backend
      const res = await fetch(`${config.appScriptUrl}?userId=${id}&t=${Date.now()}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      
      if (data && data.error === "Unauthorized") {
        hideLoading();
        showLogin();
        loginError.textContent = 'Wrong ID. Please try again.';
        loginError.classList.remove('hidden');
        setTimeout(() => loginError.classList.add('hidden'), 3000);
        return;
      }
      
      // Success!
      currentUserId = id;
      localStorage.setItem('wealthflowUserId', currentUserId);
      localStorage.setItem('wealthflowLoginTime', Date.now().toString());
      loginError.classList.add('hidden');
      
      initializeApp();
    } catch (err) {
      console.error("Login verification failed:", err);
      // Strictly block access if we cannot verify with the server
      hideLoading();
      showLogin();
      loginError.textContent = 'Wrong ID or Connection failed.';
      loginError.classList.remove('hidden');
      setTimeout(() => loginError.classList.add('hidden'), 3000);
    }
  });

  logoutBtn.addEventListener('click', () => {
    currentUserId = null;
    localStorage.removeItem('wealthflowUserId');
    localStorage.removeItem('wealthflowLoginTime');
    
    // Clear data so next login doesn't accidentally flash previous user's data
    portfolioState.clearAllData();
    if (portfolioUI && portfolioUI.resetUIState) {
      portfolioUI.resetUIState();
    }
    
    showLogin();
    userIdInput.value = '';
  });

  function showLoading(title = 'Syncing with Cloud...', subtitle = 'Loading your investment data') {
    const loaderTitle = document.getElementById('loaderTitle');
    const loaderSubtitle = document.getElementById('loaderSubtitle');
    if (loaderTitle) loaderTitle.textContent = title;
    if (loaderSubtitle) loaderSubtitle.textContent = subtitle;
    
    loginScreen.classList.add('hidden');
    appScreen.classList.add('hidden');
    if (cloudLoader) cloudLoader.classList.remove('hidden');
  }

  function hideLoading() {
    if (cloudLoader) cloudLoader.classList.add('hidden');
  }

  function showLogin() {
    hideLoading();
    appScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
  }

  function showApp() {
    hideLoading();
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
  }

  async function initializeApp() {
    showLoading('Syncing with Cloud...', 'Loading your investment data');
    
    // Load local state instantly so the UI has a base if cloud is slow/fails
    portfolioState.loadLocalFallback();
    
    // Wait for cloud sync to finish so we have the absolute latest months
    await portfolioState.loadState();
    
    // Now initialize the UI with the fully synced data
    portfolioUI.initUI();
    
    // Hide loader and show app
    showApp();
  }
});
