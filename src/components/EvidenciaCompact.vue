<template>
  <div class="evidencia-compact">
    <!-- Inline Field Selector -->
    <div class="field-selector-inline">
      <div class="selector-header">
        <h3>📋 Configurar Evidencia</h3>
        <div class="style-selector">
          <label :class="{ active: tableStyle === 'compact' }">
            <input type="radio" v-model="tableStyle" value="compact" />
            Compacto
          </label>
          <label :class="{ active: tableStyle === 'standard' }">
            <input type="radio" v-model="tableStyle" value="standard" />
            Estándar
          </label>
          <label :class="{ active: tableStyle === 'detailed' }">
            <input type="radio" v-model="tableStyle" value="detailed" />
            Detallado
          </label>
        </div>
      </div>

      <!-- Quick field selection in a compact grid -->
      <div class="fields-grid">
        <!-- Identification Fields -->
        <div class="field-section">
          <h4>Identificación</h4>
          <div class="field-list">
            <label v-for="field in identificationFields" :key="field.key" 
                   :class="{ selected: selectedFields.includes(field.key) }">
              <input type="checkbox" :value="field.key" v-model="selectedFields" />
              <span>{{ field.label }}</span>
            </label>
          </div>
        </div>

        <!-- Metric Fields -->
        <div class="field-section">
          <h4>Métricas</h4>
          <div class="field-list">
            <label v-for="metric in availableMetrics" :key="metric.key"
                   :class="{ selected: selectedFields.includes(metric.key) }">
              <input type="checkbox" :value="metric.key" v-model="selectedFields" />
              <span>{{ metric.label }}</span>
            </label>
          </div>
        </div>

        <!-- Quick Templates -->
        <div class="field-section templates">
          <h4>Plantillas</h4>
          <button @click="applyTemplate('basic')" class="template-btn">Básica</button>
          <button @click="applyTemplate('performance')" class="template-btn">Rendimiento</button>
          <button @click="applyTemplate('complete')" class="template-btn">Completa</button>
        </div>
      </div>
    </div>

    <!-- Table Display -->
    <div class="table-display">
      <PDFReportTable
        :data="tableData"
        :metrics="preparedMetrics"
        :table-style="tableStyle"
        :show-totals="showTotals"
        :platform="platform"
        class="fit-page"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import PDFReportTable from './PDFReportTable.vue'

const props = defineProps({
  data: { type: Array, required: true },
  platform: { 
    type: String, 
    default: 'facebook',
    validator: (value) => ['facebook', 'google', 'tiktok'].includes(value)
  },
  showTotals: { type: Boolean, default: true },
  maxRows: { type: Number, default: 20 } // Limit rows to fit on one page
})

const emit = defineEmits(['update:config'])

// State
const selectedFields = ref(['campaign_name', 'cost', 'impressions', 'clicks', 'ctr'])
const tableStyle = ref('compact') // Default to compact for space saving

// Platform-specific field definitions
const identificationFields = computed(() => {
  const base = [
    { key: 'campaign_name', label: 'Campaña' },
    { key: 'account_name', label: 'Cuenta' }
  ]
  
  if (props.platform === 'facebook' || props.platform === 'tiktok') {
    base.push({ key: 'adset_name', label: 'Conjunto' })
  }
  
  if (props.platform === 'google') {
    base.push({ key: 'ad_group_name', label: 'Grupo' })
  }
  
  return base
})

const availableMetrics = computed(() => {
  const universal = [
    { key: 'cost', label: 'Inversión' },
    { key: 'impressions', label: 'Impresiones' },
    { key: 'clicks', label: 'Clics' },
    { key: 'ctr', label: 'CTR' },
    { key: 'cpc', label: 'CPC' },
    { key: 'cpm', label: 'CPM' }
  ]
  
  const platformSpecific = {
    facebook: [
      { key: 'reach', label: 'Alcance' },
      { key: 'frequency', label: 'Frecuencia' },
      { key: 'purchases', label: 'Compras' },
      { key: 'roas', label: 'ROAS' }
    ],
    google: [
      { key: 'conversions', label: 'Conversiones' },
      { key: 'conversion_rate', label: 'Tasa Conv.' },
      { key: 'average_cpc', label: 'CPC Prom.' }
    ],
    tiktok: [
      { key: 'p_video_play_100', label: 'Video 100%' },
      { key: 'p_complete_payment_roas', label: 'ROAS' },
      { key: 'p_likes', label: 'Me Gusta' }
    ]
  }
  
  return [...universal, ...(platformSpecific[props.platform] || [])]
})

// Limit data to fit on one page
const tableData = computed(() => {
  return props.data.slice(0, props.maxRows)
})

