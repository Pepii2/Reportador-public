<template>
  <div class="evidencia-section">
    <!-- Section Header -->
    <div class="section-header">
      <h2>📋 Evidencia</h2>
      <p class="section-subtitle">Detalle completo de las campañas incluidas en este reporte</p>
    </div>

    <!-- Configuration Toggle -->
    <div class="config-toggle" v-if="showConfig">
      <button @click="showSelector = !showSelector" class="toggle-btn">
        <span v-if="!showSelector">⚙️ Configurar Campos</span>
        <span v-else>✓ Cerrar Configuración</span>
      </button>
    </div>

    <!-- Field Selector -->
    <EvidenciaTableSelector
      v-if="showSelector"
      :platform="platform"
      :data="tableData"
      :initial-fields="selectedFields"
      @update:fields="updateFields"
      @update:style="updateStyle"
      @preview="handlePreview"
    />

    <!-- Tables Display -->
    <div class="tables-container" v-if="!showSelector || previewMode">
      <!-- Table with selected fields -->
      <div class="table-wrapper">
        <PDFReportTable
          :data="preparedData"
          :metrics="preparedMetrics"
          :table-style="tableStyle"
          :show-totals="showTotals"
          :platform="platform"
          :headers="tableHeaders"
        />
      </div>

      <!-- Pagination for large datasets -->
      <div v-if="showPagination && totalPages > 1" class="pagination">
        <button 
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          ← Anterior
        </button>
        <span class="page-info">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        <button 
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Siguiente →
        </button>
      </div>
    </div>

    <!-- Export Options -->
    <div class="export-options" v-if="!showSelector">
      <button @click="exportToExcel" class="export-btn excel">
        📊 Exportar a Excel
      </button>
      <button @click="exportToCSV" class="export-btn csv">
        📄 Exportar a CSV
      </button>
      <button @click="copyToClipboard" class="export-btn clipboard">
        📋 Copiar al Portapapeles
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import PDFReportTable from './PDFReportTable.vue'
import EvidenciaTableSelector from './EvidenciaTableSelector.vue'

const props = defineProps({
  data: { type: Array, required: true },
  platform: { 
    type: String, 
    default: 'facebook',
    validator: (value) => ['facebook', 'google', 'tiktok'].includes(value)
  },
  showConfig: { type: Boolean, default: true },
  initialFields: { type: Array, default: () => [] },
  pageSize: { type: Number, default: 50 },
  showPagination: { type: Boolean, default: true },
  showTotals: { type: Boolean, default: true }
})

const emit = defineEmits(['export', 'update:config'])

// State
const showSelector = ref(false)
const previewMode = ref(false)
const selectedFields = ref(props.initialFields.length ? props.initialFields : [
  'campaign_name',
  'adset_name',
  'status',
  'cost',
  'impressions',
  'clicks',
  'ctr'
])
const tableStyle = ref('standard')
const currentPage = ref(1)

// Field type definitions
const fieldTypes = {
  // Identification fields
  campaign_name: { type: 'text', label: 'Campaña' },
  campaign_id: { type: 'text', label: 'ID Campaña' },
  adset_name: { type: 'text', label: 'Conjunto de Anuncios' },
  adset_id: { type: 'text', label: 'ID Conjunto' },
  ad_name: { type: 'text', label: 'Anuncio' },
  ad_id: { type: 'text', label: 'ID Anuncio' },
  account_name: { type: 'text', label: 'Cuenta' },
  account_id: { type: 'text', label: 'ID Cuenta' },
  
  // Status fields
  status: { type: 'status', label: 'Estado' },
  delivery_status: { type: 'status', label: 'Entrega' },
  
  // Date fields
  date: { type: 'date', label: 'Fecha' },
  date_start: { type: 'date', label: 'Inicio' },
  date_stop: { type: 'date', label: 'Fin' },
  
  // Metric fields
  cost: { type: 'metric', format: 'currency', label: 'Inversión' },
  impressions: { type: 'metric', format: 'number', label: 'Impresiones' },
  clicks: { type: 'metric', format: 'number', label: 'Clics' },
  ctr: { type: 'metric', format: 'percentage', label: 'CTR' },
  cpc: { type: 'metric', format: 'currency', label: 'CPC' },
  cpm: { type: 'metric', format: 'currency', label: 'CPM' },
  reach: { type: 'metric', format: 'number', label: 'Alcance' },
  frequency: { type: 'metric', format: 'decimal', label: 'Frecuencia' },
  conversions: { type: 'metric', format: 'number', label: 'Conversiones' },
  revenue: { type: 'metric', format: 'currency', label: 'Ingresos' },
  roas: { type: 'metric', format: 'decimal', label: 'ROAS' },
  budget: { type: 'metric', format: 'currency', label: 'Presupuesto' },
  objective: { type: 'text', label: 'Objetivo' }
}

// Computed properties
const totalPages = computed(() => {
  if (!props.showPagination) return 1
  return Math.ceil(props.data.length / props.pageSize)
})

const paginatedData = computed(() => {
  if (!props.showPagination) return props.data
  
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return props.data.slice(start, end)
})

const preparedData = computed(() => {
  // Transform data to include all selected fields
  return paginatedData.value.map(row => {
    const preparedRow = {}
    selectedFields.value.forEach(field => {
      preparedRow[field] = row[field] || null
    })
    return preparedRow
  })
})

