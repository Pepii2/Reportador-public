<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { wizardStore } from '@/stores/wizardStore'

const campaigns = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const showUnifiedToggle = computed(() => wizardStore.reportType === 'simple')

const selectedCampaigns = ref([...wizardStore.selectedCampaigns])
const unifiedReports = ref(wizardStore.unifiedReports)

// Function declarations (hoisted)
const loadCampaigns = async () => {
  if (wizardStore.selectedAdAccounts.length === 0) {
    campaigns.value = []
    return
  }

  loading.value = true
  error.value = null
  
  try {
    console.log('🔍 Loading campaigns for selected accounts...')
    const accountIds = wizardStore.selectedAdAccounts.map(acc => acc.id)
    
    const options = {
      team: wizardStore.selectedTeam
    }
    
    await wizardStore.loadCampaigns(accountIds, options)
    campaigns.value = wizardStore.availableCampaigns
    
    console.log(`✅ Loaded ${campaigns.value.length} campaigns`)
  } catch (err) {
    console.error('❌ Failed to load campaigns:', err)
    error.value = 'Error al cargar las campañas. Por favor, intenta de nuevo.'
  } finally {
    loading.value = false
  }
}

// Computed properties
const filteredCampaigns = computed(() => {
  if (!searchQuery.value) return campaigns.value
  
  return campaigns.value.filter(campaign => 
    campaign.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    campaign.accountName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    campaign.id.includes(searchQuery.value)
  )
})

const activeCampaigns = computed(() => {
  return filteredCampaigns.value.filter(campaign => campaign.status === 'active')
})

const canSelectMore = computed(() => {
  if (wizardStore.reportType === 'compare-campaigns') {
    return selectedCampaigns.value.length < 2
  }
  return true
})

// Watch for changes in selected accounts
watch(() => wizardStore.selectedAdAccounts, (newAccounts) => {
  if (newAccounts.length > 0) {
    loadCampaigns()
  } else {
    campaigns.value = []
  }
}, { immediate: true })

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getStatusLabel = (status) => {
  const labels = {
    active: 'Activa',
    paused: 'Pausada',
    completed: 'Completada',
    unknown: 'Desconocida'
  }
  return labels[status] || 'Inactiva'
}

onMounted(() => {
  if (wizardStore.selectedAdAccounts.length > 0) {
    loadCampaigns()
  }
})

const toggleCampaign = async (campaign) => {
  const index = selectedCampaigns.value.findIndex(c => c.id === campaign.id)
  if (index > -1) {
    selectedCampaigns.value.splice(index, 1)
  } else {
    if (wizardStore.reportType === 'compare-campaigns' && selectedCampaigns.value.length >= 2) {
      return // Limit to 2 for comparison
    }
    selectedCampaigns.value.push(campaign)
  }
  
  await wizardStore.setSelectedCampaigns(selectedCampaigns.value, unifiedReports.value)
}

