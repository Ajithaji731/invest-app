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

  // --- Background Pre-fetching for 0s Instant Login ---
  let prefetchPromise = null;
  function startPrefetch(pin = "2108") {
    const config = portfolioState.getCloudConfig();
    if (!config.appScriptUrl) return;
    prefetchPromise = fetch(`${config.appScriptUrl}?userId=${pin}&t=${Date.now()}`)
      .then(res => res.ok ? res.json() : null)
      .catch(err => { console.warn("Invest prefetch warning", err); return null; });
  }

  // Authentication Flow
  if (currentUserId) {
    initializeApp();
  } else {
    showLogin();
    startPrefetch("2108");
  }

  // --- Login Logic ---
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = userIdInput.value.trim();
    if (!id) return;
    
    try {
      let data = null;
      // If pre-fetch already finished while user was looking/typing PIN, use it instantly (0s wait!)
      if (id === "2108" && prefetchPromise) {
        data = await prefetchPromise;
      }
      
      if (!data) {
        showLoading('Verifying Secure ID...', 'Authenticating with Google Apps Script');
        const config = portfolioState.getCloudConfig();
        const res = await fetch(`${config.appScriptUrl}?userId=${id}&t=${Date.now()}`);
        if (!res.ok) throw new Error('Network response was not ok');
        data = await res.json();
      }
      
      if (data && data.error === "Unauthorized") {
        showLogin();
        loginError.textContent = "Invalid Secure ID.";
        loginError.classList.remove('hidden');
        setTimeout(() => loginError.classList.add('hidden'), 3000);
        return;
      }
      
      // Save state directly so no second cloud fetch is needed
      if (data && data.records) {
        if (!data.assets || !Array.isArray(data.assets) || data.assets.length === 0) {
          const def = portfolioState.getDefaultState ? portfolioState.getDefaultState() : null;
          data.assets = def ? def.assets : [];
        }
        localStorage.setItem('portfolio_tracker_state', JSON.stringify(data));
      }
      
      currentUserId = id;
      localStorage.setItem('wealthflowUserId', currentUserId);
      localStorage.setItem('wealthflowLoginTime', Date.now().toString());
      loginError.classList.add('hidden');
      
      // Boot UI instantly
      portfolioState.loadLocalFallback();
      portfolioUI.initUI();
      showApp();
    } catch (err) {
      console.error("Login verification failed:", err);
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
    
    portfolioState.clearAllData();
    if (portfolioUI && portfolioUI.resetUIState) {
      portfolioUI.resetUIState();
    }
    
    showLogin();
    userIdInput.value = "";
    startPrefetch("2108");
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
    portfolioState.loadLocalFallback();
    await portfolioState.loadState();
    portfolioUI.initUI();
    showApp();
  }
});
