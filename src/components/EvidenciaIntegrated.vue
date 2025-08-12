<template>
  <div class="evidencia-integrated">
    <!-- Header with configuration button -->
    <div class="evidencia-header">
      <div class="header-content">
        <h2>📋 Evidencia - Resumen del Período Completo</h2>
        <p class="subtitle">
          Datos agregados del {{ dateRange }}
        </p>
      </div>
      <button @click="openModal" class="config-btn">
        <span class="icon">⚙️</span>
        <span>Configurar Tabla</span>
      </button>
    </div>

    <!-- Summary Stats -->
    <div class="summary-stats" v-if="aggregatedData.length">
      <div class="stat-card">
        <span class="stat-label">Campañas</span>
        <span class="stat-value">{{ aggregatedData.length }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Inversión Total</span>
        <span class="stat-value">{{ formatCurrency(totalCost) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Impresiones</span>
        <span class="stat-value">{{ formatNumber(totalImpressions) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Clics</span>
        <span class="stat-value">{{ formatNumber(totalClicks) }}</span>
      </div>
    </div>

    <!-- Table Display -->
    <div class="table-container" v-if="aggregatedData.length">
      <PDFReportTable
        :data="displayData"
        :metrics="tableMetrics"
        :table-style="tableStyle"
        :show-totals="true"
        :platform="platform"
        class="fit-page"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <span class="empty-icon">📊</span>
      <h3>No hay datos para mostrar</h3>
      <p>Configura los campos y el período para ver la evidencia</p>
    </div>

    <!-- Configuration Modal -->
    <EvidenciaModal
      :is-open="modalOpen"
      :platform="platform"
      :initial-fields="selectedFields"
      :initial-style="tableStyle"
      @close="modalOpen = false"
      @apply="applyConfiguration"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import PDFReportTable from './PDFReportTable.vue'
import EvidenciaModal from './EvidenciaModal.vue'
import { prepareEvidenciaData } from '@/utils/dataAggregator.js'

const props = defineProps({
  rawData: { type: Array, required: true },
  platform: { 
    type: String, 
    default: 'facebook',
    validator: (value) => ['facebook', 'google', 'tiktok'].includes(value)
  },
  dateStart: { type: String, default: '' },
  dateEnd: { type: String, default: '' },
  groupBy: { type: String, default: 'campaign_name' }
})

const emit = defineEmits(['export'])

// State
const modalOpen = ref(false)
const selectedFields = ref([
  'campaign_name',
  'status',
  'cost',
  'impressions',
  'clicks',
  'ctr',
  'conversions',
  'roas'
])
const tableStyle = ref('standard')

// Computed properties
const dateRange = computed(() => {
  if (props.dateStart && props.dateEnd) {
    const start = new Date(props.dateStart).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    const end = new Date(props.dateEnd).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    return `${start} - ${end}`
  }
  return 'Período completo'
})

// Aggregate data for entire period
const aggregatedData = computed(() => {
  return prepareEvidenciaData(props.rawData, {
    groupBy: props.groupBy,
    sortBy: 'cost',
    sortOrder: 'desc'
  })
})

// Display data with selected fields
const displayData = computed(() => {
  return aggregatedData.value.map(row => {
    const displayRow = {}
    
    // Always include the groupBy field first
    displayRow[props.groupBy] = row[props.groupBy]
    
    // Add selected fields
    selectedFields.value.forEach(field => {
      if (field !== props.groupBy) {
        displayRow[field] = row[field] !== undefined ? row[field] : null
      }
    })
    
    return displayRow
  })
})

// Prepare metrics configuration for PDFReportTable
const tableMetrics = computed(() => {
  return selectedFields.value.map(field => {
    const fieldConfig = getFieldConfig(field)
    return {
      key: field,
      label: fieldConfig.label,
      format: fieldConfig.format,
      aggregate: fieldConfig.aggregate,
      align: fieldConfig.align
    }
  })
})

// Summary statistics
const totalCost = computed(() => {
  return aggregatedData.value.reduce((sum, row) => sum + (row.cost || 0), 0)
})

const totalImpressions = computed(() => {
  return aggregatedData.value.reduce((sum, row) => sum + (row.impressions || 0), 0)
})

const totalClicks = computed(() => {
  return aggregatedData.value.reduce((sum, row) => sum + (row.clicks || 0), 0)
})

// Field configuration
function getFieldConfig(field) {
  const configs = {
    // Identification fields
    campaign_name: { label: 'Campaña', format: 'text', aggregate: 'none', align: 'text-left' },
    campaign_id: { label: 'ID Campaña', format: 'text', aggregate: 'none', align: 'text-left' },
    adset_name: { label: 'Conjunto', format: 'text', aggregate: 'none', align: 'text-left' },
    ad_name: { label: 'Anuncio', format: 'text', aggregate: 'none', align: 'text-left' },
    account_name: { label: 'Cuenta', format: 'text', aggregate: 'none', align: 'text-left' },
    status: { label: 'Estado', format: 'text', aggregate: 'none', align: 'text-center' },
    objective: { label: 'Objetivo', format: 'text', aggregate: 'none', align: 'text-left' },
    
    // Metrics
    cost: { label: 'Inversión', format: 'currency', aggregate: 'sum', align: 'text-right' },
    impressions: { label: 'Impresiones', format: 'number', aggregate: 'sum', align: 'text-right' },
    clicks: { label: 'Clics', format: 'number', aggregate: 'sum', align: 'text-right' },
    ctr: { label: 'CTR', format: 'percentage', aggregate: 'average', align: 'text-right' },
    cpc: { label: 'CPC', format: 'currency', aggregate: 'average', align: 'text-right' },
    cpm: { label: 'CPM', format: 'currency', aggregate: 'average', align: 'text-right' },
    reach: { label: 'Alcance', format: 'number', aggregate: 'sum', align: 'text-right' },
    frequency: { label: 'Frecuencia', format: 'decimal', aggregate: 'average', align: 'text-right' },
    conversions: { label: 'Conversiones', format: 'number', aggregate: 'sum', align: 'text-right' },
    purchases: { label: 'Compras', format: 'number', aggregate: 'sum', align: 'text-right' },
    revenue: { label: 'Ingresos', format: 'currency', aggregate: 'sum', align: 'text-right' },
    roas: { label: 'ROAS', format: 'decimal', aggregate: 'average', align: 'text-right' },
    budget: { label: 'Presupuesto', format: 'currency', aggregate: 'sum', align: 'text-right' },
    conversion_rate: { label: 'Tasa Conv.', format: 'percentage', aggregate: 'average', align: 'text-right' },
    
    // TikTok specific
    p_video_play_100: { label: 'Video 100%', format: 'percentage', aggregate: 'average', align: 'text-right' },
    p_complete_payment_roas: { label: 'ROAS', format: 'decimal', aggregate: 'average', align: 'text-right' },
    p_likes: { label: 'Me Gusta', format: 'number', aggregate: 'sum', align: 'text-right' },
    p_shares: { label: 'Compartidos', format: 'number', aggregate: 'sum', align: 'text-right' }
  }
  
  return configs[field] || { 
    label: field, 
    format: 'text', 
    aggregate: 'none', 
    align: 'text-left' 
  }
}

// Methods
const openModal = () => {
  modalOpen.value = true
}

const applyConfiguration = (config) => {
  selectedFields.value = config.fields
  tableStyle.value = config.style
  saveConfiguration()
}

const saveConfiguration = () => {
  const config = {
    fields: selectedFields.value,
    style: tableStyle.value
  }
  localStorage.setItem(`evidencia-config-${props.platform}`, JSON.stringify(config))
}

const loadConfiguration = () => {
  const saved = localStorage.getItem(`evidencia-config-${props.platform}`)
  if (saved) {
    try {
      const config = JSON.parse(saved)
      selectedFields.value = config.fields || selectedFields.value
      tableStyle.value = config.style || tableStyle.value
    } catch (e) {
      console.error('Error loading configuration:', e)
    }
  }
}

// Formatting helpers
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value)
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('es-MX').format(value)
}

// Lifecycle
onMounted(() => {
  loadConfiguration()
})

// Watch for platform changes
watch(() => props.platform, () => {
  loadConfiguration()
})
</script>

<style scoped>
.evidencia-integrated {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
}

.evidencia-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e8eaed;
}

.header-content h2 {
  margin: 0;
  font-size: 20px;
  color: #202124;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: #5f6368;
}

.config-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #dadce0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #202124;
  cursor: pointer;
  transition: all 0.2s;
}

.config-btn:hover {
  background: #e8f0fe;
  border-color: #4285f4;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.config-btn .icon {
  font-size: 16px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e8eaed;
}

.stat-label {
  font-size: 12px;
  color: #5f6368;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #202124;
  margin-top: 4px;
}

.table-container {
  border: 1px solid #e8eaed;
  border-radius: 8px;
  overflow: hidden;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #5f6368;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #202124;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* Platform-specific styling */
.platform-facebook .config-btn:hover {
  background: #e7f3ff;
  border-color: #1877F2;
}

.platform-google .config-btn:hover {
  background: #e8f0fe;
  border-color: #4285f4;
}

.platform-tiktok .config-btn:hover {
  background: #ffe5ec;
  border-color: #FF0050;
}

/* Responsive */
@media (max-width: 768px) {
  .evidencia-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Print optimization */
@media print {
  .config-btn {
    display: none;
  }
  
  .evidencia-integrated {
    padding: 10px;
    box-shadow: none;
    border: 1px solid #dadce0;
  }
  
  .summary-stats {
    display: none;
  }
}
</style>