const preparedMetrics = computed(() => {
  // Build metrics array for PDFReportTable
  return selectedFields.value.map(field => {
    const fieldType = fieldTypes[field] || {}
    
    if (fieldType.type === 'metric') {
      return {
        key: field,
        label: fieldType.label || field,
        format: fieldType.format || 'number',
        aggregate: fieldType.aggregate || 'sum'
      }
    } else {
      // Non-metric fields
      return {
        key: field,
        label: fieldType.label || field,
        format: fieldType.type === 'date' ? 'date' : 'text',
        aggregate: 'none',
        align: 'text-left'
      }
    }
  })
})

const tableHeaders = computed(() => ({
  campaign: preparedMetrics.value[0]?.label || 'Campaña',
  total: 'Total'
}))

// Methods
const updateFields = (fields) => {
  selectedFields.value = fields
  emit('update:config', { fields, style: tableStyle.value })
}

const updateStyle = (style) => {
  tableStyle.value = style
  emit('update:config', { fields: selectedFields.value, style })
}

const handlePreview = (config) => {
  previewMode.value = true
  selectedFields.value = config.fields
  tableStyle.value = config.style
}

// Export functions
const exportToExcel = () => {
  // Prepare data for export
  const exportData = preparedData.value.map(row => {
    const exportRow = {}
    preparedMetrics.value.forEach(metric => {
      exportRow[metric.label] = formatValueForExport(row[metric.key], metric.format)
    })
    return exportRow
  })
  
  emit('export', {
    type: 'excel',
    data: exportData,
    filename: `evidencia_${props.platform}_${new Date().toISOString().split('T')[0]}.xlsx`
  })
}

const exportToCSV = () => {
  // Create CSV content
  const headers = preparedMetrics.value.map(m => m.label).join(',')
  const rows = preparedData.value.map(row => {
    return preparedMetrics.value.map(metric => {
      const value = formatValueForExport(row[metric.key], metric.format)
      // Escape commas and quotes in CSV
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(',')
  }).join('\n')
  
  const csvContent = `${headers}\n${rows}`
  
  emit('export', {
    type: 'csv',
    data: csvContent,
    filename: `evidencia_${props.platform}_${new Date().toISOString().split('T')[0]}.csv`
  })
}

const copyToClipboard = async () => {
  // Create tab-separated content for clipboard
  const headers = preparedMetrics.value.map(m => m.label).join('\t')
  const rows = preparedData.value.map(row => {
    return preparedMetrics.value.map(metric => {
      return formatValueForExport(row[metric.key], metric.format)
    }).join('\t')
  }).join('\n')
  
  const clipboardContent = `${headers}\n${rows}`
  
  try {
    await navigator.clipboard.writeText(clipboardContent)
    // Show success message
    alert('Datos copiados al portapapeles')
  } catch (err) {
    console.error('Error copying to clipboard:', err)
    alert('Error al copiar los datos')
  }
}

const formatValueForExport = (value, format) => {
  if (value == null || value === '') return ''
  
  switch (format) {
    case 'currency':
      return Number(value).toFixed(2)
    case 'percentage':
      return (Number(value) * 100).toFixed(2) + '%'
    case 'number':
      return Number(value).toLocaleString()
    case 'decimal':
      return Number(value).toFixed(2)
    case 'date':
      try {
        return new Date(value).toLocaleDateString('es-MX')
      } catch {
        return value
      }
    default:
      return value
  }
}

// Load saved configuration
const loadSavedConfig = () => {
  const saved = localStorage.getItem(`evidencia-config-${props.platform}`)
  if (saved) {
    try {
      const config = JSON.parse(saved)
      selectedFields.value = config.fields || selectedFields.value
      tableStyle.value = config.style || tableStyle.value
    } catch (e) {
      console.error('Error loading saved config:', e)
    }
  }
}

// Save configuration when it changes
watch([selectedFields, tableStyle], () => {
  const config = {
    fields: selectedFields.value,
    style: tableStyle.value
  }
  localStorage.setItem(`evidencia-config-${props.platform}`, JSON.stringify(config))
}, { deep: true })

// Initialize
loadSavedConfig()
</script>

<style scoped>
.evidencia-section {
  margin: 40px 0;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.section-header {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e8eaed;
}

.section-header h2 {
  color: #202124;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.section-subtitle {
  color: #5f6368;
  font-size: 14px;
  margin: 0;
}

.config-toggle {
  margin-bottom: 20px;
}

.toggle-btn {
  padding: 10px 20px;
  background: #f8f9fa;
  color: #202124;
  border: 1px solid #dadce0;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: #e8f0fe;
  border-color: #4285f4;
  transform: translateY(-1px);
}

.tables-container {
  margin: 20px 0;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e8eaed;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.page-btn {
  padding: 8px 16px;
  background: white;
  color: #4285f4;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #e8f0fe;
  border-color: #4285f4;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #5f6368;
  font-size: 14px;
  font-weight: 500;
}

.export-options {
  display: flex;
  gap: 12px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e8eaed;
}

.export-btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #dadce0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  color: #202124;
}

.export-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.export-btn.excel:hover {
  background: #34a853;
  color: white;
  border-color: #34a853;
}

.export-btn.csv:hover {
  background: #fbbc04;
  color: white;
  border-color: #fbbc04;
}

.export-btn.clipboard:hover {
  background: #4285f4;
  color: white;
  border-color: #4285f4;
}

/* Responsive */
@media (max-width: 768px) {
  .evidencia-section {
    padding: 20px 15px;
  }
  
  .export-options {
    flex-direction: column;
  }
  
  .export-btn {
    width: 100%;
  }
}

/* Print styles */
@media print {
  .config-toggle,
  .export-options,
  .pagination {
    display: none;
  }
  
  .evidencia-section {
    box-shadow: none;
    border: 1px solid #dadce0;
    page-break-inside: avoid;
  }
}
</style>