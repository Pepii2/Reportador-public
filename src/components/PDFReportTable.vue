<template>
  <div class="pdf-table-container" :class="`style-${tableStyle}`">
    <table v-if="rows.length">
      <thead>
        <tr>
          <th class="campaign-col">{{ headers.campaign || 'Campaña' }}</th>
          <th v-for="metric in selectedMetrics" :key="metric.key" :class="`metric-col ${metric.align || 'text-right'}`">
            {{ metric.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i" :class="getRowClass(i)">
          <td class="campaign-cell">{{ row.campaign_name || row.name || '—' }}</td>
          <td v-for="metric in selectedMetrics" :key="metric.key" :class="`metric-cell ${metric.align || 'text-right'}`">
            {{ formatValue(row[metric.key], metric.format) }}
          </td>
        </tr>
        <!-- Total row if enabled -->
        <tr v-if="showTotals" class="totals-row">
          <td class="total-label">{{ headers.total || 'Total' }}</td>
          <td v-for="metric in selectedMetrics" :key="metric.key" :class="`metric-cell ${metric.align || 'text-right'}`">
            {{ calculateTotal(metric) }}
          </td>
        </tr>
      </tbody>
    </table>
    
    <div v-else class="empty-state">
      <p>No hay datos disponibles para mostrar</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  metrics: { type: Array, default: () => [] },
  tableStyle: { 
    type: String, 
    default: 'standard',
    validator: (value) => ['compact', 'standard', 'detailed'].includes(value)
  },
  showTotals: { type: Boolean, default: false },
  headers: { type: Object, default: () => ({ campaign: 'Campaña', total: 'Total' }) },
  platform: { type: String, default: '' }
})

// Define metric configurations with labels and formatting
const metricConfig = {
  // Universal metrics
  cost: { label: 'Inversión', format: 'currency', aggregate: 'sum' },
  clicks: { label: 'Clics', format: 'number', aggregate: 'sum' },
  impressions: { label: 'Impresiones', format: 'number', aggregate: 'sum' },
  ctr: { label: 'CTR', format: 'percentage', aggregate: 'average' },
  cpc: { label: 'CPC', format: 'currency', aggregate: 'average' },
  cpm: { label: 'CPM', format: 'currency', aggregate: 'average' },
  
  // Facebook/Meta specific
  reach: { label: 'Alcance', format: 'number', aggregate: 'sum' },
  frequency: { label: 'Frecuencia', format: 'decimal', aggregate: 'average' },
  purchases: { label: 'Compras', format: 'number', aggregate: 'sum' },
  revenue: { label: 'Ingresos', format: 'currency', aggregate: 'sum' },
  roas: { label: 'ROAS', format: 'decimal', aggregate: 'average' },
  link_clicks: { label: 'Clics en enlace', format: 'number', aggregate: 'sum' },
  
  // TikTok specific (with p_ prefix)
  p_complete_payment_roas: { label: 'ROAS', format: 'decimal', aggregate: 'average' },
  p_video_play: { label: 'Reprod. Video', format: 'number', aggregate: 'sum' },
  p_video_play_100: { label: 'Video 100%', format: 'percentage', aggregate: 'average' },
  p_video_play_75: { label: 'Video 75%', format: 'percentage', aggregate: 'average' },
  p_video_play_50: { label: 'Video 50%', format: 'percentage', aggregate: 'average' },
  p_video_play_25: { label: 'Video 25%', format: 'percentage', aggregate: 'average' },
  
  // Google Ads specific
  conversions: { label: 'Conversiones', format: 'number', aggregate: 'sum' },
  all_conversions: { label: 'Todas las Conv.', format: 'number', aggregate: 'sum' },
  purchase_conversions: { label: 'Conv. de Compra', format: 'number', aggregate: 'sum' },
  average_cpc: { label: 'CPC Promedio', format: 'currency', aggregate: 'average' },
  average_cpm: { label: 'CPM Promedio', format: 'currency', aggregate: 'average' },
  
  // Performance metrics
  engagement_rate: { label: 'Tasa de Interacción', format: 'percentage', aggregate: 'average' },
  conversion_rate: { label: 'Tasa de Conv.', format: 'percentage', aggregate: 'average' },
  bounce_rate: { label: 'Tasa de Rebote', format: 'percentage', aggregate: 'average' }
}

