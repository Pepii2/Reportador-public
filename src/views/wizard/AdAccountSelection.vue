<script setup>
import { ref, computed, onMounted } from 'vue'
import { wizardStore } from '@/stores/wizardStore'

const searchQuery = ref('')
const selectedAccounts = ref([...wizardStore.selectedAdAccounts])
const selectAll = ref(false)
const loading = ref(false)
const error = ref(null)

const filteredAccounts = computed(() => {
  if (!searchQuery.value) return wizardStore.availableAdAccounts
  
  return wizardStore.availableAdAccounts.filter(account => 
    account.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    account.id.includes(searchQuery.value)
  )
})

const activeAccounts = computed(() => {
  // All accounts with campaigns are considered "active" for selection purposes
  return filteredAccounts.value.filter(account => account.activeCampaigns > 0)
})

const isAccountSelected = (accountId) => {
  return selectedAccounts.value.some(acc => acc.id === accountId)
}

const toggleAccount = (account) => {
  const index = selectedAccounts.value.findIndex(acc => acc.id === account.id)
  
  if (index > -1) {
    selectedAccounts.value.splice(index, 1)
  } else {
    selectedAccounts.value.push(account)
  }
  
  updateSelectAll()
  wizardStore.setSelectedAdAccounts(selectedAccounts.value)
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedAccounts.value = []
  } else {
    selectedAccounts.value = [...activeAccounts.value]
  }
  
  selectAll.value = !selectAll.value
  wizardStore.setSelectedAdAccounts(selectedAccounts.value)
}

const selectAllActive = () => {
  selectedAccounts.value = [...activeAccounts.value]
  updateSelectAll()
  wizardStore.setSelectedAdAccounts(selectedAccounts.value)
}

const updateSelectAll = () => {
  selectAll.value = activeAccounts.value.length > 0 && 
    activeAccounts.value.every(account => isAccountSelected(account.id))
}


const formatCurrency = (amount) => {
  // Handle null, undefined, or NaN values
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00'
  }
  
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (date) => {
  if (!date) return 'Sin datos'
  
  try {
    // Handle BigQuery date objects that might have a .value property
    const dateValue = date?.value || date
    const dateObj = new Date(dateValue)
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Sin datos'
    }
    
    return dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (error) {
    console.error('Error formatting date:', date, error)
    return 'Sin datos'
  }
}

onMounted(async () => {
  // Check if platform is selected before loading accounts
  if (!wizardStore.selectedPlatform) {
    error.value = 'Por favor selecciona una plataforma primero.'
    console.error('No platform selected on mount')
    return
  }
  await loadAdAccounts()
})

