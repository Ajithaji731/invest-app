/**
 * State Management for Portfolio Tracker
 * Handles local storage persistence, historical data calculations, and analysis.
 */

const STORAGE_KEY = 'portfolio_tracker_state';

// Cloud Configuration Keys
const GIST_ID_KEY = 'portfolio_tracker_gist_id';
const GIST_TOKEN_KEY = 'portfolio_tracker_gist_token';

function getCloudConfig() {
  return {
    gistId: localStorage.getItem(GIST_ID_KEY),
    token: localStorage.getItem(GIST_TOKEN_KEY)
  };
}

function saveCloudConfig(gistId, token) {
  if (gistId) localStorage.setItem(GIST_ID_KEY, gistId.trim());
  if (token) localStorage.setItem(GIST_TOKEN_KEY, token.trim());
}

function hasCloudConfig() {
  const c = getCloudConfig();
  return !!(c.gistId && c.token);
}

// Preloaded user assets from the provided Excel sheet
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

  // Mutual Funds (Pre-populated with AMFI scheme codes for live NAV lookup)
  { id: 'mf_parag_parikh', name: 'Parag parikh flexi cap fund - Direct', category: 'Mutual Funds', sector: 'Flexi Cap', schemeCode: '122639' },
  { id: 'mf_icici_n50', name: 'ICICI Prudential Nifty 50 Index Fund - Direct', category: 'Mutual Funds', sector: 'Index Fund', schemeCode: '120268' },
  { id: 'mf_bandhan_small', name: 'Bandhan Small Cap Fund - Direct', category: 'Mutual Funds', sector: 'Small Cap', schemeCode: '129272' },

  // EPF / PF
  { id: 'epf_balance', name: 'EPF Balance', category: 'EPF', sector: 'Retirement' },

  // PPF
  { id: 'ppf_balance', name: 'PPF Balance', category: 'PPF', sector: 'Retirement' },

  // NPS
  { id: 'nps_tier1', name: 'NPS Tier 1', category: 'NPS', sector: 'Retirement' },
  { id: 'nps_tier2', name: 'NPS Tier 2', category: 'NPS', sector: 'Retirement' },

  // Goal-focused funds (Emergency, Car fund and Digi Gold tracked separately)
  { id: 'goal_emergency_fund', name: 'Emergency Fund', category: 'Emergency Fund', sector: 'Emergency Savings' },
  { id: 'goal_car_fund', name: 'Car Fund', category: 'Goals', sector: 'Car Purchase 2028' },
  { id: 'goal_digi_gold', name: 'Digi Gold', category: 'Gold Investment', sector: 'Gold Investments' }
];