// Process selected metrics
const selectedMetrics = computed(() => {
  return props.metrics.map(metric => {
    const key = typeof metric === 'string' ? metric : metric.key
    const config = metricConfig[key] || {}
    return {
      key,
      label: (typeof metric === 'object' ? metric.label : null) || config.label || key,
      format: (typeof metric === 'object' ? metric.format : null) || config.format || 'number',
      aggregate: (typeof metric === 'object' ? metric.aggregate : null) || config.aggregate || 'sum',
      align: (typeof metric === 'object' ? metric.align : null) || 'text-right'
    }
  })
})

// Process rows
const rows = computed(() => props.data || [])

// Formatting functions
const formatters = {
  number: (v) => {
    if (v == null || v === '') return '—'
    return Number(v).toLocaleString('es-MX')
  },
  currency: (v) => {
    if (v == null || v === '') return '—'
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(v)
  },
  percentage: (v) => {
    if (v == null || v === '') return '—'
    const value = Number(v)
    // Check if value is already a percentage (> 1) or needs conversion (< 1)
    const percentage = value > 1 ? value : value * 100
    return `${percentage.toFixed(2)}%`
  },
  decimal: (v) => {
    if (v == null || v === '') return '—'
    return Number(v).toFixed(2)
  },
  date: (v) => {
    if (!v) return '—'
    try {
      return new Date(v).toLocaleDateString('es-MX')
    } catch {
      return v
    }
  }
}

function formatValue(value, format) {
  const formatter = formatters[format] || formatters.number
  return formatter(value)
}

// Calculate totals for summary row
function calculateTotal(metric) {
  if (!props.showTotals || !rows.value.length) return '—'
  
  const values = rows.value
    .map(row => row[metric.key])
    .filter(v => v != null && v !== '')
    .map(Number)
  
  if (!values.length) return '—'
  
  let result
  if (metric.aggregate === 'average') {
    result = values.reduce((a, b) => a + b, 0) / values.length
  } else if (metric.aggregate === 'max') {
    result = Math.max(...values)
  } else if (metric.aggregate === 'min') {
    result = Math.min(...values)
  } else {
    // Default to sum
    result = values.reduce((a, b) => a + b, 0)
  }
  
  return formatValue(result, metric.format)
}

// Get row styling class based on table style
function getRowClass(index) {
  if (props.tableStyle === 'compact') {
    return index % 2 === 0 ? 'even-row' : 'odd-row'
  }
  if (props.tableStyle === 'detailed') {
    return 'detailed-row'
  }
  return ''
}
</script>

<style scoped>
/* Base table styles */
.pdf-table-container {
  width: 100%;
  margin: 20px 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  background-color: #fff;
  position: relative;
}

/* Common header styles */
th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #5f6368;
  background-color: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 2;
  border-bottom: 1px solid #dadce0;
  white-space: nowrap;
  user-select: none;
}

th:first-child {
  border-top-left-radius: 8px;
}

th:last-child {
  border-top-right-radius: 8px;
}

