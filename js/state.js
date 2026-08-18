/**
 * State Management for Portfolio Tracker
 * Handles local storage persistence and historical data calculations.
 */

const STORAGE_KEY = 'portfolio_tracker_state';
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyxC4m0vSxOtCL2T4bkgH2QVefsikJlsoyyFGfJHnniqF7HMFjFxFPYW0p1v2U-XLNI/exec';

function getCloudConfig() {
  return {
    appScriptUrl: APP_SCRIPT_URL
  };
}

function hasCloudConfig() {
  return true;
}

// Preloaded user assets
const DEFAULT_ASSETS = [
  // Stocks & ETFs
  { id: 'st_tata_cap', name: 'TATA Capital', category: 'Stocks/ETFs', sector: 'Financial Services (NBFC)' },
  { id: 'st_tatsilv', name: 'TATSILV', category: 'Stocks/ETFs', sector: 'Commodities - Silver' },
  { id: 'st_goldietf', name: 'GOLDIETF', category: 'Stocks/ETFs', sector: 'Commodities - Gold' },
  { id: 'st_hdfc', name: 'HDFC BANK', category: 'Stocks/ETFs', sector: 'Banking - Private Sector' },
  { id: 'st_bpcl', name: 'BPCL', category: 'Stocks/ETFs', sector: 'Oil & Gas' },
  { id: 'st_icici', name: 'ICICI BANK', category: 'Stocks/ETFs', sector: 'Banking - Private Sector' },
  { id: 'st_metalietf', name: 'METALIETF', category: 'Stocks/ETFs', sector: 'Metals & Mining' },
  { id: 'st_southbank', name: 'SOUTHBANK', category: 'Stocks/ETFs', sector: 'Banking - Private Sector' },
  { id: 'st_nippon_it', name: 'Nippon India ETF IT', category: 'Stocks/ETFs', sector: 'Information Technology' },

  // Mutual Funds
  { id: 'mf_parag_parikh', name: 'Parag parikh flexi cap fund - Direct', category: 'Mutual Funds', sector: 'Flexi Cap' },
  { id: 'mf_icici_n50', name: 'ICICI Prudential Nifty 50 Index Fund - Direct', category: 'Mutual Funds', sector: 'Index Fund' },
  { id: 'mf_bandhan_small', name: 'Bandhan Small Cap Fund - Direct', category: 'Mutual Funds', sector: 'Small Cap' },

  // EPF / PF
  { id: 'epf_balance', name: 'EPF Balance', category: 'EPF', sector: 'Retirement' },

  // PPF
  { id: 'ppf_balance', name: 'PPF Balance', category: 'PPF', sector: 'Retirement' },

  // NPS
  { id: 'nps_tier1', name: 'NPS Tier 1', category: 'NPS', sector: 'Retirement' },
  { id: 'nps_tier2', name: 'NPS Tier 2', category: 'NPS', sector: 'Retirement' },

  // Goal-focused funds
  { id: 'goal_emergency_fund', name: 'Emergency Fund', category: 'Emergency Fund', sector: 'Emergency Savings' },
  { id: 'goal_car_fund', name: 'Car Fund', category: 'Goals', sector: 'Car Purchase 2028' },
  { id: 'goal_digi_gold', name: 'Digi Gold', category: 'Gold Investment', sector: 'Gold Investments' }
];

