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
  elements.kpiNetWorth.textContent = formatCurrency(metrics.totalCurrent);
  if (metrics.mom) {
    elements.kpiNetWorthChange.innerHTML = `${formatPercent(metrics.mom.netWorthChangePercent)} vs last month`;
  } else {
    elements.kpiNetWorthChange.innerHTML = `<span class="text-muted">First recorded month</span>`;
  }

  // Total Invested KPI
  elements.kpiInvested.textContent = formatCurrency(metrics.totalInvested);
  if (metrics.mom) {
    const investedDiff = metrics.mom.contributions;
    const sign = investedDiff >= 0 ? '+' : '';
    elements.kpiInvestedChange.innerHTML = `<span class="${investedDiff > 0 ? 'trend-up' : investedDiff < 0 ? 'trend-down' : 'trend-neutral'}">${sign}${formatCurrency(investedDiff)} additions</span>`;
  } else {
    elements.kpiInvestedChange.innerHTML = `<span class="text-muted">First recorded month</span>`;
  }

  // Absolute Return KPI
  elements.kpiProfit.textContent = formatCurrency(metrics.absoluteGain);
  elements.kpiProfitPercent.innerHTML = `${formatPercent(metrics.absoluteGainPercent)} absolute yield`;

  // MoM Return KPI
  if (metrics.mom) {
    elements.kpiMomGain.textContent = formatCurrency(metrics.mom.marketGain);
    const momYield = metrics.totalInvested > 0 ? (metrics.mom.marketGain / metrics.totalInvested) * 100 : 0;
    elements.kpiMomPercent.innerHTML = `${formatPercent(momYield)} month return`;
  } else {
    elements.kpiMomGain.textContent = formatCurrency(metrics.absoluteGain);
    elements.kpiMomPercent.innerHTML = `${formatPercent(metrics.absoluteGainPercent)} total return`;
  }

  // Render Difference Banner
  elements.dashboardDiffBanner.style.display = 'flex';
  if (metrics.mom) {
    const totalChange = metrics.mom.netWorthChange;
    const isPositive = totalChange >= 0;
    elements.dashboardDiffBanner.className = isPositive ? 'diff-banner' : 'diff-banner negative';
    
    elements.diffBannerTitle.innerHTML = `Portfolio change in <strong>${formatMonthName(selectedMonth)}</strong>: <strong>${formatCurrency(totalChange)}</strong>`;
    elements.diffBannerDesc.innerHTML = `Contributions: <strong>${formatCurrency(metrics.mom.contributions)}</strong> | Estimated Market Gain/Loss: <strong>${formatCurrency(metrics.mom.marketGain)}</strong>`;
    elements.diffBannerValue.innerHTML = `${isPositive ? '+' : ''}${metrics.mom.netWorthChangePercent.toFixed(1)}%`;
  } else {
    elements.dashboardDiffBanner.className = 'diff-banner';
    elements.diffBannerTitle.innerHTML = `Historical progression starting in <strong>${formatMonthName(selectedMonth)}</strong>`;
    elements.diffBannerDesc.innerHTML = `Total starting assets value is ${formatCurrency(metrics.totalCurrent)}. Add monthly updates to see differences!`;
    elements.diffBannerValue.innerHTML = `100%`;
  }

  // Category Table Breakdown
  const categoriesBreakdown = portfolioState.getCategoryBreakdown(selectedMonth);
  const totalValue = metrics.totalCurrent;
  
  elements.categoryBreakdownTable.innerHTML = Object.keys(categoriesBreakdown).map(cat => {
    const item = categoriesBreakdown[cat];
    const gain = item.current - item.invested;
    const gainPercent = item.invested > 0 ? (gain / item.invested) * 100 : 0;
    const share = totalValue > 0 ? (item.current / totalValue) * 100 : 0;
    
    return `
      <tr>
        <td><span class="badge badge-${cat.toLowerCase().replace(/[^a-z0-9]/g, '')}">${cat}</span></td>
        <td><strong>${formatCurrency(item.invested)}</strong></td>
        <td><strong>${formatCurrency(item.current)}</strong></td>
        <td><strong>${formatCurrency(gain)}</strong></td>
        <td>${formatPercent(gainPercent)}</td>
        <td>${share.toFixed(1)}%</td>
      </tr>
    `;
  }).join('');

  // Charts
  portfolioCharts.renderAllocationChart(categoriesBreakdown);
  portfolioCharts.renderNetWorthTrendChart(portfolioState.getTrendData());
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
  const categories = ['Stocks/ETFs', 'Mutual Funds', 'EPF', 'PPF', 'NPS', 'Goals', 'Emergency Fund'];
  categories.forEach(cat => grouped[cat] = []);
  assets.forEach(asset => {
    if (grouped[asset.category]) {
      grouped[asset.category].push(asset);
    } else {
      grouped[asset.category] = [asset];
    }
  });

  // Header
  const headerHtml = `
    <div class="record-form-row header" style="margin-bottom: 12px;">
      <div>Asset Name & Category</div>
      <div>Units <span style="font-size: 10px; font-weight: normal; opacity: 0.65; display: block; margin-top: 2px;">(For live price fetch)</span></div>
      <div>Prev Invested</div>
      <div>This Month's Addition <span style="font-size: 10px; font-weight: normal; opacity: 0.65; display: block; margin-top: 2px;">(Enter +/- amount)</span></div>
      <div>Current Valuation <span style="font-size: 10px; font-weight: normal; opacity: 0.65; display: block; margin-top: 2px;">(Auto-filled / Edit)</span></div>
    </div>
  `;

  let html = '';

  Object.keys(grouped).forEach(category => {
    const catAssets = grouped[category];
    if (catAssets.length === 0) return;

    // Category section header
    html += `
      <div class="category-section-header" style="grid-column: 1 / -1; margin-top: 28px; margin-bottom: 12px; font-family: var(--font-heading); font-size: 14px; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
        <span class="badge badge-${category.toLowerCase().replace(/[^a-z0-9]/g, '')}">${category}</span>
      </div>
    `;

    if (category === 'Stocks/ETFs') {
      let prevTotalStockInvested = 0;
      let prevTotalStockCurrent = 0;
      let totalStockCurrent = 0;

      catAssets.forEach(asset => {
        const prev = prevMonthRecords[asset.id] || { invested: 0, current: 0, units: 0 };
        prevTotalStockInvested += prev.invested;
        prevTotalStockCurrent += prev.current;

        const curr = currentMonthRecords[asset.id];
        if (curr) {
          totalStockCurrent += curr.current;
        }
      });

      // Default July total current valuation to June's ending valuation if we are creating a draft
      if (!isSaved && totalStockCurrent === 0) {
        totalStockCurrent = prevTotalStockCurrent;
      }

      let totalStockAddition = 0;

      catAssets.forEach(asset => {
        const prev = prevMonthRecords[asset.id] || { invested: 0, current: 0, units: 0 };
        const curr = currentMonthRecords[asset.id];

        let units = '';
        let addition = 0;

        if (curr) {
          units = curr.units !== undefined ? curr.units : '';
          addition = curr.invested - prev.invested;
        } else {
          units = prev.units !== undefined && prev.units !== 1 && prev.units !== 0 ? prev.units : '';
          addition = 0;
        }

        totalStockAddition += addition;
        const showPrevInvested = formatCurrency(prev.invested);

        html += `
          <div class="record-form-row" data-asset-id="${asset.id}" data-category="Stocks/ETFs" style="margin-bottom: 8px;">
            <div class="asset-info">
              <span class="asset-name">${asset.name}</span>
              <span class="asset-category">${asset.category} ${asset.sector ? `· ${asset.sector}` : ''}</span>
            </div>
            <div>
              <input type="number" step="any" placeholder="Units" class="form-input record-units" value="${units}" title="Enter Units for ${asset.name}">
            </div>
            <div style="font-size: 13px; font-weight: 500; color: var(--text-secondary);">
              ${showPrevInvested}
            </div>
            <div>
              <input type="number" step="any" placeholder="+/- Addition" class="form-input record-addition" value="${addition !== 0 ? addition : ''}" data-prev-invested="${prev.invested}" data-prev-current="${prev.current}" title="Enter addition for ${asset.name}">
            </div>
            <div style="text-align: center; color: var(--text-muted); font-size: 14px; padding-right: 20px;">
              —
            </div>
          </div>
        `;
      });

      // Category summary row for Stocks/ETFs
      html += `
        <div class="record-form-row stocks-summary-row" style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.15); font-weight: bold; border-radius: var(--border-radius-md); margin-top: 8px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.03);">
          <div class="asset-info" style="font-weight: bold; color: var(--color-stocks);">
            <span class="asset-name">Stocks/ETFs Category Total</span>
            <span class="asset-category" style="color: var(--text-muted);">Overall Current Valuation</span>
          </div>
          <div style="text-align: center; color: var(--text-muted); font-size: 14px; padding-right: 20px;">—</div>
          <div style="font-size: 13.5px; font-weight: bold; color: var(--text-primary);">${formatCurrency(prevTotalStockInvested)}</div>
          <div style="font-size: 13.5px; font-weight: bold; color: var(--text-primary);" id="stocks-total-addition-display">${formatCurrency(totalStockAddition)}</div>
          <div>
            <input type="number" step="any" placeholder="₹ Total Stocks Value" class="form-input record-category-current" id="stocks-total-current" value="${totalStockCurrent !== 0 ? totalStockCurrent : ''}" data-prev-total-current="${prevTotalStockCurrent}" required style="font-weight: bold; border-color: rgba(139, 92, 246, 0.3); background-color: rgba(139, 92, 246, 0.02); text-shadow: 0 0 1px rgba(255,255,255,0.05);" title="Enter total valuation for all Stocks and ETFs combined">
          </div>
        </div>
      `;
    } else {
      catAssets.forEach(asset => {
        const prev = prevMonthRecords[asset.id] || { invested: 0, current: 0, units: 0 };
        const curr = currentMonthRecords[asset.id];

        let units = '';
        let addition = 0;
        let currentVal = '';

        if (curr) {
          units = curr.units !== undefined ? curr.units : '';
          addition = curr.invested - prev.invested;
          currentVal = curr.current !== undefined ? curr.current : '';
        } else {
          units = prev.units !== undefined && prev.units !== 1 && prev.units !== 0 ? prev.units : '';
          addition = 0;
          currentVal = prev.current !== undefined ? prev.current : '';
        }

        const showPrevInvested = formatCurrency(prev.invested);

        html += `
          <div class="record-form-row" data-asset-id="${asset.id}" data-category="${category}" style="margin-bottom: 8px;">
            <div class="asset-info">
              <span class="asset-name">${asset.name}</span>
              <span class="asset-category">${asset.category} ${asset.sector ? `· ${asset.sector}` : ''}</span>
            </div>
            <div>
              <input type="number" step="any" placeholder="Units" class="form-input record-units" value="${units}" title="Enter Units for ${asset.name}">
            </div>
            <div style="font-size: 13px; font-weight: 500; color: var(--text-secondary);">
              ${showPrevInvested}
            </div>
            <div>
              <input type="number" step="any" placeholder="+/- Addition" class="form-input record-addition" value="${addition !== 0 ? addition : ''}" data-prev-invested="${prev.invested}" data-prev-current="${prev.current}" title="Enter addition for ${asset.name}">
            </div>
            <div>
              <input type="number" step="any" placeholder="₹ Current Value" class="form-input record-current" value="${currentVal}" required title="Enter Current Value for ${asset.name}">
            </div>
          </div>
        `;
      });
    }
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
    'Emergency Fund': 7
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
    elements.analysisTopAssetPct.innerHTML = `${formatPercent(activePerf[0].gainPercent)} total gain`;
  } else {
    elements.analysisTopAsset.textContent = '-';
    elements.analysisTopAssetPct.textContent = '-';
  }

  const classBreakdown = portfolioState.getCategoryBreakdown(selectedMonth);
  let bestClass = '-';
  let bestClassPct = -999999;
  
  Object.keys(classBreakdown).forEach(cat => {
    const c = classBreakdown[cat];
    const gainPct = c.invested > 0 ? ((c.current - c.invested) / c.invested) * 100 : 0;
    if (gainPct > bestClassPct) {
      bestClassPct = gainPct;
      bestClass = cat;
    }
  });

  if (bestClass !== '-') {
    elements.analysisBestClass.textContent = bestClass;
    elements.analysisBestClassPct.innerHTML = `${formatPercent(bestClassPct)} average gain`;
  } else {
    elements.analysisBestClass.textContent = '-';
    elements.analysisBestClassPct.textContent = '-';
  }

  // Render Performance Table
  elements.assetPerformanceTable.innerHTML = finalPerfList.map(p => {
    const showUnits = p.units && p.units > 0 ? p.units.toLocaleString('en-IN', { maximumFractionDigits: 3 }) : '—';
    
    const momInv = p.isNew ? `+${formatCurrency(p.momChangeInvested)} (New)` : p.momChangeInvested > 0 ? `+${formatCurrency(p.momChangeInvested)}` : p.momChangeInvested < 0 ? `-${formatCurrency(Math.abs(p.momChangeInvested))}` : '₹0.00';
    const momCur = p.momChangeCurrent > 0 ? `+${formatCurrency(p.momChangeCurrent)}` : p.momChangeCurrent < 0 ? `-${formatCurrency(Math.abs(p.momChangeCurrent))}` : '₹0.00';
    
    const momInvClass = p.isNew || p.momChangeInvested > 0 ? 'trend-up' : p.momChangeInvested < 0 ? 'trend-down' : 'trend-neutral';
    const momCurClass = p.momChangeCurrent > 0 ? 'trend-up' : p.momChangeCurrent < 0 ? 'trend-down' : 'trend-neutral';

    return `
      <tr>
        <td><strong>${p.asset.name}</strong></td>
        <td><span class="badge badge-${p.asset.category.toLowerCase().replace(/[^a-z0-9]/g, '')}">${p.asset.category}</span></td>
        <td style="text-align: center; padding-right: 20px;">${showUnits}</td>
        <td><strong>${formatCurrency(p.invested)}</strong></td>
        <td><strong>${formatCurrency(p.current)}</strong></td>
        <td><strong>${formatCurrency(p.gain)}</strong></td>
        <td>${formatPercent(p.gainPercent)}</td>
        <td class="${momInvClass}">${momInv}</td>
        <td class="${momCurClass}">${momCur}</td>
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

/**
 * Fetch latest Mutual Fund NAVs from AMFI API and calculate current values based on Units
 */
async function fetchLiveNAVs() {
  const fetchBtn = document.getElementById('fetchLiveNavsBtn');
  const rows = elements.recordsFormContainer.querySelectorAll('.record-form-row[data-asset-id]');
  const assets = portfolioState.getAssets();
  
  let mfCount = 0;
  let successCount = 0;
  
  // Find mutual fund rows
  const mfRows = [];
  rows.forEach(row => {
    const assetId = row.getAttribute('data-asset-id');
    const asset = assets.find(a => a.id === assetId);
    if (asset && asset.category === 'Mutual Funds' && asset.schemeCode) {
      mfRows.push({ row, asset });
    }
  });
  
  if (mfRows.length === 0) {
    alert("No Mutual Funds with valid Scheme Codes found in your inventory. Edit assets in the Asset List page to add their AMFI scheme codes first!");
    return;
  }
  
  fetchBtn.disabled = true;
  const originalHtml = fetchBtn.innerHTML;
  fetchBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Fetching NAVs...`;
  
  for (const item of mfRows) {
    const { row, asset } = item;
    const unitsInput = row.querySelector('.record-units');
    const currentInput = row.querySelector('.record-current');
    const units = parseFloat(unitsInput.value) || 0;
    
    if (units <= 0) {
      continue; // Skip if no units entered
    }
    
    mfCount++;
    try {
      const response = await fetch(`https://api.mfapi.in/mf/${asset.schemeCode}`);
      if (response.ok) {
        const result = await response.json();
        if (result && result.data && result.data.length > 0) {
          const nav = parseFloat(result.data[0].nav);
          if (!isNaN(nav)) {
            const calculatedCurrent = units * nav;
            currentInput.value = calculatedCurrent.toFixed(2);
            
            // Add a visual flash glow effect
            currentInput.style.borderColor = 'var(--success)';
            currentInput.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.4)';
            setTimeout(() => {
              currentInput.style.borderColor = '';
              currentInput.style.boxShadow = '';
            }, 3000);
            
            successCount++;
          }
        }
      }
    } catch (err) {
      console.error(`Failed to fetch NAV for ${asset.name}:`, err);
    }
  }
  
  fetchBtn.disabled = false;
  fetchBtn.innerHTML = originalHtml;
  
  if (mfCount === 0) {
    alert("Please enter a non-zero number of Units in the form for your Mutual Funds before fetching live NAVs.");
  } else {
    alert(`Successfully updated live NAVs for ${successCount} of ${mfCount} Mutual Fund(s)! (Updated fields are highlighted in green)`);
  }
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

  // Helper to recalculate Stocks/ETFs additions and automatically adjust the total valuation input
  function recalculateStocksTotal() {
    const stockRows = elements.recordsFormContainer.querySelectorAll('.record-form-row[data-category="Stocks/ETFs"]');
    let totalAddition = 0;
    
    stockRows.forEach(row => {
      const additionInput = row.querySelector('.record-addition');
      if (additionInput) {
        totalAddition += parseFloat(additionInput.value) || 0;
      }
    });
    
    // Update total stock addition display
    const totalAdditionDisplay = document.getElementById('stocks-total-addition-display');
    if (totalAdditionDisplay) {
      totalAdditionDisplay.textContent = formatCurrency(totalAddition);
    }
    
    // Auto-update total stock valuation input
    const totalCurrentInput = document.getElementById('stocks-total-current');
    if (totalCurrentInput) {
      const prevTotalCurrent = parseFloat(totalCurrentInput.getAttribute('data-prev-total-current')) || 0;
      totalCurrentInput.value = (prevTotalCurrent + totalAddition).toFixed(2);
    }
  }

  // Auto-update valuation when addition is typed
  if (elements.recordsFormContainer) {
    elements.recordsFormContainer.addEventListener('input', (e) => {
      if (e.target.classList.contains('record-addition')) {
        const row = e.target.closest('.record-form-row');
        const category = row.getAttribute('data-category');
        
        if (category === 'Stocks/ETFs') {
          recalculateStocksTotal();
        } else {
          const prevCurrent = parseFloat(e.target.getAttribute('data-prev-current')) || 0;
          const addition = parseFloat(e.target.value) || 0;
          
          const currentInput = row.querySelector('.record-current');
          if (currentInput) {
            currentInput.value = (prevCurrent + addition).toFixed(2);
          }
        }
      }
    });
  }

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

  elements.monthlyRecordsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 1. Process all non-Stocks/ETFs rows normally
    const nonStockRows = elements.recordsFormContainer.querySelectorAll('.record-form-row[data-asset-id]:not([data-category="Stocks/ETFs"])');
    nonStockRows.forEach(row => {
      const assetId = row.getAttribute('data-asset-id');
      const units = parseFloat(row.querySelector('.record-units').value) || 0;
      
      const additionInput = row.querySelector('.record-addition');
      const prevInvested = parseFloat(additionInput.getAttribute('data-prev-invested')) || 0;
      const addition = parseFloat(additionInput.value) || 0;
      
      const invested = prevInvested + addition;
      const current = parseFloat(row.querySelector('.record-current').value) || 0;
      
      portfolioState.updateMonthlyRecord(recordEditMonth, assetId, invested, current, units);
    });

    // 2. Process Stocks/ETFs rows: sum invested and distribute total valuation proportionally
    const stockRows = elements.recordsFormContainer.querySelectorAll('.record-form-row[data-asset-id][data-category="Stocks/ETFs"]');
    let totalStockInvested = 0;
    const stockList = [];

    stockRows.forEach(row => {
      const assetId = row.getAttribute('data-asset-id');
      const units = parseFloat(row.querySelector('.record-units').value) || 0;
      
      const additionInput = row.querySelector('.record-addition');
      const prevInvested = parseFloat(additionInput.getAttribute('data-prev-invested')) || 0;
      const addition = parseFloat(additionInput.value) || 0;
      
      const invested = prevInvested + addition;
      totalStockInvested += invested;
      
      stockList.push({ assetId, invested, units });
    });

    const stocksTotalCurrentInput = document.getElementById('stocks-total-current');
    if (stocksTotalCurrentInput) {
      const totalStockCurrent = parseFloat(stocksTotalCurrentInput.value) || 0;
      
      stockList.forEach(stock => {
        let currentVal = 0;
        if (totalStockInvested > 0) {
          currentVal = (stock.invested / totalStockInvested) * totalStockCurrent;
        } else {
          currentVal = totalStockCurrent / stockList.length; // Fallback to equal split if nothing invested
        }
        
        portfolioState.updateMonthlyRecord(recordEditMonth, stock.assetId, stock.invested, currentVal, stock.units);
      });
    }

    isDraftMode = false; // Reset draft mode upon successful save
    updateMonthDropdowns();
    selectedMonth = recordEditMonth;
    
    alert(`Portfolio valuations for ${formatMonthName(recordEditMonth)} saved successfully!`);
    switchView('dashboard');
  });

  const cloudSyncForm = document.getElementById('cloudSyncForm');
  if (cloudSyncForm) {
    cloudSyncForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const gistId = document.getElementById('gistIdInput').value.trim();
      const token = document.getElementById('githubTokenInput').value.trim();
      const statusSpan = document.getElementById('cloudSyncStatus');
      
      portfolioState.saveCloudConfig(gistId, token);
      
      statusSpan.style.color = 'var(--text-secondary)';
      statusSpan.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
      
      // Trigger a sync
      portfolioState.saveState();
      
      setTimeout(() => {
        statusSpan.style.color = 'var(--success)';
        statusSpan.innerHTML = '<i class="fa-solid fa-check"></i> Connected & Saved';
        setTimeout(() => { statusSpan.innerHTML = ''; }, 3000);
      }, 1000);
    });
  }

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
    reader.onload = function(evt) {
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

// Expose UI API globally
window.portfolioUI = {
  initUI,
  switchView,
  formatCurrency
};