/* Common cell styles */
td {
  padding: 12px 16px;
  vertical-align: middle;
  border-bottom: 1px solid #f0f0f0;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

/* Row hover effects */
tbody tr {
  transition: background-color 0.2s ease;
}

tbody tr:hover {
  background-color: #f8f9fa;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:last-child td:first-child {
  border-bottom-left-radius: 8px;
}

tbody tr:last-child td:last-child {
  border-bottom-right-radius: 8px;
}

/* Text alignment utilities */
.text-center {
  text-align: center;
}

.text-right {
  text-align: right !important;
}

.text-left {
  text-align: left;
}

.numeric-cell, .metric-cell {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Column width utilities */
.col-xs { width: 60px; }
.col-sm { width: 100px; }
.col-md { width: 150px; }
.col-lg { width: 200px; }
.col-xl { width: 300px; }

.campaign-col {
  width: 30%;
  min-width: 150px;
}

.metric-col {
  width: auto;
}

/* Campaign name styles */
.campaign-cell {
  font-weight: 500;
  color: #1a73e8;
  cursor: pointer;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.campaign-cell:hover {
  text-decoration: underline;
}

/* Status indicators */
.status-active {
  color: #137333;
  background: #e6f4ea;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-paused {
  color: #b06000;
  background: #fef7e0;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-ended {
  color: #d93025;
  background: #fce8e6;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

/* ==================== */
/* COMPACT STYLE */
/* ==================== */
.style-compact table {
  font-size: 12px;
}

.style-compact th {
  padding: 8px 12px;
  background: #f1f3f4;
  border-bottom: 1px solid #dadce0;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.style-compact td {
  padding: 6px 12px;
  font-size: 12px;
  border-bottom: 1px solid #e8eaed;
}

.style-compact tbody tr:nth-child(even) {
  background-color: #f8f9fa;
}

.style-compact tbody tr:hover {
  background-color: #e8f0fe;
}

.style-compact .campaign-cell {
  font-weight: 500;
  color: #202124;
}

/* ==================== */
/* STANDARD STYLE */
/* ==================== */
.style-standard th {
  padding: 14px 16px;
  background: #fff;
  border-bottom: 2px solid #4285f4;
  color: #202124;
  font-weight: 600;
}

.style-standard td {
  padding: 12px 16px;
  border-bottom: 1px solid #dadce0;
}

.style-standard tbody tr {
  transition: all 0.2s ease;
}

.style-standard tbody tr:hover {
  background-color: #f1f3f4;
  transform: scale(1.01);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.style-standard .campaign-cell {
  font-weight: 500;
  color: #4285f4;
}

.style-standard .metric-cell {
  color: #5f6368;
}

/* ==================== */
/* DETAILED STYLE */
/* ==================== */
.style-detailed table {
  font-size: 13px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  border-radius: 8px;
  overflow: hidden;
}

.style-detailed th {
  padding: 16px;
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  color: white;
  border: none;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 12px;
}

.style-detailed th:first-child {
  border-top-left-radius: 0;
}

.style-detailed th:last-child {
  border-top-right-radius: 0;
}

.style-detailed td {
  padding: 14px 16px;
  border-bottom: 1px solid #e8eaed;
}

.style-detailed tbody tr {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.style-detailed tbody tr:nth-child(even) {
  background-color: #f8f9fa;
}

.style-detailed tbody tr:hover {
  background-color: #e8f0fe;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

.style-detailed .campaign-cell {
  font-weight: 600;
  color: #4285f4;
  font-size: 14px;
}

.style-detailed .metric-cell {
  color: #202124;
  font-weight: 500;
}

/* ==================== */
/* TOTALS ROW */
/* ==================== */
.totals-row {
  font-weight: 700;
  background: linear-gradient(to right, #f8f9fa, #e8eaed);
  border-top: 2px solid #4285f4;
}

.totals-row td {
  padding: 14px 16px;
  color: #202124;
  font-size: 14px;
  border-bottom: none;
}

.total-label {
  font-weight: 700;
  color: #202124;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #5f6368;
  font-size: 14px;
}

.empty-state::before {
  content: '📊';
  display: block;
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* Responsive behavior */
@media (max-width: 768px) {
  th, td {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .hide-mobile {
    display: none;
  }
  
  .campaign-col {
    min-width: 120px;
  }
}

/* Print styles */
@media print {
  .pdf-table-container {
    page-break-inside: avoid;
    margin: 10px 0;
  }
  
  table {
    font-size: 10px;
    box-shadow: none !important;
  }
  
  th {
    background: #f0f0f0 !important;
    color: #000 !important;
    padding: 6px 8px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  td {
    padding: 6px 8px;
  }
  
  tbody tr:hover {
    background: none !important;
    transform: none !important;
    box-shadow: none !important;
  }
  
  .style-detailed th {
    background: #e0e0e0 !important;
    color: #000 !important;
  }
  
  .campaign-cell {
    color: #000 !important;
    text-decoration: none !important;
  }
  
  .totals-row {
    background: #f0f0f0 !important;
    border-top: 1px solid #000;
  }
}
</style>