const loadAdAccounts = async () => {
  try {
    loading.value = true
    error.value = null
    
    const platform = wizardStore.selectedPlatform?.id
    if (!platform) {
      console.error('No platform selected')
      error.value = 'Por favor selecciona una plataforma primero.'
      return
    }
    
    console.log('Loading ad accounts for platform:', platform)
    await wizardStore.loadAdAccounts(platform)
    
    updateSelectAll()
  } catch (err) {
    console.error('Failed to load ad accounts:', err)
    error.value = 'Error al cargar las cuentas publicitarias. Por favor intenta de nuevo.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="ad-account-selection">
    <div class="step-header">
      <h2>Selecciona las Ad Accounts</h2>
      <p>Elige las cuentas publicitarias desde las cuales quieres obtener datos para tu reporte</p>
    </div>

    <div class="account-controls">
      <div class="search-box">
        <div class="search-input-container">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre o ID de cuenta..."
            class="search-input"
          />
        </div>
      </div>

      <div class="bulk-actions">
        <button 
          @click="selectAllActive" 
          class="btn btn-outline"
          :disabled="activeAccounts.length === 0"
        >
          ✓ Seleccionar todas las activas
        </button>
        <button 
          @click="toggleSelectAll" 
          class="btn btn-secondary"
          :disabled="filteredAccounts.length === 0"
        >
          {{ selectAll ? '✗ Deseleccionar todas' : '✓ Seleccionar todas' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner">⏳</div>
      <p>Cargando cuentas publicitarias...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <h3>Error al cargar cuentas</h3>
      <p>{{ error }}</p>
      <button @click="loadAdAccounts" class="btn btn-primary">
        🔄 Reintentar
      </button>
    </div>

    <div v-else-if="filteredAccounts.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>No se encontraron cuentas</h3>
      <p>Intenta ajustar los filtros de búsqueda</p>
    </div>

    <div v-else class="accounts-list">
      <div class="accounts-scroll-container">
        <div 
          v-for="account in filteredAccounts"
          :key="account.id"
          class="account-item"
          :class="{ 'account-selected': isAccountSelected(account.id) }"
          @click="toggleAccount(account)"
        >
        <div class="account-checkbox">
          <input 
            type="checkbox" 
            :checked="isAccountSelected(account.id)"
            @click.stop
            @change="toggleAccount(account)"
          />
        </div>

        <div class="account-info">
          <div class="account-name-section">
            <h3 class="account-name">{{ account.name }}</h3>
            <div class="account-id">ID: {{ account.id }}</div>
          </div>

          <!-- Team is already selected in previous step -->

          <div class="account-stats-section">
            <div class="account-stats">
              <div class="stat-item">
                <span class="stat-label">Campañas:</span>
                <span class="stat-value">{{ account.activeCampaigns }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Gasto:</span>
                <span class="stat-value">{{ formatCurrency(account.totalSpend) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Actividad:</span>
                <span class="stat-value">{{ formatDate(account.lastActive) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <div v-if="selectedAccounts.length > 0" class="selection-summary">
      <div class="summary-card">
        <div class="summary-header">
          <h3>📊 Resumen de Selección</h3>
          <div class="selection-count">
            {{ selectedAccounts.length }} cuenta{{ selectedAccounts.length !== 1 ? 's' : '' }} seleccionada{{ selectedAccounts.length !== 1 ? 's' : '' }}
          </div>
        </div>
        <div class="summary-content">
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="stat-label">Total de campañas:</span>
              <span class="stat-value">{{ selectedAccounts.reduce((sum, acc) => sum + (acc.activeCampaigns || 0), 0) }}</span>
            </div>
            <div class="summary-stat">
              <span class="stat-label">Gasto mensual combinado:</span>
              <span class="stat-value">{{ formatCurrency(selectedAccounts.reduce((sum, acc) => sum + (acc.totalSpend || 0), 0)) }}</span>
            </div>
          </div>
          
          <div class="selected-accounts-preview">
            <h4>Cuentas seleccionadas:</h4>
            <div class="account-chips">
              <div 
                v-for="account in selectedAccounts.slice(0, 5)" 
                :key="account.id"
                class="account-chip"
              >
                <span class="chip-name">{{ account.name }}</span>
              </div>
              <div v-if="selectedAccounts.length > 5" class="account-chip more-chip">
                +{{ selectedAccounts.length - 5 }} más
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ad-account-selection {
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
  margin-bottom: 0.25rem;
}

.step-header p {
  font-size: 1rem;
  color: #64748b;
}

.account-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.search-box {
  flex: 1;
  min-width: 300px;
}

.search-input-container {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.bulk-actions {
  display: flex;
  gap: 0.5rem;
}

.loading-state, .empty-state, .error-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.loading-spinner, .empty-icon, .error-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.error-state {
  color: #dc2626;
}

.error-state h3 {
  color: #dc2626;
  margin-bottom: 1rem;
}

.error-state button {
  margin-top: 1rem;
}

.accounts-list {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  margin-bottom: 2rem;
}

.accounts-scroll-container {
  overflow-y: auto;
  padding: 0.75rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 0.75rem;
  align-content: start;
  max-height: 300px;
}

.account-item {
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

.account-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.account-selected {
  background-color: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.account-checkbox {
  margin-bottom: 0.5rem;
  text-align: center;
}

.account-checkbox input[type="checkbox"] {
  transform: scale(1.2);
}

.account-info {
  flex: 1;
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.account-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.account-badges {
  display: flex;
  gap: 0.5rem;
}


.team-badge {
  background-color: #e0e7ff;
  color: #3730a3;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.account-details {
  color: #64748b;
  font-size: 0.875rem;
}

.account-id {
  margin-bottom: 0.5rem;
  font-family: 'Courier New', monospace;
}

.account-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  gap: 0.25rem;
}

.stat-label {
  color: #64748b;
}

.stat-value {
  color: #374151;
  font-weight: 500;
}

.selection-summary {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #7dd3fc;
  border-radius: 1rem;
  padding: 1rem;
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

.summary-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.summary-stat {
  display: flex;
  gap: 0.5rem;
  color: #075985;
}

.selected-accounts-preview h4 {
  color: #0c4a6e;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.account-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.account-chip {
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

/* Responsive */
@media (max-width: 1400px) {
  .accounts-scroll-container {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
}

@media (max-width: 1000px) {
  .accounts-scroll-container {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .accounts-scroll-container {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
    max-height: 500px;
  }
  
  .account-controls {
    flex-direction: column;
  }
  
  .search-box {
    min-width: auto;
  }
  
  .bulk-actions {
    justify-content: stretch;
  }
  
  .bulk-actions .btn {
    flex: 1;
  }
  
  .account-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .account-stats {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .summary-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .summary-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>