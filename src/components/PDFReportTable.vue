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
  font-size: 12px;
}

th, td {
  padding: 8px;
  text-align: left;
}

th {
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  background: #f8f9fa;
}

.campaign-col {
  width: 30%;
  min-width: 150px;
}

.metric-col {
  width: auto;
}

.text-right {
  text-align: right !important;
}

.text-center {
  text-align: center !important;
}

.campaign-cell {
  font-weight: 500;
  color: #2c3e50;
}

.metric-cell {
  color: #555;
}

/* Compact style */
.style-compact table {
  font-size: 11px;
}

.style-compact th, 
.style-compact td {
  padding: 4px 6px;
}

.style-compact th {
  background: #e8f4f8;
  border-bottom: 1px solid #3498db;
}

.style-compact .even-row {
  background: #f9f9f9;
}

.style-compact .odd-row {
  background: white;
}

/* Standard style */
.style-standard td {
  border-bottom: 1px solid #e0e0e0;
}

.style-standard tbody tr:hover {
  background: #f5f5f5;
}

/* Detailed style */
.style-detailed table {
  font-size: 13px;
}

.style-detailed th {
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.style-detailed td {
  padding: 10px 12px;
  border-bottom: 1px solid #e0e0e0;
}

.style-detailed .detailed-row {
  transition: background 0.2s;
}

.style-detailed tbody tr:nth-child(even) {
  background: #f8f9fa;
}

.style-detailed tbody tr:hover {
  background: #e8f4f8;
}

.style-detailed .campaign-cell {
  font-weight: 600;
  color: #667eea;
}

/* Totals row */
.totals-row {
  font-weight: 700;
  background: #f0f0f0;
  border-top: 2px solid #3498db;
}

.totals-row td {
  padding: 10px 8px;
  color: #2c3e50;
}

.total-label {
  font-weight: 700;
  color: #2c3e50;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

/* PDF-specific adjustments */
@media print {
  .pdf-table-container {
    page-break-inside: avoid;
  }
  
  table {
    font-size: 10px;
  }
  
  th {
    background: #f0f0f0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .style-detailed th {
    background: #667eea !important;
    color: white !important;
  }
}
</style>