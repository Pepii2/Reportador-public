<template>
  <Teleport to="body">
    <div v-if="isOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-card" @click.stop>
        <!-- Modal Header -->
        <div class="modal-header">
          <h2>⚙️ Configurar Tabla de Evidencia</h2>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
          <!-- Platform Indicator -->
          <div class="platform-indicator" :class="`platform-${platform}`">
            <span class="platform-label">Plataforma:</span>
            <span class="platform-name">{{ platformName }}</span>
          </div>

          <!-- Table Style Selection -->
          <div class="style-section">
            <h3>Estilo de Tabla</h3>
            <div class="style-options">
              <label v-for="style in tableStyles" :key="style.value" 
                     :class="['style-option', { active: selectedStyle === style.value }]">
                <input type="radio" v-model="selectedStyle" :value="style.value" />
                <span class="style-icon">{{ style.icon }}</span>
                <span class="style-name">{{ style.label }}</span>
                <span class="style-desc">{{ style.description }}</span>
              </label>
            </div>
          </div>

          <!-- Field Selection -->
          <div class="fields-section">
            <h3>Seleccionar Campos</h3>
            
            <!-- Quick Actions -->
            <div class="quick-actions">
              <button @click="selectAll" class="quick-btn">Seleccionar Todo</button>
              <button @click="clearAll" class="quick-btn">Limpiar</button>
              <div class="template-selector">
                <label>Plantilla:</label>
                <select v-model="selectedTemplate" @change="applyTemplate">
                  <option value="">Personalizado</option>
                  <option value="basic">Básica</option>
                  <option value="performance">Rendimiento</option>
                  <option value="financial">Financiera</option>
                  <option value="complete">Completa</option>
                </select>
              </div>
            </div>

            <!-- Fields Grid -->
            <div class="fields-container">
              <!-- Identification Fields -->
              <div class="field-group">
                <h4>📋 Campos de Identificación</h4>
                <div class="field-grid">
                  <label v-for="field in identificationFields" :key="field.key"
                         :class="['field-item', { selected: selectedFields.includes(field.key) }]">
                    <input type="checkbox" :value="field.key" v-model="selectedFields" />
                    <span class="field-label">{{ field.label }}</span>
                    <span class="field-key">{{ field.key }}</span>
                  </label>
                </div>
              </div>

              <!-- Metric Fields -->
              <div class="field-group">
                <h4>📊 Métricas de Rendimiento</h4>
                <div class="field-grid">
                  <label v-for="metric in performanceMetrics" :key="metric.key"
                         :class="['field-item', { selected: selectedFields.includes(metric.key) }]">
                    <input type="checkbox" :value="metric.key" v-model="selectedFields" />
                    <span class="field-label">{{ metric.label }}</span>
                    <span class="field-format">{{ metric.format }}</span>
                  </label>
                </div>
              </div>

              <!-- Additional Fields -->
              <div class="field-group" v-if="additionalFields.length">
                <h4>📅 Campos Adicionales</h4>
                <div class="field-grid">
                  <label v-for="field in additionalFields" :key="field.key"
                         :class="['field-item', { selected: selectedFields.includes(field.key) }]">
                    <input type="checkbox" :value="field.key" v-model="selectedFields" />
                    <span class="field-label">{{ field.label }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Field Count -->
            <div class="field-count">
              <span>{{ selectedFields.length }} campos seleccionados</span>
              <span class="warning" v-if="selectedFields.length > 10">
                ⚠️ Muchos campos pueden dificultar la lectura
              </span>
            </div>
          </div>

          <!-- Preview Section -->
          <div class="preview-section">
            <h3>Vista Previa</h3>
            <div class="preview-table">
              <table>
                <thead>
                  <tr>
                    <th v-for="field in previewHeaders" :key="field">
                      {{ getFieldLabel(field) }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td v-for="field in previewHeaders" :key="field">
                      {{ getSampleValue(field) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Cancelar</button>
          <button class="btn-apply" @click="applyConfiguration">
            <span>✓ Aplicar Configuración</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  platform: { 
    type: String, 
    default: 'facebook',
    validator: (value) => ['facebook', 'google', 'tiktok'].includes(value)
  },
  initialFields: { type: Array, default: () => [] },
  initialStyle: { type: String, default: 'standard' }
})

const emit = defineEmits(['close', 'apply'])

// State
const selectedFields = ref(props.initialFields.length ? [...props.initialFields] : [
  'campaign_name', 'cost', 'impressions', 'clicks', 'ctr'
])
const selectedStyle = ref(props.initialStyle)
const selectedTemplate = ref('')

// Platform name mapping
const platformName = computed(() => ({
  facebook: 'Facebook / Meta',
  google: 'Google Ads',
  tiktok: 'TikTok Ads'
})[props.platform])

// Table styles configuration
const tableStyles = [
  {
    value: 'compact',
    label: 'Compacto',
    icon: '▤',
    description: 'Máxima densidad de información'
  },
  {
    value: 'standard',
    label: 'Estándar',
    icon: '☰',
    description: 'Balance entre legibilidad y espacio'
  },
  {
    value: 'detailed',
    label: 'Detallado',
    icon: '▦',
    description: 'Espaciado amplio y destacado'
  }
]

// Field definitions based on platform
const identificationFields = computed(() => {
  const base = [
    { key: 'campaign_name', label: 'Nombre de Campaña' },
    { key: 'campaign_id', label: 'ID de Campaña' },
    { key: 'account_name', label: 'Nombre de Cuenta' }
  ]
  
  if (props.platform === 'facebook') {
    base.push(
      { key: 'adset_name', label: 'Conjunto de Anuncios' },
      { key: 'ad_name', label: 'Nombre del Anuncio' }
    )
  } else if (props.platform === 'google') {
    base.push(
      { key: 'ad_group_name', label: 'Grupo de Anuncios' },
      { key: 'keyword', label: 'Palabra Clave' }
    )
  } else if (props.platform === 'tiktok') {
    base.push(
      { key: 'adset_name', label: 'Grupo de Anuncios' },
      { key: 'ad_name', label: 'Nombre del Anuncio' }
    )
  }
  
  return base
})

const performanceMetrics = computed(() => {
  const universal = [
    { key: 'cost', label: 'Inversión Total', format: '💰' },
    { key: 'impressions', label: 'Impresiones', format: '👁️' },
    { key: 'clicks', label: 'Clics', format: '👆' },
    { key: 'ctr', label: 'CTR', format: '%' },
    { key: 'cpc', label: 'CPC', format: '💰' },
    { key: 'cpm', label: 'CPM', format: '💰' }
  ]
  
  if (props.platform === 'facebook') {
    universal.push(
      { key: 'reach', label: 'Alcance', format: '👥' },
      { key: 'frequency', label: 'Frecuencia', format: '#' },
      { key: 'purchases', label: 'Compras', format: '🛒' },
      { key: 'revenue', label: 'Ingresos', format: '💰' },
      { key: 'roas', label: 'ROAS', format: 'x' },
      { key: 'link_clicks', label: 'Clics en Enlace', format: '🔗' }
    )
  } else if (props.platform === 'google') {
    universal.push(
      { key: 'conversions', label: 'Conversiones', format: '✓' },
      { key: 'conversion_rate', label: 'Tasa de Conversión', format: '%' },
      { key: 'conversion_value', label: 'Valor de Conversión', format: '💰' },
      { key: 'average_position', label: 'Posición Promedio', format: '#' }
    )
  } else if (props.platform === 'tiktok') {
    universal.push(
      { key: 'p_video_play_100', label: 'Video Completo', format: '%' },
      { key: 'p_complete_payment_roas', label: 'ROAS', format: 'x' },
      { key: 'p_likes', label: 'Me Gusta', format: '❤️' },
      { key: 'p_shares', label: 'Compartidos', format: '↗️' }
    )
  }
  
  return universal
})

const additionalFields = computed(() => [
  { key: 'status', label: 'Estado' },
  { key: 'budget', label: 'Presupuesto' },
  { key: 'objective', label: 'Objetivo' }
])

// Preview headers (first 5 selected fields)
const previewHeaders = computed(() => selectedFields.value.slice(0, 5))

// Templates
const templates = {
  basic: ['campaign_name', 'cost', 'clicks', 'impressions', 'ctr'],
  performance: ['campaign_name', 'cost', 'clicks', 'ctr', 'conversions', 'roas'],
  financial: ['campaign_name', 'budget', 'cost', 'revenue', 'roas', 'cpc'],
  complete: ['campaign_name', 'adset_name', 'status', 'cost', 'impressions', 'clicks', 'ctr', 'conversions', 'roas']
}

// Methods
const closeModal = () => {
  emit('close')
}

const applyConfiguration = () => {
  emit('apply', {
    fields: selectedFields.value,
    style: selectedStyle.value,
    platform: props.platform
  })
  closeModal()
}

const selectAll = () => {
  const allFields = [
    ...identificationFields.value.map(f => f.key),
    ...performanceMetrics.value.map(f => f.key),
    ...additionalFields.value.map(f => f.key)
  ]
  selectedFields.value = allFields
}

const clearAll = () => {
  selectedFields.value = []
}

const applyTemplate = () => {
  if (selectedTemplate.value && templates[selectedTemplate.value]) {
    selectedFields.value = [...templates[selectedTemplate.value]]
  }
}

const getFieldLabel = (key) => {
  const allFields = [...identificationFields.value, ...performanceMetrics.value, ...additionalFields.value]
  const field = allFields.find(f => f.key === key)
  return field?.label || key
}

const getSampleValue = (key) => {
  const samples = {
    campaign_name: 'Black Friday 2024',
    adset_name: 'Audiencia Premium',
    cost: '$15,234.50',
    impressions: '125,450',
    clicks: '3,567',
    ctr: '2.84%',
    conversions: '145',
    roas: '4.5x',
    status: 'Activo'
  }
  return samples[key] || '—'
}

// Watch for prop changes
watch(() => props.initialFields, (newFields) => {
  if (newFields.length) {
    selectedFields.value = [...newFields]
  }
})

watch(() => props.initialStyle, (newStyle) => {
  selectedStyle.value = newStyle
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s;
}

.modal-card {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e8eaed;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #202124;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #5f6368;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f1f3f4;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.platform-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  margin-bottom: 20px;
}

.platform-facebook {
  background: #e7f3ff;
  color: #1877F2;
}

.platform-google {
  background: #e8f0fe;
  color: #4285f4;
}

.platform-tiktok {
  background: #ffe5ec;
  color: #FF0050;
}

.platform-label {
  opacity: 0.7;
}

.platform-name {
  font-weight: 600;
}

.style-section {
  margin-bottom: 24px;
}

.style-section h3 {
  font-size: 16px;
  color: #202124;
  margin: 0 0 12px 0;
}

.style-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.style-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 2px solid #e8eaed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.style-option.active {
  border-color: #4285f4;
  background: #e8f0fe;
}

.style-option input {
  display: none;
}

.style-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.style-name {
  font-weight: 600;
  font-size: 14px;
  color: #202124;
}

.style-desc {
  font-size: 11px;
  color: #5f6368;
  text-align: center;
}

.fields-section {
  margin-bottom: 24px;
}

.fields-section h3 {
  font-size: 16px;
  color: #202124;
  margin: 0 0 12px 0;
}

.quick-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.quick-btn {
  padding: 6px 12px;
  background: white;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 13px;
  color: #5f6368;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: #f1f3f4;
  border-color: #5f6368;
}

.template-selector {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-selector label {
  font-size: 13px;
  color: #5f6368;
}

.template-selector select {
  padding: 4px 8px;
  border: 1px solid #dadce0;
  border-radius: 4px;
  font-size: 13px;
}

.fields-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e8eaed;
  border-radius: 8px;
  padding: 16px;
}

.field-group {
  margin-bottom: 20px;
}

.field-group h4 {
  font-size: 13px;
  color: #5f6368;
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.field-item {
  display: flex;
  align-items: center;
  padding: 8px;
  background: white;
  border: 1px solid #e8eaed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.field-item:hover {
  background: #f8f9fa;
}

.field-item.selected {
  background: #e8f0fe;
  border-color: #4285f4;
}

.field-item input {
  margin-right: 8px;
}

.field-label {
  flex: 1;
  font-size: 13px;
  color: #202124;
}

.field-key {
  font-size: 11px;
  color: #5f6368;
  font-family: monospace;
}

.field-format {
  font-size: 11px;
  margin-left: 4px;
}

.field-count {
  margin-top: 12px;
  font-size: 13px;
  color: #5f6368;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-count .warning {
  color: #ea8600;
  font-size: 12px;
}

.preview-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e8eaed;
}

.preview-section h3 {
  font-size: 14px;
  color: #5f6368;
  margin: 0 0 12px 0;
}

.preview-table {
  overflow-x: auto;
  border: 1px solid #e8eaed;
  border-radius: 6px;
}

.preview-table table {
  width: 100%;
  font-size: 12px;
  border-collapse: collapse;
}

.preview-table th {
  background: #f8f9fa;
  padding: 8px;
  text-align: left;
  font-weight: 600;
  color: #5f6368;
  border-bottom: 1px solid #e8eaed;
}

.preview-table td {
  padding: 8px;
  color: #202124;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e8eaed;
}

.btn-cancel, .btn-apply {
  padding: 8px 24px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: white;
  color: #5f6368;
  border: 1px solid #dadce0;
}

.btn-cancel:hover {
  background: #f1f3f4;
}

.btn-apply {
  background: #4285f4;
  color: white;
  border: none;
}

.btn-apply:hover {
  background: #1a73e8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-card {
    width: 95%;
    max-height: 95vh;
  }
  
  .style-options {
    grid-template-columns: 1fr;
  }
  
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>