// Prepare metrics for PDFReportTable
const preparedMetrics = computed(() => {
  return selectedFields.value.map(field => {
    // Find field definition
    const allFields = [...identificationFields.value, ...availableMetrics.value]
    const fieldDef = allFields.find(f => f.key === field)
    
    // Check if it's a metric or identification field
    const isMetric = availableMetrics.value.some(m => m.key === field)
    
    return {
      key: field,
      label: fieldDef?.label || field,
      format: isMetric ? getMetricFormat(field) : 'text',
      aggregate: isMetric ? 'sum' : 'none',
      align: isMetric ? 'text-right' : 'text-left'
    }
  })
})

// Get format for specific metrics
function getMetricFormat(key) {
  const formats = {
    cost: 'currency',
    cpc: 'currency',
    cpm: 'currency',
    revenue: 'currency',
    ctr: 'percentage',
    conversion_rate: 'percentage',
    p_video_play_100: 'percentage',
    p_video_play_75: 'percentage',
    p_video_play_50: 'percentage',
    p_video_play_25: 'percentage',
    frequency: 'decimal',
    roas: 'decimal',
    p_complete_payment_roas: 'decimal'
  }
  return formats[key] || 'number'
}

// Template configurations
const templates = {
  basic: ['campaign_name', 'cost', 'clicks', 'ctr'],
  performance: ['campaign_name', 'cost', 'clicks', 'ctr', 'conversions', 'roas'],
  complete: ['campaign_name', 'adset_name', 'cost', 'impressions', 'clicks', 'ctr', 'conversions']
}

// Apply template
function applyTemplate(templateName) {
  const template = templates[templateName] || []
  const allFieldKeys = [...identificationFields.value, ...availableMetrics.value].map(f => f.key)
  selectedFields.value = template.filter(field => allFieldKeys.includes(field))
}

// Save configuration when it changes
watch([selectedFields, tableStyle], () => {
  const config = {
    fields: selectedFields.value,
    style: tableStyle.value
  }
  localStorage.setItem(`evidencia-${props.platform}`, JSON.stringify(config))
  emit('update:config', config)
}, { deep: true })

// Load saved configuration
const loadConfig = () => {
  const saved = localStorage.getItem(`evidencia-${props.platform}`)
  if (saved) {
    try {
      const config = JSON.parse(saved)
      selectedFields.value = config.fields || selectedFields.value
      tableStyle.value = config.style || tableStyle.value
    } catch (e) {
      console.error('Error loading config:', e)
    }
  }
}

// Initialize
loadConfig()

// Watch platform changes
watch(() => props.platform, loadConfig)
</script>

<style scoped>
.evidencia-compact {
  background: white;
  border-radius: 8px;
  padding: 15px;
  max-width: 100%;
}

.field-selector-inline {
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.selector-header h3 {
  margin: 0;
  font-size: 16px;
  color: #202124;
}

.style-selector {
  display: flex;
  gap: 5px;
}

.style-selector label {
  padding: 4px 12px;
  background: white;
  border: 1px solid #dadce0;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.style-selector label.active {
  background: #4285f4;
  color: white;
  border-color: #4285f4;
}

.style-selector input {
  display: none;
}

.fields-grid {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: 15px;
}

.field-section h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #5f6368;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.field-list label {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  background: white;
  border: 1px solid #dadce0;
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.field-list label.selected {
  background: #e8f0fe;
  border-color: #4285f4;
  color: #1967d2;
}

.field-list input {
  display: none;
}

.field-list span {
  white-space: nowrap;
}

.templates {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.template-btn {
  padding: 4px 10px;
  font-size: 11px;
  background: white;
  color: #5f6368;
  border: 1px solid #dadce0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-btn:hover {
  background: #4285f4;
  color: white;
  border-color: #4285f4;
}

.table-display {
  border: 1px solid #e8eaed;
  border-radius: 6px;
  overflow: hidden;
}

/* Platform-specific colors */
.platform-facebook .field-list label.selected {
  background: #e7f3ff;
  border-color: #1877F2;
  color: #1877F2;
}

.platform-google .field-list label.selected {
  background: #e8f0fe;
  border-color: #4285f4;
  color: #4285f4;
}

.platform-tiktok .field-list label.selected {
  background: #ffe5ec;
  border-color: #FF0050;
  color: #FF0050;
}

/* Responsive */
@media (max-width: 768px) {
  .fields-grid {
    grid-template-columns: 1fr;
  }
  
  .selector-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

/* Print optimization */
@media print {
  .field-selector-inline {
    display: none;
  }
  
  .evidencia-compact {
    padding: 5px;
  }
  
  .table-display {
    border: none;
  }
}
</style>