// Preloaded records from the user's provided data
const DEFAULT_RECORDS = {
  '2026-02': {
    'st_tata_cap': { invested: 16282.50 },
    'st_tatsilv': { invested: 13512.94 },
    'st_goldietf': { invested: 5314.22 },
    'st_hdfc': { invested: 4649.25 },
    'st_bpcl': { invested: 2209.44 },
    'st_icici': { invested: 1402.00 },
    'st_metalietf': { invested: 1201.00 },
    'st_southbank': { invested: 1062.96 },
    'st_nippon_it': { invested: 944.40 },
    'mf_parag_parikh': { invested: 17004.07 },
    'mf_icici_n50': { invested: 10001.27 },
    'mf_bandhan_small': { invested: 8401.58 }
  },
  '2026-03': {
    'st_tata_cap': { invested: 16282.50 },
    'st_tatsilv': { invested: 13512.94 },
    'st_hdfc': { invested: 8231.85 },
    'st_goldietf': { invested: 5856.34 },
    'st_icici': { invested: 4179.09 },
    'st_bpcl': { invested: 2209.44 },
    'st_metalietf': { invested: 1325.50 },
    'st_nippon_it': { invested: 1148.10 },
    'st_southbank': { invested: 1146.00 },
    'mf_parag_parikh': { invested: 21004.07 },
    'mf_icici_n50': { invested: 15001.27 },
    'mf_bandhan_small': { invested: 12401.58 },
    'epf_balance': { invested: 118813.00 },
    'nps_tier1': { invested: 4500.00 },
    'nps_tier2': { invested: 2000.00 },
    'goal_emergency_fund': { invested: 110000.00 },
    'goal_car_fund': { invested: 30000.00 },
    'goal_digi_gold': { invested: 4100.00 }
  },
  '2026-04': {
    'st_tata_cap': { invested: 16282.50 },
    'st_tatsilv': { invested: 13712.05 },
    'st_hdfc': { invested: 9720.70 },
    'st_goldietf': { invested: 6482.09 },
    'st_icici': { invested: 5397.60 },
    'st_bpcl': { invested: 2209.44 },
    'st_metalietf': { invested: 1438.80 },
    'st_nippon_it': { invested: 1310.05 },
    'st_southbank': { invested: 1250.58 },
    'mf_parag_parikh': { invested: 23004.00 },
    'mf_icici_n50': { invested: 17001.00 },
    'mf_bandhan_small': { invested: 14401.00 },
    'epf_balance': { invested: 125567.00 },
    'nps_tier1': { invested: 5000.00 },
    'nps_tier2': { invested: 2250.00 },
    'goal_emergency_fund': { invested: 115000.00 },
    'goal_car_fund': { invested: 27000.00 },
    'goal_digi_gold': { invested: 4500.00 }
  },
  '2026-05': {
    'st_tata_cap': { invested: 16282.50 },
    'st_tatsilv': { invested: 13712.05 },
    'st_hdfc': { invested: 9720.70 },
    'st_goldietf': { invested: 6482.09 },
    'st_icici': { invested: 5397.60 },
    'st_bpcl': { invested: 2209.44 },
    'st_metalietf': { invested: 1737.45 },
    'st_nippon_it': { invested: 1310.05 },
    'st_southbank': { invested: 1250.58 },
    'mf_parag_parikh': { invested: 28004.00 },
    'mf_icici_n50': { invested: 21000.00 },
    'mf_bandhan_small': { invested: 17400.00 },
    'epf_balance': { invested: 125567.00 },
    'ppf_balance': { invested: 2000.00 },
    'nps_tier1': { invested: 5500.00 },
    'nps_tier2': { invested: 2500.00 },
    'goal_emergency_fund': { invested: 120000.00 },
    'goal_car_fund': { invested: 50000.00 },
    'goal_digi_gold': { invested: 6400.00 }
  },
  '2026-06': {
    'st_tata_cap': { invested: 16282.50 },
    'st_tatsilv': { invested: 13712.05 },
    'st_hdfc': { invested: 10478.16 },
    'st_goldietf': { invested: 7283.51 },
    'st_icici': { invested: 5397.60 },
    'st_bpcl': { invested: 2209.44 },
    'st_metalietf': { invested: 1737.45 },
    'st_nippon_it': { invested: 1310.05 },
    'st_southbank': { invested: 1250.58 },
    'mf_parag_parikh': { invested: 32000.00 },
    'mf_icici_n50': { invested: 25000.00 },
    'mf_bandhan_small': { invested: 22000.00 },
    'epf_balance': { invested: 132321.00 },
    'ppf_balance': { invested: 4000.00 },
    'nps_tier1': { invested: 6000.00 },
    'nps_tier2': { invested: 3000.00 },
    'goal_emergency_fund': { invested: 140000.00 },
    'goal_car_fund': { invested: 50000.00 },
    'goal_digi_gold': { invested: 8100.00 }
  },
  '2026-07': {
    'st_tata_cap': { invested: 16282.50 },
    'st_tatsilv': { invested: 13712.05 },
    'st_hdfc': { invested: 10478.16 },
    'st_goldietf': { invested: 7283.51 },
    'st_icici': { invested: 5397.60 },
    'st_bpcl': { invested: 2209.44 },
    'st_metalietf': { invested: 1737.45 },
    'st_nippon_it': { invested: 1310.05 },
    'st_southbank': { invested: 1250.58 },
    'mf_parag_parikh': { invested: 35000.00 },
    'mf_icici_n50': { invested: 28000.00 },
    'mf_bandhan_small': { invested: 26000.00 },
    'epf_balance': { invested: 139075.00 },
    'ppf_balance': { invested: 6000.00 },
    'nps_tier1': { invested: 6500.00 },
    'nps_tier2': { invested: 3500.00 },
    'goal_emergency_fund': { invested: 150000.00 },
    'goal_car_fund': { invested: 75000.00 },
    'goal_digi_gold': { invested: 9900.00 }
  },
  '2026-08': {
    'st_tata_cap': { invested: 16282.50 },
    'st_tatsilv': { invested: 13712.05 },
    'st_hdfc': { invested: 10478.16 },
    'st_goldietf': { invested: 7283.51 },
    'st_icici': { invested: 5397.60 },
    'st_bpcl': { invested: 2209.44 },
    'st_metalietf': { invested: 1737.45 },
    'st_nippon_it': { invested: 1310.05 },
    'st_southbank': { invested: 1250.58 },
    'mf_parag_parikh': { invested: 38000.00 },
    'mf_icici_n50': { invested: 32000.00 },
    'mf_bandhan_small': { invested: 30000.00 },
    'epf_balance': { invested: 144270.00 },
    'ppf_balance': { invested: 8000.00 },
    'nps_tier1': { invested: 7000.00 },
    'nps_tier2': { invested: 4000.00 },
    'goal_emergency_fund': { invested: 150000.00 },
    'goal_car_fund': { invested: 75000.00 },
    'goal_digi_gold': { invested: 11500.00 }
  }
};

