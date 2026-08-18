/**
 * Charting logic using Chart.js.
 * Handles rendering and updating line/doughnut charts for portfolio analytics.
 */

// Cache chart instances to destroy/recreate on data update
let trendChartInstance = null;
let allocationChartInstance = null;

// Category colors mapping matching styles.css variables
const CATEGORY_COLORS = {
  'Stocks/ETFs': '#8b5cf6',   // Violet
  'Mutual Funds': '#10b981',  // Emerald
  'EPF': '#f59e0b',           // Amber
  'PPF': '#06b6d4',           // Cyan
  'NPS': '#ec4899',           // Pink
  'Gold Investment': '#fbbf24', // Yellow
  'Goals': '#f97316',         // Orange
  'Emergency Fund': '#64748b' // Slate
};

/**
 * Helper to format currency for tooltips (Indian Rupees format)
 */
function formatTooltipCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format month label for user-friendly display (e.g., "2026-02" -> "Feb-26")
 */
function formatMonthLabel(monthStr) {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month) - 1, 1);
  return date.toLocaleString('en-US', { month: 'short' }) + '-' + year.slice(2);
}

/**
 * Render or update the Total Invested Trend Chart (Line Chart)
 */
function renderInvestedTrendChart(trendData) {
  const ctx = document.getElementById('investedTrendChart');
  if (!ctx) return;

  // Destroy previous instance to prevent rendering glitched overlay charts
  if (trendChartInstance) {
    trendChartInstance.destroy();
  }

  const labels = trendData.map(d => formatMonthLabel(d.month));
  const investedData = trendData.map(d => d.totalInvested);

  // Chart styling options
  const gridOptions = {
    color: 'rgba(255, 255, 255, 0.05)',
    drawBorder: false
  };

  trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total Invested',
          data: investedData,
          borderColor: '#6366f1', // primary color
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
            gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
            return gradient;
          },
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#6366f1',
          pointHoverRadius: 7,
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 12, weight: '500' },
            boxWidth: 15,
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit', size: 14, weight: '600' },
          bodyFont: { family: 'Inter', size: 13 },
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += formatTooltipCurrency(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#64748b',
            font: { family: 'Inter', size: 11 }
          }
        },
        y: {
          grid: gridOptions,
          ticks: {
            color: '#64748b',
            font: { family: 'Inter', size: 11 },
            callback: function(value) {
              if (value >= 100000) {
                return '₹' + (value / 100000).toFixed(1) + 'L';
              }
              if (value >= 1000) {
                return '₹' + (value / 1000).toFixed(0) + 'k';
              }
              return '₹' + value;
            }
          }
        }
      }
    }
  });
}

/**
 * Render or update the Asset Allocation Chart (Doughnut Chart)
 */
function renderAllocationChart(breakdownData) {
  const ctx = document.getElementById('allocationChart');
  if (!ctx) return;

  if (allocationChartInstance) {
    allocationChartInstance.destroy();
  }

  const categories = Object.keys(breakdownData);
  const values = categories.map(cat => breakdownData[cat].invested);
  const bgColors = categories.map(cat => CATEGORY_COLORS[cat] || '#64748b');

  // If there's no data, render an empty state doughnut
  if (categories.length === 0) {
    categories.push('No Assets');
    values.push(1);
    bgColors.push('rgba(255, 255, 255, 0.05)');
  }

  allocationChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: values,
        backgroundColor: bgColors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 12, weight: '500' },
            boxWidth: 12,
            padding: 12
          }
        },
        tooltip: {
          enabled: categories[0] !== 'No Assets', // disable if dummy empty state
          backgroundColor: '#0f172a',
          titleFont: { family: 'Outfit', size: 13, weight: '600' },
          bodyFont: { family: 'Inter', size: 12 },
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(context) {
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${formatTooltipCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Expose charts API globally
window.portfolioCharts = {
  renderInvestedTrendChart,
  renderAllocationChart
};
