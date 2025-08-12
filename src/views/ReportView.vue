<template>
  <div class="report-view">
    <!-- Header -->
    <header class="report-header">
      <div class="container">
        <div class="header-content">
          <div class="logo-title">
            <h1>📊 {{ reportData?.customization?.title || 'Reporte de Marketing Digital' }}</h1>
            <p>{{ reportData?.metadata?.dateRange || 'Reporte Generado' }}</p>
          </div>
          <div class="header-actions">
            <button @click="exportToPDF" class="btn btn-outline" :disabled="isExporting">
              <span v-if="isExporting">⏳ Exportando...</span>
              <span v-else>📄 Exportar PDF</span>
            </button>
            <button @click="exportToExcel" class="btn btn-outline" :disabled="isExporting">
              <span v-if="isExporting">⏳ Exportando...</span>
              <span v-else>📊 Exportar Excel</span>
            </button>
            <button @click="goBack" class="btn btn-secondary">
              ← Volver al Wizard
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner">⏳</div>
      <h2>Generando tu reporte...</h2>
      <p>Procesando datos de {{ selectedCampaigns.length }} campañas</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">❌</div>
      <h2>Error al generar el reporte</h2>
      <p>{{ error }}</p>
      <button @click="goBack" class="btn btn-primary">Volver al Wizard</button>
    </div>

    <!-- Report Content -->
    <div v-else-if="reportData" class="report-content">
      <div class="container">
        
        <!-- Summary Cards -->
        <section class="summary-section">
          <h2>📈 Resumen Ejecutivo</h2>
          <div class="metrics-grid">
            <div 
              v-for="metric in displayMetrics" 
              :key="metric.id"
              class="metric-card"
            >
              <div class="metric-value">{{ formatMetricValue(metric.value, metric.format) }}</div>
              <div class="metric-label">{{ metric.label }}</div>
            </div>
          </div>
        </section>

        <!-- Performance Chart -->
        <section class="chart-section">
          <h2>📈 Tendencia de Rendimiento</h2>
          <div class="chart-container">
            <canvas ref="chartCanvas" id="performanceChart"></canvas>
          </div>
        </section>

        <!-- Evidencia Table -->
        <section class="evidencia-section">
          <EvidenciaIntegrated
            :raw-data="reportData.data || []"
            :platform="wizardStore.selectedPlatform?.id || 'facebook'"
            :date-start="wizardStore.dateRange.startDate"
            :date-end="wizardStore.dateRange.endDate"
            :group-by="'campaign_name'"
          />
        </section>

        <!-- Recommendations -->
        <section v-if="reportData.analytics?.recommendations?.length > 0" class="recommendations-section">
          <h2>💡 Recomendaciones</h2>
          <div class="recommendations-list">
            <div v-for="rec in reportData.analytics.recommendations" :key="rec.id" class="recommendation-card">
              <div class="rec-priority" :class="rec.priority">{{ rec.priority.toUpperCase() }}</div>
              <h3>{{ rec.title }}</h3>
              <p>{{ rec.description }}</p>
              <div v-if="rec.impact" class="rec-impact">
                Impacto estimado: {{ rec.impact }}
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { wizardStore } from '@/stores/wizardStore'
import reportService from '@/services/reportService'
import EvidenciaIntegrated from '@/components/EvidenciaIntegrated.vue'
import Chart from 'chart.js/auto'

const router = useRouter()

// State
const isLoading = ref(true)
const isExporting = ref(false)
const error = ref(null)
const reportData = ref(null)
const chartCanvas = ref(null)
let chartInstance = null

// Computed
const selectedCampaigns = computed(() => wizardStore.selectedCampaigns)

const displayMetrics = computed(() => {
  if (!reportData.value) return []
  
  const summary = reportData.value.analytics?.summary || {}
  const selectedCardMetrics = reportData.value.customization?.selectedCardMetrics || []
  
  // Use selected metrics or default ones
  if (selectedCardMetrics.length > 0) {
    return selectedCardMetrics.map(metricId => {
      const metricConfig = wizardStore.selectedMetrics.find(m => m.id === metricId)
      return {
        id: metricId,
        label: metricConfig?.name || metricId,
        value: summary[`total${capitalize(metricId)}`] || summary[metricId] || 0,
        format: metricConfig?.unit || 'number'
      }
    })
  }
  
  // Default metrics
  return [
    { id: 'cost', label: 'Inversión Total', value: summary.totalCost, format: 'currency' },
    { id: 'impressions', label: 'Impresiones', value: summary.totalImpressions, format: 'number' },
    { id: 'clicks', label: 'Clics', value: summary.totalClicks, format: 'number' },
    { id: 'ctr', label: 'CTR Promedio', value: summary.averageCTR, format: 'percentage' },
    { id: 'cpc', label: 'CPC Promedio', value: summary.averageCPC, format: 'currency' },
    { id: 'roas', label: 'ROAS', value: summary.roas, format: 'decimal' }
  ]
})