let state = {
  assets: [],
  records: {},
  lastModified: Date.now()
};

let isSaving = false;
let syncTimeout = null;

async function syncToCloud() {
  if (syncTimeout) clearTimeout(syncTimeout);
  
  return new Promise((resolve) => {
    syncTimeout = setTimeout(async () => {
      isSaving = true;
      try {
        const config = getCloudConfig();
        if (!config.appScriptUrl) {
          isSaving = false;
          resolve(false);
          return;
        }

        const res = await fetch(config.appScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: JSON.stringify(state)
        });
        
        // With no-cors mode, the response is opaque and res.ok is false with status 0
        resolve(true);
      } catch (e) {
        console.error("Failed to sync to cloud", e);
        resolve(false);
      } finally {
        isSaving = false;
      }
    }, 1000); // 1-second debounce
  });
}

/**
 * Save current state to localStorage and cloud
 */
function saveState() {
  state.lastModified = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return syncToCloud(); // Returns a promise that resolves after the debounced sync
}

/**
 * Helper to get default data set
 */
function getDefaultState() {
  return {
    assets: [...DEFAULT_ASSETS],
    records: JSON.parse(JSON.stringify(DEFAULT_RECORDS)), // Deep copy
    lastModified: Date.now()
  };
}

/**
 * Clean up empty or invalid records from the state database
 */
