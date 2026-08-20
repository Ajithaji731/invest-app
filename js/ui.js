/**
 * UI Renderer and Event Handler
 * Manages view switching, table population, form rendering, and UI formatting.
 */

// DOM Elements Cache
const elements = {
  // Navigation
  navItems: document.querySelectorAll('.nav-item'),
  viewSections: document.querySelectorAll('.view-section'),
  viewTitle: document.getElementById('viewTitle'),
  menuToggleBtn: document.getElementById('menuToggleBtn'),
  sidebar: document.getElementById('sidebar'),

  // Header Month Selector
  globalMonthSelect: document.getElementById('globalMonthSelect'),
  globalMonthWrapper: document.getElementById('globalMonthWrapper'),

  // Dashboard KPI
  kpiNetWorth: document.getElementById('kpi-net-worth'),
  kpiNetWorthChange: document.getElementById('kpi-net-worth-change'),
  kpiInvested: document.getElementById('kpi-invested'),
  kpiInvestedChange: document.getElementById('kpi-invested-change'),
  kpiProfit: document.getElementById('kpi-profit'),
  kpiProfitPercent: document.getElementById('kpi-profit-percent'),
  kpiMomGain: document.getElementById('kpi-mom-gain'),
  kpiMomPercent: document.getElementById('kpi-mom-percent'),
  dashboardDiffBanner: document.getElementById('dashboardDiffBanner'),
  diffBannerTitle: document.getElementById('diffBannerTitle'),
  diffBannerDesc: document.getElementById('diffBannerDesc'),
  diffBannerValue: document.getElementById('diffBannerValue'),
  categoryBreakdownTable: document.getElementById('categoryBreakdownTable').querySelector('tbody'),

  // Assets View
  assetsTable: document.getElementById('assetsTable').querySelector('tbody'),
  openAddAssetModalBtn: document.getElementById('openAddAssetModalBtn'),
  addAssetModal: document.getElementById('addAssetModal'),
  addAssetForm: document.getElementById('addAssetForm'),

  // Edit Asset Modal
  editAssetModal: document.getElementById('editAssetModal'),
  editAssetForm: document.getElementById('editAssetForm'),
  editAssetId: document.getElementById('editAssetId'),
  editAssetNameInput: document.getElementById('editAssetNameInput'),
  editAssetSectorInput: document.getElementById('editAssetSectorInput'),

  // Monthly Records View
  recordMonthInput: document.getElementById('recordMonthInput'),
  monthStatusBadgeContainer: document.getElementById('monthStatusBadgeContainer'),
  clonePreviousMonthBtn: document.getElementById('clonePreviousMonthBtn'),
  deleteMonthBtn: document.getElementById('deleteMonthBtn'),
  recordsFormContainer: document.getElementById('recordsFormContainer'),
  monthlyRecordsForm: document.getElementById('monthlyRecordsForm'),
  saveRecordsBtn: document.getElementById('saveRecordsBtn'),

  // Analysis View
  analysisMonthName: document.getElementById('analysisMonthName'),
  analysisTopAsset: document.getElementById('analysis-top-asset'),
  analysisTopAssetPct: document.getElementById('analysis-top-asset-pct'),
  analysisAvgInvestment: document.getElementById('analysis-avg-investment'),
  analysisBestClass: document.getElementById('analysis-best-class'),
  analysisBestClassPct: document.getElementById('analysis-best-class-pct'),
  assetPerformanceTable: document.getElementById('assetPerformanceTable').querySelector('tbody'),

  // Settings View
  exportTextarea: document.getElementById('exportTextarea'),
  copyJsonBtn: document.getElementById('copyJsonBtn'),
  downloadFileBtn: document.getElementById('downloadFileBtn'),
  importTextarea: document.getElementById('importTextarea'),
  importFile: document.getElementById('importFile'),
  importJsonBtn: document.getElementById('importJsonBtn'),
  resetDemoBtn: document.getElementById('resetDemoBtn'),
  clearAllDataBtn: document.getElementById('clearAllDataBtn'),
  fetchLiveNavsBtn: document.getElementById('fetchLiveNavsBtn'),

  // Quick Actions
  quickAddRecordBtn: document.getElementById('quickAddRecordBtn')
};

// State trackers for active view and selected month
let currentView = 'dashboard';
let selectedMonth = '';
let isDraftMode = false;