// Methods
const generateReport = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const response = await wizardStore.generateReport()
    reportData.value = response
    
    // Create chart after data is loaded
    await nextTick()
    createChart()
    
  } catch (err) {
    console.error('Error generating report:', err)
    error.value = err.message || 'Error al generar el reporte'
  } finally {
    isLoading.value = false
  }
}

const createChart = () => {
  if (!chartCanvas.value || !reportData.value?.data) return
  
  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  // Prepare data for chart
  const chartData = prepareChartData()
  
  // Create new chart
  const ctx = chartCanvas.value.getContext('2d')
  chartInstance = new Chart(ctx, {
    type: reportData.value.customization?.chartType || 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
}

const prepareChartData = () => {
  const data = reportData.value.data || []
  const chartMetrics = reportData.value.customization?.chartMetrics || ['clicks', 'impressions']
  
  // Group data by date
  const groupedByDate = {}
  data.forEach(row => {
    const date = formatDate(row.date)
    if (!groupedByDate[date]) {
      groupedByDate[date] = {}
    }
    chartMetrics.forEach(metric => {
      groupedByDate[date][metric] = (groupedByDate[date][metric] || 0) + (row[metric] || 0)
    })
  })
  
  const dates = Object.keys(groupedByDate).sort()
  const datasets = chartMetrics.map(metric => {
    const metricConfig = wizardStore.selectedMetrics.find(m => m.id === metric)
    return {
      label: metricConfig?.name || metric,
      data: dates.map(date => groupedByDate[date][metric] || 0),
      borderColor: getMetricColor(metric),
      backgroundColor: getMetricColor(metric, 0.1),
      tension: 0.1
    }
  })
  
  return {
    labels: dates,
    datasets
  }
}

const getMetricColor = (metric, alpha = 1) => {
  const colors = {
    clicks: `rgba(59, 130, 246, ${alpha})`,
    impressions: `rgba(34, 197, 94, ${alpha})`,
    cost: `rgba(239, 68, 68, ${alpha})`,
    conversions: `rgba(168, 85, 247, ${alpha})`,
    ctr: `rgba(251, 146, 60, ${alpha})`,
    reach: `rgba(6, 182, 212, ${alpha})`
  }
  return colors[metric] || `rgba(107, 114, 128, ${alpha})`
}

const formatMetricValue = (value, format) => {
  if (value == null) return '—'
  
  switch (format) {
    case 'currency':
      return `$${formatNumber(value)}`
    case 'percentage':
      return `${value}%`
    case 'decimal':
      return value.toFixed(2)
    case 'number':
    default:
      return formatNumber(value)
  }
}

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toFixed(0)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-MX', { 
    month: 'short', 
    day: 'numeric' 
  })
}

const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const exportToPDF = async () => {
  try {
    isExporting.value = true
    await reportService.exportToPDF(reportData.value)
  } catch (err) {
    console.error('Error exporting PDF:', err)
    alert('Error al exportar el PDF')
  } finally {
    isExporting.value = false
  }
}

const exportToExcel = async () => {
  try {
    isExporting.value = true
    await reportService.exportToExcel(reportData.value)
  } catch (err) {
    console.error('Error exporting Excel:', err)
    alert('Error al exportar el Excel')
  } finally {
    isExporting.value = false
  }
}

const goBack = () => {
  router.push({ name: 'DateMetricsConfiguration' })
}

// Lifecycle
onMounted(() => {
  generateReport()
})
</script>

<style scoped>
.report-view {
  min-height: 100vh;
  background: #f8fafc;
}

/* Header Styles */
.report-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1.5rem 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.logo-title p {
  color: #64748b;
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Buttons */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-outline {
  background: white;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.btn-outline:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading & Error States */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.loading-spinner,
.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-container h2,
.error-container h2 {
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.loading-container p,
.error-container p {
  color: #64748b;
  margin: 0 0 1.5rem 0;
}

/* Report Content */
.report-content {
  padding: 2rem 0;
}

/* Summary Section */
.summary-section {
  margin-bottom: 2rem;
}

.summary-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.metric-card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
}

.metric-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.metric-label {
  font-size: 0.875rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Chart Section */
.chart-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
}

.chart-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}

/* Evidencia Section */
.evidencia-section {
  margin-bottom: 2rem;
}

/* Recommendations Section */
.recommendations-section {
  margin-bottom: 2rem;
}

.recommendations-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.recommendations-list {
  display: grid;
  gap: 1rem;
}

.recommendation-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  position: relative;
}

.rec-priority {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.rec-priority.high {
  background: #fee2e2;
  color: #dc2626;
}

.rec-priority.medium {
  background: #fed7aa;
  color: #ea580c;
}

.rec-priority.low {
  background: #dbeafe;
  color: #2563eb;
}

.recommendation-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.recommendation-card p {
  color: #64748b;
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

.rec-impact {
  font-size: 0.875rem;
  color: #059669;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-container {
    height: 300px;
  }
}
</style>