// Preloaded records from the user's Excel sheet and screenshots.
const DEFAULT_RECORDS = {
  // February 2026
  '2026-02': {
    'st_tata_cap': { invested: 16282.50, current: 16800.20, units: 50 },
    'st_tatsilv': { invested: 13512.94, current: 13942.60, units: 526 },
    'st_goldietf': { invested: 5314.22, current: 5483.20, units: 50 },
    'st_hdfc': { invested: 4649.25, current: 4797.10, units: 5 },
    'st_bpcl': { invested: 2209.44, current: 2279.70, units: 6 },
    'st_icici': { invested: 1402.00, current: 1446.60, units: 1 },
    'st_metalietf': { invested: 1201.00, current: 1239.20, units: 100 },
    'st_southbank': { invested: 1062.96, current: 1096.80, units: 28 },
    'st_nippon_it': { invested: 944.40, current: 974.52, units: 24 },

    'mf_parag_parikh': { invested: 17004.07, current: 16923.20, units: 182.216 },
    'mf_icici_n50': { invested: 10001.27, current: 9953.70, units: 37.442 },
    'mf_bandhan_small': { invested: 8401.58, current: 8361.64, units: 165.981 }
  },
  // March 2026
  '2026-03': {
    'st_tata_cap': { invested: 16282.50, current: 14866.00, units: 50 },
    'st_tatsilv': { invested: 13512.94, current: 12337.30, units: 526 },
    'st_hdfc': { invested: 8231.85, current: 7515.70, units: 9 },
    'st_goldietf': { invested: 5856.34, current: 5346.80, units: 54 },
    'st_icici': { invested: 4179.09, current: 3815.50, units: 3 },
    'st_bpcl': { invested: 2209.44, current: 2017.20, units: 6 },
    'st_metalietf': { invested: 1325.50, current: 1210.20, units: 110 },
    'st_nippon_it': { invested: 1148.10, current: 1048.20, units: 30 },
    'st_southbank': { invested: 1146.00, current: 1046.10, units: 30 },

    'mf_parag_parikh': { invested: 21004.07, current: 19255.50, units: 225.714 },
    'mf_icici_n50': { invested: 15001.27, current: 13752.40, units: 56.334 },
    'mf_bandhan_small': { invested: 12401.58, current: 11369.10, units: 247.288 },

    'epf_balance': { invested: 118813.00, current: 118813.00, units: 1 },
    'nps_tier1': { invested: 4500.00, current: 4132.86, units: 1 },
    'nps_tier2': { invested: 2000.00, current: 1867.82, units: 1 },
    'goal_emergency_fund': { invested: 110000.00, current: 110000.00, units: 1 },
    'goal_car_fund': { invested: 30000.00, current: 30000.00, units: 1 },
    'goal_digi_gold': { invested: 4100.00, current: 4100.00, units: 1 }
  },
  // April 2026
  '2026-04': {
    'st_tata_cap': { invested: 16282.50, current: 15609.30, units: 50 },
    'st_tatsilv': { invested: 13712.05, current: 13145.10, units: 535 },
    'st_hdfc': { invested: 9720.70, current: 9318.80, units: 11 },
    'st_goldietf': { invested: 6482.09, current: 6214.10, units: 59 },
    'st_icici': { invested: 5397.60, current: 5174.40, units: 4 },
    'st_bpcl': { invested: 2209.44, current: 2118.10, units: 6 },
    'st_metalietf': { invested: 1438.80, current: 1379.30, units: 120 },
    'st_nippon_it': { invested: 1310.05, current: 1255.90, units: 35 },
    'st_southbank': { invested: 1250.58, current: 1199.10, units: 33 },

    'mf_parag_parikh': { invested: 23004.00, current: 23010.90, units: 249.171 },
    'mf_icici_n50': { invested: 17001.00, current: 17006.10, units: 64.853 },
    'mf_bandhan_small': { invested: 14401.00, current: 14405.25, units: 292.098 },

    'epf_balance': { invested: 125567.00, current: 125567.00, units: 1 },
    'nps_tier1': { invested: 5000.00, current: 4829.00, units: 1 },
    'nps_tier2': { invested: 2250.00, current: 2226.00, units: 1 },
    'goal_emergency_fund': { invested: 115000.00, current: 115000.00, units: 1 },
    'goal_car_fund': { invested: 27000.00, current: 27000.00, units: 1 },
    'goal_digi_gold': { invested: 4500.00, current: 4500.00, units: 1 }
  },
  // May 2026
  '2026-05': {
    'st_tata_cap': { invested: 16282.50, current: 15920.30, units: 50 },
    'st_tatsilv': { invested: 13712.05, current: 13407.00, units: 535 },
    'st_hdfc': { invested: 9720.70, current: 9504.50, units: 11 },
    'st_goldietf': { invested: 6482.09, current: 6337.90, units: 59 },
    'st_icici': { invested: 5397.60, current: 5277.50, units: 4 },
    'st_bpcl': { invested: 2209.44, current: 2160.30, units: 6 },
    'st_metalietf': { invested: 1737.45, current: 1698.80, units: 143 },
    'st_nippon_it': { invested: 1310.05, current: 1280.90, units: 35 },
    'st_southbank': { invested: 1250.58, current: 1222.80, units: 33 },

    'mf_parag_parikh': { invested: 28004.00, current: 28077.00, units: 303.9 },
    'mf_icici_n50': { invested: 21000.00, current: 21054.70, units: 80.7 },
    'mf_bandhan_small': { invested: 17400.00, current: 17445.30, units: 349.6 },

    'epf_balance': { invested: 125567.00, current: 125567.00, units: 1 },
    'ppf_balance': { invested: 2000.00, current: 2000.00, units: 1 },
    'nps_tier1': { invested: 5500.00, current: 5289.00, units: 1 },
    'nps_tier2': { invested: 2500.00, current: 2461.00, units: 1 },
    'goal_emergency_fund': { invested: 120000.00, current: 120000.00, units: 1 },
    'goal_car_fund': { invested: 50000.00, current: 50000.00, units: 1 },
    'goal_digi_gold': { invested: 6400.00, current: 6400.00, units: 1 }
  },
  // June 2026 (Stocks and Mutual Funds updated with exact values from the user's screenshots)
  '2026-06': {
    'st_tata_cap': { invested: 16282.50, current: 15455.00, units: 50 },
    'st_tatsilv': { invested: 13712.05, current: 13391.05, units: 535 },
    'st_hdfc': { invested: 10478.16, current: 9043.80, units: 12 },
    'st_goldietf': { invested: 7283.51, current: 7550.00, units: 65 },
    'st_icici': { invested: 5397.60, current: 4968.00, units: 4 },
    'st_bpcl': { invested: 2209.44, current: 1752.60, units: 6 },
    'st_metalietf': { invested: 1737.45, current: 1947.66, units: 143 },
    'st_nippon_it': { invested: 1310.05, current: 1142.40, units: 35 },
    'st_southbank': { invested: 1250.58, current: 1200.00, units: 33 },

    'mf_parag_parikh': { invested: 32003.00, current: 31278.00, units: 303.9 },
    'mf_icici_n50': { invested: 25000.00, current: 23939.00, units: 80.7 },
    'mf_bandhan_small': { invested: 22001.00, current: 23003.00, units: 349.6 },

    'epf_balance': { invested: 132321.00, current: 132321.00, units: 1 },
    'ppf_balance': { invested: 4000.00, current: 4000.00, units: 1 },
    'nps_tier1': { invested: 6000.00, current: 5800.00, units: 1 },
    'nps_tier2': { invested: 3000.00, current: 2900.00, units: 1 },
    'goal_emergency_fund': { invested: 140000.00, current: 140000.00, units: 1 },
    'goal_car_fund': { invested: 50000.00, current: 50000.00, units: 1 },
    'goal_digi_gold': { invested: 8100.00, current: 8100.00, units: 1 }
  }
};

