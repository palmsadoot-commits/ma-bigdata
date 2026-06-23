/**
 * 🎨 Modern Chart Theme for MA Big Data
 * Shared utility for consistent, beautiful charts across all dashboards.
 * Supports both Light and Dark mode automatically.
 */

// ────────────────────────────────────────────
// 🎨 Color Palette — Curated, harmonious tones
// ────────────────────────────────────────────

export const CHART_PALETTE = [
  '#6366f1', // Indigo
  '#22c55e', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Rose
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#a855f7', // Purple
];

export const SEMANTIC_COLORS = {
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#6366f1',
  primary: '#1677ff',
  neutral: '#64748b',
};

// ────────────────────────────────────────────
// 🌙 Dark Mode Detection
// ────────────────────────────────────────────

export const isDarkMode = () => document.body.classList.contains('dark-mode');

// ────────────────────────────────────────────
// 📐 Axis Configuration
// ────────────────────────────────────────────

export const getAxisConfig = () => {
  const dark = isDarkMode();
  return {
    axisLine: false,
    tickLine: false,
    tick: {
      fill: dark ? '#94a3b8' : '#64748b',
      fontSize: 12,
      fontWeight: 500,
    },
  };
};

// ────────────────────────────────────────────
// 🔲 Grid Configuration
// ────────────────────────────────────────────

export const getGridConfig = () => {
  const dark = isDarkMode();
  return {
    strokeDasharray: '3 3',
    vertical: false,
    stroke: dark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(226, 232, 240, 0.8)',
  };
};

// ────────────────────────────────────────────
// 💬 Tooltip Styling
// ────────────────────────────────────────────

export const getTooltipStyle = () => {
  const dark = isDarkMode();
  return {
    contentStyle: {
      borderRadius: 16,
      border: 'none',
      background: dark
        ? 'rgba(30, 41, 59, 0.95)'
        : 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: dark
        ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(148, 163, 184, 0.1)'
        : '0 20px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.5)',
      padding: '12px 16px',
      color: dark ? '#e2e8f0' : '#1e293b',
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1.6,
    },
    labelStyle: {
      color: dark ? '#94a3b8' : '#64748b',
      fontSize: 11,
      fontWeight: 600,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    itemStyle: {
      color: dark ? '#e2e8f0' : '#334155',
      fontSize: 13,
      fontWeight: 600,
      padding: '2px 0',
    },
    cursor: {
      fill: dark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(99, 102, 241, 0.04)',
    },
  };
};

// ────────────────────────────────────────────
// ✨ Animation Configuration
// ────────────────────────────────────────────

export const ANIMATION_CONFIG = {
  animationDuration: 1200,
  animationEasing: 'ease-out',
  animationBegin: 100,
};

export const getStaggeredAnimation = (index) => ({
  ...ANIMATION_CONFIG,
  animationBegin: 100 + index * 150,
});

// ────────────────────────────────────────────
// 🌈 Gradient Definitions (unique IDs per chart)
// ────────────────────────────────────────────

/**
 * Generate a unique gradient ID scoped to a specific chart.
 * @param {string} chartId - Unique chart identifier (e.g., 'bi-trend')
 * @param {string} colorName - Color name (e.g., 'primary')
 * @returns {string} Unique gradient ID
 */
export const getGradientId = (chartId, colorName) =>
  `grad-${chartId}-${colorName}`;

/**
 * Create gradient definition props for Recharts <linearGradient>
 * @param {string} color - Hex color string
 * @param {object} options - Optional overrides
 * @returns {{ topOpacity: number, bottomOpacity: number }}
 */
export const getGradientStops = (color, options = {}) => ({
  topOpacity: options.topOpacity ?? 0.2,
  bottomOpacity: options.bottomOpacity ?? 0.01,
});

// ────────────────────────────────────────────
// 📊 Modern Area/Line Styling
// ────────────────────────────────────────────

export const getAreaStyle = (color, gradientId) => ({
  type: 'monotone',
  stroke: color,
  strokeWidth: 2.5,
  fillOpacity: 1,
  fill: `url(#${gradientId})`,
  dot: false,
  activeDot: {
    r: 6,
    fill: color,
    stroke: isDarkMode() ? '#1e293b' : '#ffffff',
    strokeWidth: 3,
    filter: `drop-shadow(0 0 6px ${color}50)`,
  },
  ...ANIMATION_CONFIG,
});

export const getBarStyle = (color) => ({
  fill: color,
  radius: [6, 6, 6, 6],
  ...ANIMATION_CONFIG,
});

// ────────────────────────────────────────────
// 🏷️ Modern Legend Formatter
// ────────────────────────────────────────────

export const legendFormatter = (value) => {
  const dark = isDarkMode();
  return (
    `<span style="color: ${dark ? '#e2e8f0' : '#334155'}; font-size: 12px; font-weight: 600; letter-spacing: 0.3px">${value}</span>`
  );
};

export const getLegendConfig = () => ({
  verticalAlign: 'top',
  height: 40,
  iconType: 'circle',
  iconSize: 8,
  formatter: legendFormatter,
  wrapperStyle: {
    paddingBottom: 8,
  },
});

// ────────────────────────────────────────────
// 🔵 Card wrapper styling for chart containers
// ────────────────────────────────────────────

export const getChartCardStyle = () => {
  const dark = isDarkMode();
  return {
    borderRadius: 24,
    border: 'none',
    boxShadow: dark
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(0, 0, 0, 0.04)',
    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
  };
};