/**
 * Format raw numbers into Indian Rupees currency format
 */
function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format percentages with sign and color coding
 */
function formatPercent(value, showPlus = true) {
  if (value === undefined || value === null || isNaN(value)) return '0.00%';
  const prefix = showPlus && value > 0 ? '+' : '';
  const rounded = value.toFixed(2) + '%';

  if (value > 0.01) {
    return `<span class="trend-up">${prefix}${rounded} <i class="fa-solid fa-caret-up"></i></span>`;
  } else if (value < -0.01) {
    return `<span class="trend-down">${rounded} <i class="fa-solid fa-caret-down"></i></span>`;
  } else {
    return `<span class="trend-neutral">${rounded}</span>`;
  }
}

/**
 * Convert YYYY-MM to readable month (e.g. June 2026)
 */
function formatMonthName(monthStr) {
  if (!monthStr || !monthStr.includes('-')) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month) - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Initialize month selector dropdowns
 */
function updateMonthDropdowns() {
  const months = portfolioState.getMonths();

  // If no months, hide selector
  if (months.length === 0) {
    elements.globalMonthWrapper.style.display = 'none';
    selectedMonth = '';
    return;
  }

  elements.globalMonthWrapper.style.display = 'flex';

  // Keep previous selection if still valid, otherwise pick the latest month
  if (!selectedMonth || !months.includes(selectedMonth)) {
    selectedMonth = months[months.length - 1]; // latest month
  }

  elements.globalMonthSelect.innerHTML = months.map(m => {
    const formatted = formatMonthName(m);
    const selectedAttr = m === selectedMonth ? 'selected' : '';
    return `<option value="${m}" ${selectedAttr}>${formatted}</option>`;
  }).join('');
}

/**
 * Route views and render appropriate screens
 */
