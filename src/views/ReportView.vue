<template>
  <div class="report-view">
    <!-- Header -->
    <header class="report-header">
      <div class="container">
        <div class="header-content">
          <div class="logo-title">
            <h1>📊 Reporte de Marketing Digital</h1>
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
          <div class="metrics-grid" v-if="reportData.analytics?.summary">
            <div class="metric-card">
              <div class="metric-value">${{ formatNumber(reportData.analytics.summary.totalCost) }}</div>
              <div class="metric-label">Inversión Total</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ formatNumber(reportData.analytics.summary.totalImpressions) }}</div>
              <div class="metric-label">Impresiones</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ formatNumber(reportData.analytics.summary.totalClicks) }}</div>
              <div class="metric-label">Clics</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ reportData.analytics.summary.averageCTR }}%</div>
              <div class="metric-label">CTR Promedio</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${{ formatNumber(reportData.analytics.summary.averageCPC) }}</div>
              <div class="metric-label">CPC Promedio</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{ reportData.analytics.summary.roas }}x</div>
              <div class="metric-label">ROAS</div>
            </div>
          </div>
        </section>

        <!-- Data Table -->
        <section class="data-section">
          <h2>📊 Datos de Campañas</h2>
          <div class="table-controls">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar en los datos..." 
              class="search-input"
            >
            <select v-model="rowsPerPage" class="rows-select">
              <option value="10">10 filas</option>
              <option value="25">25 filas</option>
              <option value="50">50 filas</option>
              <option value="100">100 filas</option>
            </select>
          </div>
          
          <div class="table-container" v-if="reportData.data?.length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th v-for="column in tableColumns" :key="column.key" 
                      @click="sortBy(column.key)" 
                      class="sortable">
                    {{ column.label }}
                    <span v-if="sortColumn === column.key" 
                          :class="sortDirection === 'asc' ? 'sort-asc' : 'sort-desc'">
                      {{ sortDirection === 'asc' ? '↑' : '↓' }}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in paginatedData" :key="row.campaign + row.date">
                  <td v-for="column in tableColumns" :key="column.key">
                    {{ formatCellValue(row[column.key], column.type) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination" v-if="totalPages > 1">
            <button 
              @click="currentPage = Math.max(1, currentPage - 1)" 
              :disabled="currentPage === 1"
              class="btn btn-outline btn-sm"
            >
              ← Anterior
            </button>
            <span class="page-info">
              Página {{ currentPage }} de {{ totalPages }} 
              ({{ filteredData.length }} registros)
            </span>
            <button 
              @click="currentPage = Math.min(totalPages, currentPage + 1)" 
              :disabled="currentPage === totalPages"
              class="btn btn-outline btn-sm"
            >
              Siguiente →
            </button>
          </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { wizardStore } from '@/stores/wizardStore'
import reportService from '@/services/reportService'

const router = useRouter()

// State
const isLoading = ref(true)
const isExporting = ref(false)
const error = ref(null)
const reportData = ref(null)
const searchQuery = ref('')
const sortColumn = ref('date')
const sortDirection = ref('desc')
const currentPage = ref(1)
const rowsPerPage = ref(25)

// Computed
const selectedCampaigns = computed(() => wizardStore.selectedCampaigns)

const tableColumns = computed(() => {
  console.log('🔄 Computing table columns...')
  console.log('- reportData exists:', !!reportData.value)
  console.log('- reportData.data exists:', !!reportData.value?.data)
  console.log('- reportData.data length:', reportData.value?.data?.length)
  
  if (!reportData.value?.data?.length) {
    console.log('⚠️ No data available for table columns')
    return []
  }
  
  const sampleRow = reportData.value.data[0]
  console.log('🔍 Sample row for columns:', sampleRow)
  console.log('🔍 Sample row keys:', Object.keys(sampleRow))
  console.log('🔍 Selected metrics:', wizardStore.selectedMetrics)
  
  const columns = [
    { key: 'date', label: 'Fecha', type: 'date' },
    { key: 'campaign', label: 'Campaña', type: 'text' }
  ]
  
  // Add metric columns based on selected metrics
  wizardStore.selectedMetrics.forEach(metric => {
    console.log(`🔍 Adding column for metric: ${metric.id} (${metric.name})`)
    columns.push({
      key: metric.id,
      label: metric.name,
      type: metric.unit === 'currency' ? 'currency' : metric.unit === 'count' ? 'number' : 'text'
    })
  })
  
  // Add calculated columns if they exist in data
  if (sampleRow.ctr !== undefined) {
    console.log('🔍 Adding CTR column')
    columns.push({ key: 'ctr', label: 'CTR %', type: 'percentage' })
  }
  if (sampleRow.cpc !== undefined) {
    console.log('🔍 Adding CPC column')
    columns.push({ key: 'cpc', label: 'CPC', type: 'currency' })
  }
  if (sampleRow.cpm !== undefined) {
    console.log('🔍 Adding CPM column')
    columns.push({ key: 'cpm', label: 'CPM', type: 'currency' })
  }
  
  console.log('✅ Final table columns:', columns.map(col => `${col.key} (${col.type})`))
  return columns
})

const filteredData = computed(() => {
  if (!reportData.value?.data) return []
  
  let data = reportData.value.data
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    data = data.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(query)
      )
    )
  }
  
  // Apply sorting
  data.sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]
    
    // Handle different data types
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
  
  return data
})

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / rowsPerPage.value)
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  const end = start + rowsPerPage.value
  return filteredData.value.slice(start, end)
})

