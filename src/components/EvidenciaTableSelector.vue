<template>
  <div class="evidencia-selector">
    <h3>Configuración de Tablas de Evidencia</h3>
    
    <!-- Field Selection -->
    <div class="field-selection">
      <h4>Seleccionar Campos para Mostrar</h4>
      
      <!-- Non-metric fields -->
      <div class="field-group">
        <h5>Campos de Identificación</h5>
        <div class="field-grid">
          <label v-for="field in identificationFields" :key="field.key" class="field-checkbox">
            <input 
              type="checkbox" 
              :value="field.key"
              v-model="selectedFields"
              @change="updateSelection"
            />
            <span>{{ field.label }}</span>
          </label>
        </div>
      </div>

      <!-- Metric fields -->
      <div class="field-group">
        <h5>Métricas de Rendimiento</h5>
        <div class="field-grid">
          <label v-for="metric in availableMetrics" :key="metric.key" class="field-checkbox">
            <input 
              type="checkbox" 
              :value="metric.key"
              v-model="selectedFields"
              @change="updateSelection"
            />
            <span>{{ metric.label }}</span>
          </label>
        </div>
      </div>

      <!-- Date and status fields -->
      <div class="field-group">
        <h5>Información Temporal y Estado</h5>
        <div class="field-grid">
          <label v-for="field in temporalFields" :key="field.key" class="field-checkbox">
            <input 
              type="checkbox" 
              :value="field.key"
              v-model="selectedFields"
              @change="updateSelection"
            />
            <span>{{ field.label }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Table Style Selection -->
    <div class="style-selection">
      <h4>Estilo de Tabla</h4>
      <div class="style-options">
        <label class="style-radio">
          <input type="radio" v-model="tableStyle" value="compact" />
          <span>Compacto</span>
        </label>
        <label class="style-radio">
          <input type="radio" v-model="tableStyle" value="standard" />
          <span>Estándar</span>
        </label>
        <label class="style-radio">
          <input type="radio" v-model="tableStyle" value="detailed" />
          <span>Detallado</span>
        </label>
      </div>
    </div>

    <!-- Preview Button -->
    <div class="actions">
      <button @click="previewTable" class="btn-preview">
        Vista Previa de Tabla
      </button>
      <button @click="saveConfiguration" class="btn-save">
        Guardar Configuración
      </button>
    </div>

    <!-- Quick Templates -->
    <div class="templates">
      <h4>Plantillas Rápidas</h4>
      <div class="template-buttons">
        <button @click="applyTemplate('basic')" class="template-btn">
          Básica
        </button>
        <button @click="applyTemplate('performance')" class="template-btn">
          Rendimiento
        </button>
        <button @click="applyTemplate('complete')" class="template-btn">
          Completa
        </button>
        <button @click="applyTemplate('financial')" class="template-btn">
          Financiera
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  platform: { 
    type: String, 
    default: 'facebook',
    validator: (value) => ['facebook', 'google', 'tiktok'].includes(value)
  },
  initialFields: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:fields', 'update:style', 'preview'])

// Selected fields
const selectedFields = ref(props.initialFields.length ? props.initialFields : ['campaign_name', 'cost', 'clicks', 'impressions'])
const tableStyle = ref('standard')

// Field definitions
const identificationFields = computed(() => {
  const baseFields = [
    { key: 'campaign_name', label: 'Nombre de Campaña' },
    { key: 'campaign_id', label: 'ID de Campaña' },
    { key: 'account_name', label: 'Nombre de Cuenta' },
    { key: 'account_id', label: 'ID de Cuenta' }
  ]
  
  if (props.platform === 'facebook' || props.platform === 'tiktok') {
    baseFields.push(
      { key: 'adset_name', label: 'Nombre de Conjunto de Anuncios' },
      { key: 'adset_id', label: 'ID de Conjunto de Anuncios' },
      { key: 'ad_name', label: 'Nombre de Anuncio' },
      { key: 'ad_id', label: 'ID de Anuncio' }
    )
  }
  
  if (props.platform === 'google') {
    baseFields.push(
      { key: 'ad_group_name', label: 'Nombre de Grupo de Anuncios' },
      { key: 'ad_group_id', label: 'ID de Grupo de Anuncios' },
      { key: 'keyword', label: 'Palabra Clave' }
    )
  }
  
  return baseFields
})

const availableMetrics = computed(() => {
  const metrics = [
    // Universal metrics
    { key: 'cost', label: 'Inversión' },
    { key: 'clicks', label: 'Clics' },
    { key: 'impressions', label: 'Impresiones' },
    { key: 'ctr', label: 'CTR' },
    { key: 'cpc', label: 'CPC' },
    { key: 'cpm', label: 'CPM' }
  ]
  
  if (props.platform === 'facebook') {
    metrics.push(
      { key: 'reach', label: 'Alcance' },
      { key: 'frequency', label: 'Frecuencia' },
      { key: 'purchases', label: 'Compras' },
      { key: 'revenue', label: 'Ingresos' },
      { key: 'roas', label: 'ROAS' },
      { key: 'link_clicks', label: 'Clics en Enlace' },
      { key: 'landing_page_views', label: 'Vistas de Página' },
      { key: 'add_to_cart', label: 'Agregar al Carrito' },
      { key: 'initiate_checkout', label: 'Iniciar Checkout' },
      { key: 'engagement_rate', label: 'Tasa de Interacción' }
    )
  }
  
  if (props.platform === 'google') {
    metrics.push(
      { key: 'conversions', label: 'Conversiones' },
      { key: 'all_conversions', label: 'Todas las Conversiones' },
      { key: 'conversion_rate', label: 'Tasa de Conversión' },
      { key: 'conversion_value', label: 'Valor de Conversión' },
      { key: 'average_cpc', label: 'CPC Promedio' },
      { key: 'average_cpm', label: 'CPM Promedio' },
      { key: 'average_position', label: 'Posición Promedio' },
      { key: 'search_impression_share', label: 'Cuota de Impresiones' }
    )
  }
  
  if (props.platform === 'tiktok') {
    metrics.push(
      { key: 'p_complete_payment_roas', label: 'ROAS' },
      { key: 'p_video_play', label: 'Reproducciones de Video' },
      { key: 'p_video_play_100', label: 'Video Completo (100%)' },
      { key: 'p_video_play_75', label: 'Video 75%' },
      { key: 'p_video_play_50', label: 'Video 50%' },
      { key: 'p_video_play_25', label: 'Video 25%' },
      { key: 'p_likes', label: 'Me Gusta' },
      { key: 'p_comments', label: 'Comentarios' },
      { key: 'p_shares', label: 'Compartidos' },
      { key: 'p_profile_visits', label: 'Visitas al Perfil' }
    )
  }
  
  return metrics
})

const temporalFields = [
  { key: 'date', label: 'Fecha' },
  { key: 'date_start', label: 'Fecha de Inicio' },
  { key: 'date_stop', label: 'Fecha de Fin' },
  { key: 'status', label: 'Estado' },
  { key: 'delivery_status', label: 'Estado de Entrega' },
  { key: 'budget', label: 'Presupuesto' },
  { key: 'budget_remaining', label: 'Presupuesto Restante' },
  { key: 'objective', label: 'Objetivo' }
]

// Templates
const templates = {
  basic: ['campaign_name', 'cost', 'clicks', 'impressions', 'ctr'],
  performance: ['campaign_name', 'adset_name', 'cost', 'clicks', 'ctr', 'conversions', 'roas'],
  complete: [
    'campaign_name', 'adset_name', 'ad_name', 'status',
    'cost', 'impressions', 'reach', 'clicks', 'ctr', 
    'conversions', 'revenue', 'roas'
  ],
  financial: ['campaign_name', 'budget', 'cost', 'revenue', 'roas', 'purchases', 'cpc']
}

// Methods
const updateSelection = () => {
  emit('update:fields', selectedFields.value)
}

const previewTable = () => {
  emit('preview', {
    fields: selectedFields.value,
    style: tableStyle.value
  })
}

const saveConfiguration = () => {
  const config = {
    fields: selectedFields.value,
    style: tableStyle.value,
    platform: props.platform
  }
  
  // Save to localStorage for persistence
  localStorage.setItem('evidencia-config', JSON.stringify(config))
  
  emit('update:fields', selectedFields.value)
  emit('update:style', tableStyle.value)
}

const applyTemplate = (templateName) => {
  const templateFields = templates[templateName] || []
  selectedFields.value = templateFields.filter(field => {
    // Check if field exists in available fields
    return identificationFields.value.some(f => f.key === field) ||
           availableMetrics.value.some(f => f.key === field) ||
           temporalFields.some(f => f.key === field)
  })
  updateSelection()
}

// Load saved configuration on mount
const loadSavedConfig = () => {
  const saved = localStorage.getItem('evidencia-config')
  if (saved) {
    try {
      const config = JSON.parse(saved)
      if (config.platform === props.platform) {
        selectedFields.value = config.fields || selectedFields.value
        tableStyle.value = config.style || tableStyle.value
      }
    } catch (e) {
      console.error('Error loading saved config:', e)
    }
  }
}

// Watch for platform changes
watch(() => props.platform, () => {
  loadSavedConfig()
})

// Load on mount
loadSavedConfig()
</script>

<style scoped>
.evidencia-selector {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h3 {
  color: #202124;
  font-size: 20px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #4285f4;
}

h4 {
  color: #5f6368;
  font-size: 16px;
  margin: 20px 0 12px;
}

h5 {
  color: #5f6368;
  font-size: 14px;
  margin: 16px 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-selection {
  margin-bottom: 30px;
}

.field-group {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.field-checkbox {
  display: flex;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.field-checkbox:hover {
  background: #e8f0fe;
}

.field-checkbox input {
  margin-right: 8px;
  cursor: pointer;
}

.field-checkbox span {
  font-size: 14px;
  color: #202124;
}

.style-selection {
  margin: 30px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.style-options {
  display: flex;
  gap: 20px;
  margin-top: 10px;
}

.style-radio {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.style-radio:hover {
  background: #e8f0fe;
  transform: translateY(-1px);
}

.style-radio input {
  margin-right: 8px;
}

.style-radio span {
  font-size: 14px;
  color: #202124;
}

.actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.btn-preview, .btn-save {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preview {
  background: #f1f3f4;
  color: #202124;
}

.btn-preview:hover {
  background: #e8eaed;
  transform: translateY(-1px);
}

.btn-save {
  background: #4285f4;
  color: white;
}

.btn-save:hover {
  background: #1a73e8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.templates {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #dadce0;
}

.template-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.template-btn {
  padding: 8px 16px;
  font-size: 13px;
  background: white;
  color: #5f6368;
  border: 1px solid #dadce0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-btn:hover {
  background: #4285f4;
  color: white;
  border-color: #4285f4;
  transform: translateY(-1px);
}
</style>