function switchView(viewName) {
  currentView = viewName;
  isDraftMode = false; // Reset draft mode when switching tabs

  // Toggle navigation class
  elements.navItems.forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Toggle view container visibility
  elements.viewSections.forEach(sec => {
    if (sec.id === `view-${viewName}`) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  // Update Top Title
  const titles = {
    'dashboard': 'Financial Dashboard',
    'investments': 'Asset Inventory',
    'monthly-records': 'Monthly Portfolio Update',
    'analysis': 'Investment Performance Analysis',
    'settings': 'Data Management & Settings'
  };
  elements.viewTitle.textContent = titles[viewName] || 'Portfolio Tracker';

  // Toggle Month Selector in Header (only show for dashboard and analysis)
  if (viewName === 'dashboard' || viewName === 'analysis') {
    elements.globalMonthWrapper.style.display = portfolioState.getMonths().length > 0 ? 'flex' : 'none';
  } else {
    elements.globalMonthWrapper.style.display = 'none';
  }

  // Render view-specific data
  renderCurrentView();

  // Close mobile menu on switch
  elements.sidebar.classList.remove('open');
}

/**
 * Render the currently active view content
 */
function renderCurrentView() {
  switch (currentView) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'investments':
      renderAssets();
      break;
    case 'monthly-records':
      renderMonthlyUpdateView();
      break;
    case 'analysis':
      renderAnalysis();
      break;
    case 'settings':
      renderSettings();
      break;
  }
}

/* =========================================================================
   DASHBOARD RENDERER
   ========================================================================= */
function renderDashboard() {
  if (!selectedMonth) {
    showEmptyDashboardState();
    return;
  }

  const metrics = portfolioState.getPortfolioMetrics(selectedMonth);

  // Net Worth KPI
  elements.kpiNetWorth.textContent = formatCurrency(metrics.totalInvested);
  if (metrics.mom && metrics.mom.change !== undefined) {
    const investedDiff = metrics.mom.change;
    const sign = investedDiff >= 0 ? '+' : '';
    elements.kpiNetWorthChange.innerHTML = `<span class="${investedDiff > 0 ? 'trend-up' : investedDiff < 0 ? 'trend-down' : 'trend-neutral'}">${sign}${formatCurrency(investedDiff)} additions</span>`;
  } else {
    elements.kpiNetWorthChange.innerHTML = `<span class="text-muted">First recorded month</span>`;
  }

  // Total Core Invested KPI
  elements.kpiInvested.textContent = formatCurrency(metrics.totalCoreInvested);
  // (Change footer is static "Excludes Emergency Fund & Goals")

  // MoM Return KPI
  if (metrics.mom && metrics.mom.change !== undefined) {
    elements.kpiMomGain.textContent = formatCurrency(metrics.mom.change);
    const momYield = (metrics.totalInvested - metrics.mom.change) > 0 ? (metrics.mom.change / (metrics.totalInvested - metrics.mom.change)) * 100 : 0;
    elements.kpiMomPercent.innerHTML = `${formatPercent(momYield)} growth`;
  } else {
    elements.kpiMomGain.textContent = '₹0.00';
    elements.kpiMomPercent.innerHTML = `<span class="text-muted">First recorded month</span>`;
  }

  // Render Difference Banner
  elements.dashboardDiffBanner.style.display = 'flex';
  if (metrics.mom && metrics.mom.change !== undefined) {
    const totalChange = metrics.mom.change;
    const isPositive = totalChange >= 0;
    elements.dashboardDiffBanner.className = isPositive ? 'diff-banner' : 'diff-banner negative';

    elements.diffBannerTitle.innerHTML = `Portfolio change in <strong>${formatMonthName(selectedMonth)}</strong>: <strong>${formatCurrency(totalChange)}</strong>`;
    elements.diffBannerDesc.innerHTML = `Total new investments added to the portfolio.`;
    const momYield = (metrics.totalInvested - metrics.mom.change) > 0 ? (metrics.mom.change / (metrics.totalInvested - metrics.mom.change)) * 100 : 0;
    elements.diffBannerValue.innerHTML = `${isPositive ? '+' : ''}${momYield.toFixed(1)}%`;
  } else {
    elements.dashboardDiffBanner.className = 'diff-banner';
    elements.diffBannerTitle.innerHTML = `Historical progression starting in <strong>${formatMonthName(selectedMonth)}</strong>`;
    elements.diffBannerDesc.innerHTML = `Total starting invested value is ${formatCurrency(metrics.totalInvested)}. Add monthly updates to see differences!`;
    elements.diffBannerValue.innerHTML = `100%`;
  }

  // Category Table Breakdown
  const totalValue = metrics.totalInvested;

  elements.categoryBreakdownTable.innerHTML = Object.keys(metrics.breakdown).map(cat => {
    const item = metrics.breakdown[cat];
    const share = totalValue > 0 ? (item.invested / totalValue) * 100 : 0;

    return `
      <tr>
        <td><span class="badge badge-${cat.toLowerCase().replace(/[^a-z0-9]/g, '')}">${cat}</span></td>
        <td><strong>${formatCurrency(item.invested)}</strong></td>
        <td>${share.toFixed(1)}%</td>
      </tr>
    `;
  }).join('');

  // Charts
  portfolioCharts.renderAllocationChart(metrics.breakdown);
  
  const allMonths = portfolioState.getMonths();
  const trendData = allMonths.map(m => {
    return { month: m, totalInvested: portfolioState.getPortfolioMetrics(m).totalInvested };
  });
  portfolioCharts.renderInvestedTrendChart(trendData);

}

function showEmptyDashboardState() {
  elements.kpiNetWorth.textContent = '₹0.00';
  elements.kpiNetWorthChange.textContent = 'No records';
  elements.kpiInvested.textContent = '₹0.00';
  elements.kpiInvestedChange.textContent = 'No records';
  elements.kpiProfit.textContent = '₹0.00';
  elements.kpiProfitPercent.textContent = 'No records';
  elements.kpiMomGain.textContent = '₹0.00';
  elements.kpiMomPercent.textContent = 'No records';

  elements.dashboardDiffBanner.style.display = 'none';
  elements.categoryBreakdownTable.innerHTML = `<tr><td colspan="6" style="text-align: center;" class="text-muted">No data available. Go to "Monthly Updates" or load preloaded data.</td></tr>`;

  portfolioCharts.renderAllocationChart({});
  portfolioCharts.renderNetWorthTrendChart([]);
}

/* =========================================================================
   ASSETS LIST RENDERER
   ========================================================================= */
function renderAssets() {
  const assets = portfolioState.getAssets();

  if (assets.length === 0) {
    elements.assetsTable.innerHTML = `<tr><td colspan="4" style="text-align: center;" class="text-muted">No assets found. Click "Add Asset" to start tracking!</td></tr>`;
    return;
  }

  elements.assetsTable.innerHTML = assets.map(asset => {
    return `
      <tr>
        <td><strong>${asset.name}</strong></td>
        <td><span class="badge badge-${asset.category.toLowerCase().replace(/[^a-z0-9]/g, '')}">${asset.category}</span></td>
        <td class="text-secondary">${asset.sector || '-'}</td>
        <td class="actions">
          <button class="btn btn-icon edit-asset-btn" data-id="${asset.id}" title="Edit asset name/sector"><i class="fa-solid fa-pencil"></i></button>
          <button class="btn btn-icon btn-danger delete-asset-btn" data-id="${asset.id}" title="Delete asset"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach event listeners to Edit and Delete buttons
  document.querySelectorAll('.edit-asset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const asset = assets.find(a => a.id === id);
      if (asset) {
        elements.editAssetId.value = asset.id;
        elements.editAssetNameInput.value = asset.name;
        elements.editAssetSectorInput.value = asset.sector || '';
        document.getElementById('editAssetSchemeCodeInput').value = asset.schemeCode || '';
        elements.editAssetModal.classList.add('active');
      }
    });
  });

  document.querySelectorAll('.delete-asset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const asset = assets.find(a => a.id === id);
      if (asset && confirm(`Are you sure you want to delete "${asset.name}"? This will delete all historical records for this asset as well!`)) {
        portfolioState.deleteAsset(id);
        renderAssets();
        updateMonthDropdowns();
      }
    });
  });
}

/* =========================================================================
   MONTHLY UPDATES RENDERER
   ========================================================================= */
let recordEditMonth = '';

function renderMonthlyUpdateView() {
  const months = portfolioState.getMonths();

  if (!recordEditMonth) {
    if (months.length > 0) {
      recordEditMonth = months[months.length - 1]; // default to latest
    } else {
      const d = new Date();
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      recordEditMonth = mStr;
    }
  }

  elements.recordMonthInput.value = recordEditMonth;

  const assets = portfolioState.getAssets();
  if (assets.length === 0) {
    elements.recordsFormContainer.innerHTML = `<div class="text-muted" style="text-align: center; padding: 24px;">Please add some assets first on the "Asset List" page!</div>`;
    elements.saveRecordsBtn.style.display = 'none';
    elements.clonePreviousMonthBtn.style.display = 'none';
    elements.deleteMonthBtn.style.display = 'none';
    if (elements.fetchLiveNavsBtn) elements.fetchLiveNavsBtn.style.display = 'none';
    if (elements.monthStatusBadgeContainer) elements.monthStatusBadgeContainer.innerHTML = '';
    return;
  }

  const isSaved = months.includes(recordEditMonth);

  // Set up badges and buttons visibility based on month state
  let statusHtml = '';
  if (isSaved) {
    statusHtml = `<span class="badge" style="background-color: rgba(16, 185, 129, 0.15); color: var(--success); text-transform: none; padding: 6px 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-circle-check"></i> Saved</span>`;
    elements.saveRecordsBtn.style.display = 'inline-flex';
    elements.deleteMonthBtn.style.display = 'inline-flex';
    elements.clonePreviousMonthBtn.style.display = 'none';
    if (elements.fetchLiveNavsBtn) elements.fetchLiveNavsBtn.style.display = 'inline-flex';
  } else if (isDraftMode) {
    statusHtml = `<span class="badge" style="background-color: rgba(245, 158, 11, 0.15); color: var(--warning); text-transform: none; padding: 6px 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-pen-to-square"></i> Draft (Unsaved)</span>`;
    elements.saveRecordsBtn.style.display = 'inline-flex';
    elements.deleteMonthBtn.style.display = 'none';
    elements.clonePreviousMonthBtn.style.display = 'inline-flex';
    if (elements.fetchLiveNavsBtn) elements.fetchLiveNavsBtn.style.display = 'inline-flex';
  } else {
    statusHtml = `<span class="badge" style="background-color: rgba(148, 163, 184, 0.15); color: var(--text-secondary); text-transform: none; padding: 6px 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-circle-question"></i> Not Initialized</span>`;
    elements.saveRecordsBtn.style.display = 'none';
    elements.deleteMonthBtn.style.display = 'none';
    elements.clonePreviousMonthBtn.style.display = 'none';
    if (elements.fetchLiveNavsBtn) elements.fetchLiveNavsBtn.style.display = 'none';
  }

  if (elements.monthStatusBadgeContainer) {
    elements.monthStatusBadgeContainer.innerHTML = statusHtml;
  }

  // If not saved and not in draft mode, show empty-state card to initialize
  if (!isSaved && !isDraftMode) {
    let emptyHtml = `
      <div class="empty-state-card" style="text-align: center; padding: 48px 24px; background: rgba(255, 255, 255, 0.01); border: 1px dashed var(--border-color); border-radius: var(--border-radius-md); display: flex; flex-direction: column; align-items: center; gap: 16px;">
        <div style="font-size: 44px; color: var(--text-secondary); opacity: 0.5;"><i class="fa-regular fa-calendar-plus"></i></div>
        <h4 style="font-family: var(--font-heading); font-size: 18px; margin: 0; color: var(--text-primary);">No records for ${formatMonthName(recordEditMonth)}</h4>
        <p style="color: var(--text-secondary); font-size: 13.5px; max-width: 440px; margin: 0; line-height: 1.6;">
          This month has not been initialized in your portfolio yet. Click "Initialize Month" below to load your active asset checklist, specify any additions, and save valuations.
        </p>
        <button type="button" class="btn btn-primary" id="startDraftBtn" style="padding: 10px 20px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-play"></i> Initialize Month
        </button>
      </div>
    `;
    elements.recordsFormContainer.innerHTML = emptyHtml;

    const startDraftBtn = document.getElementById('startDraftBtn');
    if (startDraftBtn) {
      startDraftBtn.addEventListener('click', () => {
        isDraftMode = true;
        renderMonthlyUpdateView();
      });
    }
    return;
  }

  // Render form (either for saved records or draft editing records)
  const currentMonthRecords = portfolioState.getRecordsForMonth(recordEditMonth);

  // Find the chronologically previous month from the list of saved months
  const priorMonths = months.filter(m => m < recordEditMonth).sort();
  const prevMonthStr = priorMonths.length > 0 ? priorMonths[priorMonths.length - 1] : '';
  const prevMonthRecords = prevMonthStr ? portfolioState.getRecordsForMonth(prevMonthStr) : {};

  // Show clone button only if there is a previous month and current month is unsaved
  const showClone = prevMonthStr !== '' && !isSaved;
  elements.clonePreviousMonthBtn.style.display = showClone ? 'inline-flex' : 'none';

  // Group assets by category
  const grouped = {};
  const categories = ['Stocks/ETFs', 'Mutual Funds', 'EPF', 'PPF', 'NPS', 'Goals', 'Gold Investment', 'Emergency Fund'];
  categories.forEach(cat => grouped[cat] = []);
  assets.forEach(asset => {
    if (grouped[asset.category]) {
      grouped[asset.category].push(asset);
    } else {
      grouped[asset.category] = [asset];
    }
  });

  const headerHtml = `
    <div class="record-form-row header" style="margin-bottom: 12px; grid-template-columns: 2fr 1fr 1fr;">
      <div>Asset Name & Category</div>
      <div>Prev Invested</div>
      <div>This Month's Addition <span style="font-size: 10px; font-weight: normal; opacity: 0.65; display: block; margin-top: 2px;">(Enter +/- amount)</span></div>
    </div>
  `;

  let html = '';

  Object.keys(grouped).forEach(category => {
    const catAssets = grouped[category];
    if (catAssets.length === 0) return;

    html += `
      <div class="category-section-header" style="grid-column: 1 / -1; margin-top: 28px; margin-bottom: 12px; font-family: var(--font-heading); font-size: 14px; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
        <span class="badge badge-${category.toLowerCase().replace(/[^a-z0-9]/g, '')}">${category}</span>
      </div>
    `;

    catAssets.forEach(asset => {
      const prev = prevMonthRecords[asset.id] || { invested: 0 };
      const curr = currentMonthRecords[asset.id];

      let addition = 0;
      if (curr) {
        addition = curr.invested - prev.invested;
      }

      html += `
        <div class="record-form-row" data-asset-id="${asset.id}" data-category="${category}" style="margin-bottom: 8px; grid-template-columns: 2fr 1fr 1fr;">
          <div class="asset-info">
            <span class="asset-name">${asset.name}</span>
            <span class="asset-category">${asset.category} ${asset.sector ? `· ${asset.sector}` : ''}</span>
          </div>
          <div style="font-size: 13px; font-weight: 500; color: var(--text-secondary);">
            ${formatCurrency(prev.invested)}
          </div>
          <div>
            <input type="number" step="any" placeholder="+/- Addition" class="form-input record-addition" value="${addition !== 0 ? addition : ''}" data-prev-invested="${prev.invested}" title="Enter addition for ${asset.name}">
          </div>
        </div>
      `;
    });
  });

  elements.recordsFormContainer.innerHTML = headerHtml + html;
}

/* =========================================================================
   ANALYSIS RENDERER
   ========================================================================= */
function renderAnalysis() {
  if (!selectedMonth) {
    elements.analysisMonthName.textContent = 'No Data';
    elements.analysisTopAsset.textContent = '-';
    elements.analysisTopAssetPct.textContent = '-';
    elements.analysisBestClass.textContent = '-';
    elements.analysisBestClassPct.textContent = '-';
    elements.analysisAvgInvestment.textContent = '₹0.00';
    elements.assetPerformanceTable.innerHTML = `<tr><td colspan="9" style="text-align: center;" class="text-muted">No data available to analyze. Please add updates.</td></tr>`;
    return;
  }

  elements.analysisMonthName.textContent = formatMonthName(selectedMonth);

  const months = portfolioState.getMonths();
  let totalInvestmentsSum = 0;
  months.forEach(m => {
    const metrics = portfolioState.getPortfolioMetrics(m);
    totalInvestmentsSum += metrics.totalInvested;
  });
  const avgInvestment = months.length > 0 ? totalInvestmentsSum / months.length : 0;
  elements.analysisAvgInvestment.textContent = formatCurrency(avgInvestment);

  const perfList = portfolioState.getAssetPerformanceList(selectedMonth);

  if (perfList.length === 0) {
    elements.assetPerformanceTable.innerHTML = `<tr><td colspan="9" style="text-align: center;" class="text-muted">No records for this month.</td></tr>`;
    return;
  }

  // Group Stocks/ETFs into a single portfolio entry
  const stockPerfs = perfList.filter(p => p.asset.category === 'Stocks/ETFs');
  let stockSummary = null;
  if (stockPerfs.length > 0) {
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalMomChangeInvested = 0;
    let totalMomChangeCurrent = 0;
    let isNew = stockPerfs.every(p => p.isNew);

    stockPerfs.forEach(p => {
      totalInvested += p.invested;
      totalCurrent += p.current;
      totalMomChangeInvested += p.momChangeInvested;
      totalMomChangeCurrent += p.momChangeCurrent;
    });

    const totalGain = totalCurrent - totalInvested;
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    stockSummary = {
      asset: {
        id: 'stocks_etfs_summary',
        name: 'Stocks/ETFs Portfolio',
        category: 'Stocks/ETFs',
        sector: 'Combined Stocks'
      },
      units: 0,
      invested: totalInvested,
      current: totalCurrent,
      gain: totalGain,
      gainPercent: totalGainPercent,
      momChangeInvested: totalMomChangeInvested,
      momChangeCurrent: totalMomChangeCurrent,
      isNew: isNew
    };
  }

  const finalPerfList = [];
  if (stockSummary) {
    finalPerfList.push(stockSummary);
  }
  const otherPerfs = perfList.filter(p => p.asset.category !== 'Stocks/ETFs');
  finalPerfList.push(...otherPerfs);

  // Sort performance list by category order: Stocks/ETFs -> Mutual Funds -> rest
  const categoryOrder = {
    'Stocks/ETFs': 1,
    'Mutual Funds': 2,
    'EPF': 3,
    'PPF': 4,
    'NPS': 5,
    'Goals': 6,
    'Gold Investment': 7,
    'Emergency Fund': 8
  };
  const allAssets = portfolioState.getAssets();
  finalPerfList.sort((a, b) => {
    const orderA = categoryOrder[a.asset.category] || 99;
    const orderB = categoryOrder[b.asset.category] || 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return allAssets.findIndex(asset => asset.id === a.asset.id) - allAssets.findIndex(asset => asset.id === b.asset.id);
  });

  const activePerf = finalPerfList.filter(p => p.invested > 0);
  activePerf.sort((a, b) => b.gainPercent - a.gainPercent);

  if (activePerf.length > 0) {
    elements.analysisTopAsset.textContent = activePerf[0].asset.name;
    elements.analysisTopAssetPct.innerHTML = `Most Additions`;
  } else {
    elements.analysisTopAsset.textContent = '-';
    elements.analysisTopAssetPct.textContent = '-';
  }

  const classBreakdown = portfolioState.getCategoryBreakdown(selectedMonth);
  let bestClass = '-';
  let bestClassVal = -1;

  Object.keys(classBreakdown).forEach(cat => {
    const c = classBreakdown[cat];
    if (c.invested > bestClassVal) {
      bestClassVal = c.invested;
      bestClass = cat;
    }
  });

  if (bestClass !== '-') {
    elements.analysisBestClass.textContent = bestClass;
    elements.analysisBestClassPct.innerHTML = `Most Invested Category`;
  } else {
    elements.analysisBestClass.textContent = '-';
    elements.analysisBestClassPct.textContent = '-';
  }

  // Render Performance Table
  elements.assetPerformanceTable.innerHTML = finalPerfList.map(p => {
    const momInv = p.isNew ? `+${formatCurrency(p.momChangeInvested)} (New)` : p.momChangeInvested > 0 ? `+${formatCurrency(p.momChangeInvested)}` : p.momChangeInvested < 0 ? `-${formatCurrency(Math.abs(p.momChangeInvested))}` : '₹0.00';
    const momInvClass = p.isNew || p.momChangeInvested > 0 ? 'trend-up' : p.momChangeInvested < 0 ? 'trend-down' : 'trend-neutral';

    return `
      <tr>
        <td><strong>${p.asset.name}</strong></td>
        <td><span class="badge badge-${p.asset.category.toLowerCase().replace(/[^a-z0-9]/g, '')}">${p.asset.category}</span></td>
        <td><strong>${formatCurrency(p.invested)}</strong></td>
        <td class="${momInvClass}">${momInv}</td>
      </tr>
    `;
  }).join('');
}

/* =========================================================================
   SETTINGS RENDERER
   ========================================================================= */
function renderSettings() {
  elements.exportTextarea.value = portfolioState.exportData();
  elements.importTextarea.value = '';

  // Render Cloud Sync Settings if they exist
  const cloudConfig = portfolioState.getCloudConfig();
  const gistIdInput = document.getElementById('gistIdInput');
  const tokenInput = document.getElementById('githubTokenInput');
  if (gistIdInput) gistIdInput.value = cloudConfig.gistId || '';
  if (tokenInput) tokenInput.value = cloudConfig.token || '';
}


/* =========================================================================
   MODALS CLOSING UTILITIES
   ========================================================================= */
function setupModals() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('active');
      }
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
}

/* =========================================================================
   GLOBAL EVENT LISTENERS ATTACHMENT
   ========================================================================= */
function setupEventListeners() {

  elements.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });

  elements.menuToggleBtn.addEventListener('click', () => {
    elements.sidebar.classList.toggle('open');
  });

  elements.globalMonthSelect.addEventListener('change', (e) => {
    selectedMonth = e.target.value;
    renderCurrentView();
  });

  elements.quickAddRecordBtn.addEventListener('click', () => {
    switchView('monthly-records');
  });

  elements.openAddAssetModalBtn.addEventListener('click', () => {
    elements.addAssetForm.reset();
    elements.addAssetModal.classList.add('active');
  });

  elements.addAssetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('assetNameInput').value;
    const category = document.getElementById('assetCategorySelect').value;
    const sector = document.getElementById('assetSectorInput').value;
    const schemeCode = document.getElementById('assetSchemeCodeInput').value;

    portfolioState.addAsset(name, category, sector, schemeCode);
    elements.addAssetModal.classList.remove('active');

    renderAssets();
    if (currentView === 'monthly-records') {
      renderMonthlyUpdateView();
    }
  });

  elements.editAssetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = elements.editAssetId.value;
    const name = elements.editAssetNameInput.value;
    const sector = elements.editAssetSectorInput.value;
    const schemeCode = document.getElementById('editAssetSchemeCodeInput').value;

    portfolioState.updateAsset(id, name, sector, schemeCode);
    elements.editAssetModal.classList.remove('active');
    renderAssets();
  });

  elements.recordMonthInput.addEventListener('change', (e) => {
    recordEditMonth = e.target.value;
    isDraftMode = false; // Reset draft mode when month is changed
    renderMonthlyUpdateView();
  });

  elements.clonePreviousMonthBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const months = portfolioState.getMonths();
    const currentIdx = months.indexOf(recordEditMonth);

    let srcIdx = currentIdx - 1;
    if (srcIdx < 0 && months.length > 0) {
      srcIdx = months.length - 1;
    }

    if (srcIdx >= 0 && months[srcIdx] !== recordEditMonth) {
      portfolioState.cloneMonthRecords(months[srcIdx], recordEditMonth);
      renderMonthlyUpdateView();
      alert(`Successfully pre-filled data using records from ${formatMonthName(months[srcIdx])}.`);
    }
  });

  // Fetch live NAVs event listener
  if (elements.fetchLiveNavsBtn) {
    elements.fetchLiveNavsBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      await fetchLiveNAVs();
    });
  }

  // No more valuation inputs to auto-calculate.

  elements.deleteMonthBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm(`Are you sure you want to delete all valuations recorded for ${formatMonthName(recordEditMonth)}?`)) {
      portfolioState.deleteMonthRecords(recordEditMonth);

      const remainingMonths = portfolioState.getMonths();
      recordEditMonth = remainingMonths.length > 0 ? remainingMonths[remainingMonths.length - 1] : '';

      updateMonthDropdowns();
      renderMonthlyUpdateView();
    }
  });

  elements.monthlyRecordsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Process all rows normally to extract new invested amount
    const assetRows = elements.recordsFormContainer.querySelectorAll('.record-form-row[data-asset-id]');
    assetRows.forEach(row => {
      const assetId = row.getAttribute('data-asset-id');

      const additionInput = row.querySelector('.record-addition');
      const prevInvested = parseFloat(additionInput.getAttribute('data-prev-invested')) || 0;
      const addition = parseFloat(additionInput.value) || 0;

      const invested = prevInvested + addition;

      portfolioState.updateMonthlyRecord(recordEditMonth, assetId, invested);
    });

    isDraftMode = false; // Reset draft mode upon successful save
    updateMonthDropdowns();
    selectedMonth = recordEditMonth;

    await portfolioState.saveState(); // Ensure the debounced cloud sync gets queued/awaited
    alert(`Investment updates for ${formatMonthName(recordEditMonth)} saved successfully!`);
    switchView('dashboard');
  });



  elements.copyJsonBtn.addEventListener('click', () => {
    elements.exportTextarea.select();
    document.execCommand('copy');
    alert('JSON data copied to clipboard!');
  });

  elements.downloadFileBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(portfolioState.exportData());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  elements.importJsonBtn.addEventListener('click', () => {
    const jsonStr = elements.importTextarea.value.trim();
    if (!jsonStr) {
      alert('Please paste some JSON backup content first!');
      return;
    }

    if (portfolioState.importData(jsonStr)) {
      alert('Portfolio data imported successfully!');
      portfolioState.loadState();
      updateMonthDropdowns();
      switchView('dashboard');
    } else {
      alert('Invalid data structure. Failed to import. Please check your backup format.');
    }
  });

  elements.importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      const contents = evt.target.result;
      elements.importTextarea.value = contents;
      alert('File loaded into text area. Click "Restore Portfolio" to finalize.');
    };
    reader.readAsText(file);
  });

  elements.resetDemoBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to overwrite your active tracking state with the Excel sheet starting values?')) {
      portfolioState.resetData();
      portfolioState.loadState();
      updateMonthDropdowns();
      switchView('dashboard');
      alert('Successfully reloaded your historical spreadsheet records.');
    }
  });

  elements.clearAllDataBtn.addEventListener('click', () => {
    if (confirm('CAUTION: This will delete ALL assets and ALL monthly valuation records. This cannot be undone! Are you sure?')) {
      localStorage.removeItem('portfolio_tracker_state');
      location.reload();
    }
  });

  setupModals();
}

/**
 * Bootstraps the application UI
 */
function initUI() {
  updateMonthDropdowns();
  setupEventListeners();
  switchView('dashboard');
}

function resetUIState() {
  currentMonth = '';
}

// Expose UI API globally
window.portfolioUI = {
  initUI,
  switchView,
  formatCurrency,
  renderCurrentView,
  resetUIState
};