function cleanRecords() {
  if (!state) state = getDefaultState();
  if (!state.records) state.records = {};
  if (!state.assets) state.assets = [];

  Object.keys(state.records).forEach(month => {
    const monthRecs = state.records[month];
    if (monthRecs) {
      if (monthRecs[''] !== undefined) {
        delete monthRecs[''];
      }
      Object.keys(monthRecs).forEach(assetId => {
        const assetExists = state.assets.some(a => a.id === assetId);
        if (!assetExists) {
          delete monthRecs[assetId];
        }
      });
      if (Object.keys(monthRecs).length === 0) {
        delete state.records[month];
      }
    }
  });
  saveState();
}

/**
 * Load state from cloud (fallback to localStorage)
 */
async function loadState() {
  const config = getCloudConfig();
  if (!config.appScriptUrl) {
    console.log("No cloud config found, loading from local storage.");
    return loadLocalFallback();
  }

  try {
    // Append timestamp to bypass aggressive browser caching of GET requests
    const res = await fetch(config.appScriptUrl + '?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const cloudState = await res.json();
      const localStateStr = localStorage.getItem(STORAGE_KEY);
      let localState = null;
      if (localStateStr) {
        try { localState = JSON.parse(localStateStr); } catch (e) {}
      }

      if (cloudState && cloudState.records && Object.keys(cloudState.records).length > 0) {
        // Cloud has data, always trust cloud as the master source of truth across devices
        state = cloudState;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } else {
        // Cloud is empty. Use local state if it exists, otherwise initialize default state and push to cloud.
        console.log("Cloud state is empty. Pushing data to cloud.");
        state = localState || getDefaultState();
        syncToCloud();
      }
    } else {
      throw new Error(`Cloud fetch failed with status ${res.status}`);
    }
  } catch (e) {
    console.error("Cloud load failed, falling back to local storage.", e);
    loadLocalFallback();
  }

  // Run cleanup on loaded state
  cleanRecords();

  // Migrate Digi Gold to Gold Investment category for existing state
  if (state && state.assets) {
    const digiGoldAsset = state.assets.find(a => a.id === 'goal_digi_gold');
    if (digiGoldAsset && digiGoldAsset.category === 'Goals') {
      digiGoldAsset.category = 'Gold Investment';
      saveState();
    }
  }
}

function loadLocalFallback() {
  const localData = localStorage.getItem(STORAGE_KEY);
  if (localData) {
    try {
      state = JSON.parse(localData);
      
      // Upgrade script: remove old 'current' and 'units' properties from records
      let wasUpgraded = false;
      Object.keys(state.records).forEach(month => {
        Object.keys(state.records[month]).forEach(assetId => {
          if (state.records[month][assetId].current !== undefined) {
            delete state.records[month][assetId].current;
            wasUpgraded = true;
          }
          if (state.records[month][assetId].units !== undefined) {
            delete state.records[month][assetId].units;
            wasUpgraded = true;
          }
        });
      });

      // Migration: Ensure July and August 2026 are included if they were missing from the old cache
      const defaultState = getDefaultState();
      if (!state.records['2026-07'] && defaultState.records['2026-07']) {
        state.records['2026-07'] = defaultState.records['2026-07'];
        wasUpgraded = true;
      }
      if (!state.records['2026-08'] && defaultState.records['2026-08']) {
        state.records['2026-08'] = defaultState.records['2026-08'];
        wasUpgraded = true;
      }

      if (wasUpgraded) saveState();

      // If somehow the user ended up with completely 0 records due to a past crash, force load the defaults
      if (!state.records || Object.keys(state.records).length === 0) {
        state = getDefaultState();
        saveState();
      }

    } catch (e) {
      console.error("Failed to parse local storage data, resetting to default.", e);
      state = getDefaultState();
      saveState();
    }
  } else {
    // First time load
    state = getDefaultState();
    saveState();
  }
}