// Methods
const generateReport = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    console.log('🔄 Generating report for view...')
    console.log('🔍 Wizard state debug:')
    console.log('- selectedTeam:', wizardStore.selectedTeam)
    console.log('- selectedPlatform:', wizardStore.selectedPlatform)
    console.log('- selectedCampaigns:', wizardStore.selectedCampaigns.length)
    console.log('- selectedMetrics:', wizardStore.selectedMetrics)
    console.log('- dateRange:', wizardStore.dateRange)
    
    const response = await wizardStore.generateReport()
    reportData.value = response
    
    console.log('✅ Report generated for view')
    console.log('🔍 Response structure:', Object.keys(response))
    console.log('🔍 Data array length:', response.data?.length)
    console.log('🔍 Analytics structure:', response.analytics ? Object.keys(response.analytics) : 'No analytics')
    
    if (response.data?.length > 0) {
      console.log('🔍 First data row:', response.data[0])
      console.log('🔍 First data row fields:', Object.keys(response.data[0]))
    }
    
  } catch (err) {
    console.error('❌ Failed to generate report:', err)
    error.value = err.message || 'Error al generar el reporte'
  } finally {
    isLoading.value = false
  }
}

const sortBy = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
  currentPage.value = 1
}

const formatNumber = (value) => {
  if (!value || isNaN(value)) return '0'
  return parseInt(value).toLocaleString('es-ES')
}

const formatCellValue = (value, type) => {
  if (value === null || value === undefined) return '-'
  
  switch (type) {
    case 'currency':
      return `$${parseFloat(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
    case 'number':
      return parseInt(value).toLocaleString('es-ES')
    case 'percentage':
      return `${parseFloat(value).toFixed(2)}%`
    case 'date':
      return new Date(value).toLocaleDateString('es-ES')
    default:
      return String(value)
  }
}

const exportToPDF = async () => {
  try {
    isExporting.value = true
    const pdfDoc = await reportService.generatePDFReport(reportData.value, {
      reportType: wizardStore.reportType,
      platform: wizardStore.selectedPlatform?.id,
      metrics: wizardStore.selectedMetrics.map(m => m.id),
      dateRange: wizardStore.dateRange
    })
    
    const pdfBlob = pdfDoc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `reporte_marketing_${new Date().toISOString().split('T')[0]}.pdf`
    link.click()
    
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000)
  } catch (err) {
    alert(`Error al exportar PDF: ${err.message}`)
  } finally {
    isExporting.value = false
  }
}

const exportToExcel = async () => {
  try {
    isExporting.value = true
    const workbook = await reportService.generateExcelReport(reportData.value, {
      reportType: wizardStore.reportType,
      platform: wizardStore.selectedPlatform?.id,
      metrics: wizardStore.selectedMetrics.map(m => m.id),
      dateRange: wizardStore.dateRange
    })
    
    const XLSX = await import('xlsx')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const excelUrl = URL.createObjectURL(excelBlob)
    const link = document.createElement('a')
    link.href = excelUrl
    link.download = `reporte_marketing_${new Date().toISOString().split('T')[0]}.xlsx`
    link.click()
    
    setTimeout(() => URL.revokeObjectURL(excelUrl), 1000)
  } catch (err) {
    alert(`Error al exportar Excel: ${err.message}`)
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

.report-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1.5rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.logo-title h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.logo-title p {
  color: #64748b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.loading-container,
.error-container {
  text-align: center;
  padding: 4rem 2rem;
}

.loading-spinner {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.report-content {
  padding: 2rem 0;
}

.summary-section,
.data-section,
.recommendations-section {
  background: white;
  border-radius: 0.75rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.summary-section h2,
.data-section h2,
.recommendations-section h2 {
  color: #1e293b;
  font-weight: 600;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  text-align: center;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.metric-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-input {
  flex: 1;
  max-width: 300px;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.rows-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  min-width: 120px;
}

.table-container {
  overflow-x: auto;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.data-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

.data-table th:hover {
  background: #f1f5f9;
}

.data-table tbody tr:hover {
  background: #f8fafc;
}

.sortable {
  position: relative;
}

.sort-asc,
.sort-desc {
  margin-left: 0.5rem;
  color: #3b82f6;
  font-weight: bold;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-info {
  font-size: 0.875rem;
  color: #64748b;
}

.recommendations-list {
  display: grid;
  gap: 1rem;
}

.recommendation-card {
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  position: relative;
}

.rec-priority {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.rec-priority.high {
  background: #fef2f2;
  color: #dc2626;
}

.rec-priority.medium {
  background: #fffbeb;
  color: #d97706;
}

.rec-priority.low {
  background: #f0fdf4;
  color: #16a34a;
}

.recommendation-card h3 {
  color: #1e293b;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  padding-right: 5rem;
}

.recommendation-card p {
  color: #64748b;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.rec-impact {
  font-size: 0.875rem;
  font-weight: 500;
  color: #059669;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .metric-value {
    font-size: 1.5rem;
  }
  
  .table-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    max-width: none;
  }
}
</style>