const toggleUnified = async (unified) => {
  unifiedReports.value = unified
  await wizardStore.setSelectedCampaigns(selectedCampaigns.value, unified)
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatNumber = (number) => {
  return new Intl.NumberFormat('es-ES').format(number)
}
</script>

<template>
  <div class="campaign-selection">
    <div class="step-header">
      <h2>Selecciona las Campañas</h2>
      <p v-if="wizardStore.reportType === 'simple'">
        Elige las campañas que quieres incluir en tu reporte
      </p>
      <p v-else-if="wizardStore.reportType === 'compare-campaigns'">
        Selecciona exactamente 2 campañas para comparar
      </p>
      <p v-else>
        Selecciona una campaña para analizar en diferentes períodos
      </p>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner">⏳</div>
      <p>Cargando campañas...</p>
    </div>

    <div v-else class="campaigns-content">
      <!-- Search and filters -->
      <div class="campaign-controls">
        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar campañas..."
            class="search-input"
          />
        </div>
      </div>

      <!-- Unified/Separate toggle for simple reports -->
      <div v-if="showUnifiedToggle && selectedCampaigns.length > 1" class="report-mode-toggle">
        <div class="toggle-group">
          <button
            @click="toggleUnified(true)"
            :class="['toggle-btn', { active: unifiedReports }]"
          >
            🔄 Reporte Unificado
          </button>
          <button
            @click="toggleUnified(false)"
            :class="['toggle-btn', { active: !unifiedReports }]"
          >
            📋 Reportes Separados
          </button>
        </div>
        <p class="toggle-description">
          <span v-if="unifiedReports">
            {{ selectedCampaigns.length }} campañas → 1 reporte consolidado
          </span>
          <span v-else>
            {{ selectedCampaigns.length }} campañas → {{ selectedCampaigns.length }} reportes separados
          </span>
        </p>
      </div>

      <!-- Empty State -->
      <div v-if="filteredCampaigns.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No se encontraron campañas</h3>
        <p v-if="wizardStore.selectedAdAccounts.length === 0">
          Primero selecciona cuentas publicitarias en el paso anterior
        </p>
        <p v-else-if="searchQuery">
          Intenta ajustar los filtros de búsqueda
        </p>
        <p v-else>
          No hay campañas disponibles para las cuentas seleccionadas
        </p>
      </div>

      <!-- Campaigns List -->
      <div v-else class="campaigns-list">
        <div class="campaigns-scroll-container">
          <div 
            v-for="campaign in filteredCampaigns"
            :key="campaign.id"
            class="campaign-item"
          :class="{ 
            'campaign-selected': selectedCampaigns.some(c => c.id === campaign.id),
            'campaign-disabled': !canSelectMore && !selectedCampaigns.some(c => c.id === campaign.id)
          }"
          @click="toggleCampaign(campaign)"
        >
          <div class="campaign-checkbox">
            <input 
              type="checkbox" 
              :checked="selectedCampaigns.some(c => c.id === campaign.id)"
              :disabled="!canSelectMore && !selectedCampaigns.some(c => c.id === campaign.id)"
              @click.stop
              @change="toggleCampaign(campaign)"
            />
          </div>

          <div class="campaign-info">
            <div class="campaign-name-section">
              <h3 class="campaign-name">{{ campaign.name }}</h3>
              <div class="campaign-id">ID: {{ campaign.id }}</div>
            </div>

            <div class="status-section">
              <span 
                class="status-badge"
                :class="{ 
                  'status-active': campaign.status === 'active',
                  'status-paused': campaign.status === 'paused',
                  'status-completed': campaign.status === 'completed'
                }"
              >
                {{ getStatusLabel(campaign.status) }}
              </span>
              <span class="last-data-date" v-if="campaign.endDate">
                Última actividad: {{ formatDate(campaign.endDate) }}
              </span>
            </div>

            <div class="campaign-stats-section">
              <div class="campaign-stats">
                <div class="stat-item">
                  <span class="stat-label">Cuenta:</span>
                  <span class="stat-value">{{ campaign.accountName }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- Selection Summary -->
      <div v-if="selectedCampaigns.length > 0" class="selection-summary">
        <div class="summary-card">
          <div class="summary-header">
            <h3>📊 Campañas Seleccionadas</h3>
            <div class="selection-count">
              {{ selectedCampaigns.length }} campaña{{ selectedCampaigns.length !== 1 ? 's' : '' }}
            </div>
          </div>
          <div class="summary-content">
            <div class="selected-campaigns-preview">
              <div class="campaign-chips">
                <div 
                  v-for="campaign in selectedCampaigns.slice(0, 3)" 
                  :key="campaign.id"
                  class="campaign-chip"
                >
                  <span class="chip-name">{{ campaign.name }}</span>
                </div>
                <div v-if="selectedCampaigns.length > 3" class="campaign-chip more-chip">
                  +{{ selectedCampaigns.length - 3 }} más
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.campaign-selection {
  max-width: 1500px;
  margin: 0 auto;
  padding: 2rem;
}

.step-header {
  text-align: center;
  margin-bottom: 2rem;
}

.step-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
}

.step-header p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.25rem 0 0 0;
  line-height: 1.3;
}

.loading-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.loading-spinner {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.campaigns-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 2rem;
}

.campaign-controls {
  margin-bottom: 0.75rem;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.search-input {
  width: 100%;
  max-width: 300px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.report-mode-toggle {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.toggle-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.toggle-btn {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.toggle-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.toggle-description {
  color: #64748b;
  font-size: 0.875rem;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.campaigns-list {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.campaigns-scroll-container {
  overflow-y: auto;
  padding: 0.75rem;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 0.75rem;
  align-content: start;
  max-height: 280px;
}

.campaign-item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  height: fit-content;
}

.campaign-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.campaign-selected {
  background-color: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.campaign-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.campaign-checkbox {
  margin-bottom: 0.5rem;
  text-align: center;
}

.campaign-checkbox input[type="checkbox"] {
  transform: scale(1.2);
}

.campaign-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.campaign-name-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.campaign-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
}

.campaign-id {
  font-size: 0.75rem;
  color: #64748b;
  font-family: 'Courier New', monospace;
}

.status-section {
  text-align: center;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  background-color: #fee2e2;
  color: #991b1b;
  display: inline-block;
}

.status-active {
  background-color: #dcfce7;
  color: #166534;
}

.status-paused {
  background-color: #fef3c7;
  color: #92400e;
}

.status-completed {
  background-color: #e5e7eb;
  color: #6b7280;
}

.last-data-date {
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: 0.5rem;
}

.campaign-stats-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
}


.campaign-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  white-space: nowrap;
}

.stat-label {
  color: #64748b;
}

.stat-value {
  color: #374151;
  font-weight: 500;
}

.selection-summary {
  margin-top: 0.75rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #7dd3fc;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  flex-shrink: 0;
}

.summary-card {
  /* Already defined above */
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.summary-header h3 {
  color: #0c4a6e;
  font-weight: 600;
  margin: 0;
}

.selection-count {
  background-color: #0369a1;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}

.campaign-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.campaign-chip {
  background-color: white;
  border: 1px solid #7dd3fc;
  color: #0369a1;
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}

.more-chip {
  background-color: #0369a1;
  color: white;
  border-color: #0369a1;
}

/* Responsive for campaigns */
@media (max-width: 1200px) {
  .campaigns-scroll-container {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .campaigns-scroll-container {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
    max-height: 500px;
  }
}
</style>