function getAssets() {
  return state.assets;
}

function getAssetsByCategory() {
  return state.assets.reduce((acc, asset) => {
    if (!acc[asset.category]) acc[asset.category] = [];
    acc[asset.category].push(asset);
    return acc;
  }, {});
}

function addAsset(name, category, sector = '', schemeCode = '') {
  const id = `${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
  const newAsset = { id, name, category, sector, schemeCode };
  state.assets.push(newAsset);
  saveState();
  return newAsset;
}

function updateAsset(id, name, sector, schemeCode = '') {
  const asset = state.assets.find(a => a.id === id);
  if (asset) {
    asset.name = name;
    asset.sector = sector;
    asset.schemeCode = schemeCode;
    saveState();
  }
  return asset;
}

function deleteAsset(id) {
  state.assets = state.assets.filter(a => a.id !== id);
  Object.keys(state.records).forEach(month => {
    if (state.records[month][id]) {
      delete state.records[month][id];
    }
  });
  saveState();
}

function getMonths() {
  return Object.keys(state.records).sort();
}

function getRecordsForMonth(monthStr) {
  return state.records[monthStr] || {};
}

function updateMonthlyRecord(monthStr, assetId, invested) {
  if (!state.records[monthStr]) {
    state.records[monthStr] = {};
  }
  state.records[monthStr][assetId] = {
    invested: Number(invested) || 0
  };
  // Wait to call saveState explicitly to avoid rapid firing
}

function cloneMonthRecords(srcMonth, targetMonth) {
  if (state.records[srcMonth]) {
    state.records[targetMonth] = JSON.parse(JSON.stringify(state.records[srcMonth]));
    saveState();
  }
}

function deleteMonthRecords(monthStr) {
  if (state.records[monthStr]) {
    delete state.records[monthStr];
    saveState();
  }
}

function getPortfolioMetrics(monthStr) {
  const months = getMonths();
  const index = months.indexOf(monthStr);
  const currentRecords = state.records[monthStr] || {};

  let totalInvested = 0;
  let breakdown = {}; // by category

  Object.keys(currentRecords).forEach(assetId => {
    const asset = state.assets.find(a => a.id === assetId);
    if (!asset) return;

    const invested = currentRecords[assetId].invested || 0;
    
    totalInvested += invested;

    if (!breakdown[asset.category]) breakdown[asset.category] = { invested: 0 };
    breakdown[asset.category].invested += invested;
  });

  let momChange = 0;
  if (index > 0) {
    const prevMonthStr = months[index - 1];
    const prevRecords = state.records[prevMonthStr] || {};
    let prevTotalInvested = 0;
    
    Object.keys(prevRecords).forEach(assetId => {
      prevTotalInvested += (prevRecords[assetId].invested || 0);
    });

    momChange = totalInvested - prevTotalInvested;
  }

  return {
    totalInvested,
    breakdown,
    mom: {
      change: momChange
    }
  };
}

function clearAllData() {
  state = { assets: [], records: {}, lastModified: Date.now() };
  saveState();
}

function resetToExcelData() {
  state = getDefaultState();
  saveState();
}

function exportData() {
  return JSON.stringify(state, null, 2);
}

function importData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && parsed.assets && parsed.records) {
      state = parsed;
      state.lastModified = Date.now();
      saveState();
      return true;
    }
    return false;
  } catch (e) {
    console.error("Import failed", e);
    return false;
  }
}

window.portfolioState = {
  getCloudConfig,
  hasCloudConfig,
  loadLocalFallback,
  loadState,
  saveState,
  getAssets,
  getAssetsByCategory,
  addAsset,
  updateAsset,
  deleteAsset,
  getMonths,
  getRecordsForMonth,
  updateMonthlyRecord,
  cloneMonthRecords,
  deleteMonthRecords,
  getPortfolioMetrics,
  clearAllData,
  resetToExcelData,
  exportData,
  importData
};