let state = {
  assets: [],
  records: {},
  lastModified: Date.now()
};

let isSaving = false;
let pendingSave = false;

let syncTimeout = null;

async function syncToCloud() {
  if (syncTimeout) clearTimeout(syncTimeout);
  
  return new Promise((resolve) => {
    syncTimeout = setTimeout(async () => {
      isSaving = true;
      try {
        const config = getCloudConfig();
        if (!config.gistId || !config.token) {
          isSaving = false;
          resolve(false);
          return;
        }

        const res = await fetch(`https://api.github.com/gists/${config.gistId}`, {
          method: 'PATCH',
          headers: {
            'Accept': 'application/vnd.github+json',
            'Authorization': `Bearer ${config.token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            files: {
              'portfolio.json': {
                content: JSON.stringify(state)
              }
            }
          })
        });
        if (!res.ok) console.error("Cloud sync failed with status", res.status);
        resolve(res.ok);
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
    records: JSON.parse(JSON.stringify(DEFAULT_RECORDS)) // Deep copy
  };
}

/**
 * Clean up empty or invalid records from the state database
 */
function cleanRecords() {
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
  if (!config.gistId || !config.token) {
    console.log("No cloud config found, loading from local storage.");
    return loadLocalFallback();
  }

  try {
    const res = await fetch(`https://api.github.com/gists/${config.gistId}`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${config.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      const file = data.files['portfolio.json'];
      if (!file) {
        throw new Error("Invalid cloud data format: missing portfolio.json");
      }
      
      let contentToParse = file.content;
      if (file.truncated || !contentToParse) {
        const rawRes = await fetch(file.raw_url, { cache: 'no-store' });
        if (!rawRes.ok) throw new Error("Failed to fetch raw gist content");
        contentToParse = await rawRes.text();
      }
      
      const cloudState = JSON.parse(contentToParse);
      const localStateStr = localStorage.getItem(STORAGE_KEY);
      let localState = null;
      if (localStateStr) {
        try { localState = JSON.parse(localStateStr); } catch (e) {}
      }

      if (localState && localState.lastModified && cloudState.lastModified) {
        if (localState.lastModified > cloudState.lastModified) {
          console.log("Local state is newer than cloud state. Skipping overwrite and syncing local to cloud.");
          state = localState;
          syncToCloud(); // Push local changes that were missed
        } else {
          state = cloudState;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
      } else {
        // No timestamps or first time, trust cloud
        state = cloudState;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  const digiGoldAsset = state.assets.find(a => a.id === 'goal_digi_gold');
  if (digiGoldAsset && digiGoldAsset.category === 'Goals') {
    console.log("Migrating Digi Gold to Gold Investment category.");
    digiGoldAsset.category = 'Gold Investment';
    saveState();
  }

  return state;
}

function loadLocalFallback() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      state = JSON.parse(data);
    } catch (err) {
      state = getDefaultState();
      saveState();
    }
  } else {
    state = getDefaultState();
    saveState();
  }
  return state;
}

/**
 * Get all assets
 */
function getAssets() {
  return state.assets;
}

/**
 * Add a new investment asset
 */
function addAsset(name, category, sector = '', schemeCode = '') {
  const id = `${category.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
  const newAsset = { id, name, category, sector, schemeCode };
  state.assets.push(newAsset);
  saveState();
  return newAsset;
}

/**
 * Update asset meta info
 */
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

/**
 * Delete an asset and all its historical records
 */
function deleteAsset(id) {
  state.assets = state.assets.filter(a => a.id !== id);
  // Remove from all monthly records
  Object.keys(state.records).forEach(month => {
    if (state.records[month][id]) {
      delete state.records[month][id];
    }
  });
  saveState();
}

/**
 * Get all months with records
 */
function getMonths() {
  return Object.keys(state.records).sort();
}

/**
 * Get records for a specific month
 */
function getRecordsForMonth(monthStr) {
  return state.records[monthStr] || {};
}

/**
 * Update or insert a record for a specific asset in a month
 */
function updateMonthlyRecord(monthStr, assetId, invested, current, units = 0) {
  if (!state.records[monthStr]) {
    state.records[monthStr] = {};
  }
  state.records[monthStr][assetId] = {
    invested: Number(invested) || 0,
    current: Number(current) || 0,
    units: Number(units) || 0
  };
  saveState();
}

/**
 * Copy all records from a source month to a target month (pre-filling inputs)
 */
function cloneMonthRecords(srcMonth, targetMonth) {
  if (state.records[srcMonth]) {
    state.records[targetMonth] = JSON.parse(JSON.stringify(state.records[srcMonth]));
    saveState();
  }
}

/**
 * Delete all records for a given month
 */
function deleteMonthRecords(monthStr) {
  if (state.records[monthStr]) {
    delete state.records[monthStr];
    saveState();
  }
}

/**
 * Calculate portfolio-wide metrics for a specific month,
 * including MoM comparisons if a previous month exists.
 * Distinguishes between actual Investments (non-Goal categories) and Goals.
 */
function getPortfolioMetrics(monthStr) {
  const months = getMonths();
  const index = months.indexOf(monthStr);
  const currentRecords = state.records[monthStr] || {};

  let totalInvested = 0;
  let totalCurrentInvestments = 0;
  let totalCurrent = 0; // Net Worth (includes Goals)

  // Sum up all assets for the current month
  state.assets.forEach(asset => {
    const record = currentRecords[asset.id];
    if (record) {
      totalCurrent += record.current;
      const isInvestment = asset.category !== 'Goals' && asset.category !== 'Emergency Fund';
      if (isInvestment) {
        totalInvested += record.invested;
        totalCurrentInvestments += record.current;
      }
    }
  });

  const absoluteGain = totalCurrentInvestments - totalInvested;
  const absoluteGainPercent = totalInvested > 0 ? (absoluteGain / totalInvested) * 100 : 0;

  let momMetrics = null;

  // Calculate differences compared to previous month
  if (index > 0) {
    const prevMonthStr = months[index - 1];
    const prevRecords = state.records[prevMonthStr] || {};

    let prevTotalInvested = 0;
    let prevTotalCurrentInvestments = 0;
    let prevTotalCurrent = 0;

    state.assets.forEach(asset => {
      const record = prevRecords[asset.id];
      if (record) {
        prevTotalCurrent += record.current;
        const isInvestment = asset.category !== 'Goals' && asset.category !== 'Emergency Fund';
        if (isInvestment) {
          prevTotalInvested += record.invested;
          prevTotalCurrentInvestments += record.current;
        }
      }
    });

    // Net Worth Change (includes Goals)
    const netWorthChange = totalCurrent - prevTotalCurrent;
    const netWorthChangePercent = prevTotalCurrent > 0 ? (netWorthChange / prevTotalCurrent) * 100 : 0;

    // Investment contributions (excludes Goals)
    const contributions = totalInvested - prevTotalInvested;

    // Market return on investments (excludes Goals)
    const marketGain = (totalCurrentInvestments - totalInvested) - (prevTotalCurrentInvestments - prevTotalInvested);

    momMetrics = {
      prevMonth: prevMonthStr,
      netWorthChange,
      netWorthChangePercent,
      contributions,
      marketGain
    };
  }

  return {
    month: monthStr,
    totalInvested,             // Excludes Goals
    totalCurrentInvestments,  // Excludes Goals
    totalCurrent,             // Includes Goals (Net Worth)
    absoluteGain,             // Excludes Goals
    absoluteGainPercent,      // Excludes Goals
    mom: momMetrics
  };
}

/**
 * Get category breakdown for a specific month
 */
function getCategoryBreakdown(monthStr) {
  const records = state.records[monthStr] || {};
  const breakdown = {};

  state.assets.forEach(asset => {
    const record = records[asset.id];
    if (record) {
      if (!breakdown[asset.category]) {
        breakdown[asset.category] = { invested: 0, current: 0 };
      }
      breakdown[asset.category].invested += record.invested;
      breakdown[asset.category].current += record.current;
    }
  });

  return breakdown;
}

/**
 * Get detailed asset comparisons between a month and the previous month
 */
function getAssetPerformanceList(monthStr) {
  const months = getMonths();
  const index = months.indexOf(monthStr);
  const currentRecords = state.records[monthStr] || {};
  const prevMonthStr = index > 0 ? months[index - 1] : null;
  const prevRecords = prevMonthStr ? (state.records[prevMonthStr] || {}) : {};

  return state.assets.map(asset => {
    const curr = currentRecords[asset.id];
    const prev = prevRecords[asset.id];

    if (!curr) return null; // Asset was not active or tracked this month

    const gain = curr.current - curr.invested;
    const gainPercent = curr.invested > 0 ? (gain / curr.invested) * 100 : 0;

    let momChangeInvested = 0;
    let momChangeCurrent = 0;

    if (prev) {
      momChangeInvested = curr.invested - prev.invested;
      momChangeCurrent = curr.current - prev.current;
    } else if (prevMonthStr) {
      // Asset is new in the current month
      momChangeInvested = curr.invested;
      momChangeCurrent = curr.current;
    }

    return {
      asset,
      units: curr.units,
      invested: curr.invested,
      current: curr.current,
      gain,
      gainPercent,
      momChangeInvested,
      momChangeCurrent,
      isNew: !prev && !!prevMonthStr
    };
  }).filter(Boolean);
}

/**
 * Get trend analysis for charts
 */
function getTrendData() {
  const months = getMonths();
  const trend = months.map(month => {
    const metrics = getPortfolioMetrics(month);
    const catBreakdown = getCategoryBreakdown(month);

    const categoriesVal = {};
    Object.keys(catBreakdown).forEach(cat => {
      categoriesVal[cat] = catBreakdown[cat].current;
    });

    return {
      month,
      totalInvested: metrics.totalInvested,
      totalCurrent: metrics.totalCurrent,
      profit: metrics.absoluteGain,
      categories: categoriesVal
    };
  });

  return trend;
}

/**
 * Export state as JSON string
 */
function exportData() {
  return JSON.stringify(state, null, 2);
}

/**
 * Import state from a JSON string with basic validation
 */
function importData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && Array.isArray(parsed.assets) && parsed.records && typeof parsed.records === 'object') {
      state = parsed;
      saveState();
      return true;
    }
  } catch (e) {
    console.error("Failed to parse import data", e);
  }
  return false;
}

/**
 * Reset state to preloaded Excel sheet data
 */
function resetData() {
  state = {
    assets: [...DEFAULT_ASSETS],
    records: JSON.parse(JSON.stringify(DEFAULT_RECORDS))
  };
  saveState();
  return state;
}

// Expose state API globally
window.portfolioState = {
  getCloudConfig,
  saveCloudConfig,
  hasCloudConfig,
  saveState,
  loadState,
  getAssets,
  addAsset,
  updateAsset,
  deleteAsset,
  getMonths,
  getRecordsForMonth,
  updateMonthlyRecord,
  cloneMonthRecords,
  deleteMonthRecords,
  getPortfolioMetrics,
  getCategoryBreakdown,
  getAssetPerformanceList,
  getTrendData,
  exportData,
  importData,
  resetData
};
