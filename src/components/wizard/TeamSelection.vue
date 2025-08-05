<template>
  <div class="team-selection">
    <h2>Seleccionar Equipo</h2>
    <p class="subtitle">Elige tu equipo para filtrar todos los datos del reporte</p>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando equipos disponibles...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadTeams" class="retry-button">Reintentar</button>
    </div>

    <!-- Teams grid -->
    <div v-else class="teams-grid">
      <div
        v-for="team in teams"
        :key="team.id"
        class="team-card"
        :class="{ selected: selectedTeam?.id === team.id }"
        @click="selectTeam(team)"
      >
        <h3>{{ team.name }}</h3>
        <div class="team-stats">
          <div class="stat">
            <span class="stat-value">{{ team.accountCount }}</span>
            <span class="stat-label">Cuentas</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ team.campaignCount }}</span>
            <span class="stat-label">Campañas</span>
          </div>
        </div>
        
        <!-- Account Names -->
        <div v-if="team.accountNames && team.accountNames.length > 0" class="account-names">
          <h4>Cuentas:</h4>
          <div class="account-list">
            <span 
              v-for="(accountName, index) in team.accountNames.slice(0, 3)" 
              :key="index"
              class="account-tag"
            >
              {{ accountName }}
            </span>
            <span v-if="team.accountNames.length > 3" class="more-accounts">
              +{{ team.accountNames.length - 3 }} más
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { wizardStore } from '@/stores/wizardStore'
import apiService from '@/services/apiService'

const router = useRouter()
const teams = ref([])
const selectedTeam = ref(null)
const isLoading = ref(false)
const error = ref(null)

const loadTeams = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    console.log('🔍 Loading teams...')
    const response = await apiService.getTeams()
    
    if (response.success) {
      teams.value = response.data
      console.log(`✅ Loaded ${teams.value.length} teams`)
      
      // If there's a previously selected team, restore it
      const savedTeam = wizardStore.config.team
      if (savedTeam) {
        selectedTeam.value = teams.value.find(t => t.id === savedTeam)
      }
    } else {
      throw new Error(response.message || 'Failed to load teams')
    }
  } catch (err) {
    console.error('❌ Failed to load teams:', err)
    error.value = err.message || 'Error al cargar los equipos'
  } finally {
    isLoading.value = false
  }
}

const selectTeam = (team) => {
  selectedTeam.value = team
  wizardStore.setTeam(team.id)
  // Small delay for visual feedback before advancing
  setTimeout(() => {
    router.push({ name: 'PlatformSelection' })
  }, 200)
}


onMounted(() => {
  loadTeams()
})
</script>

<style scoped>
.team-selection {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  height: calc(100vh - 200px);
  overflow-y: auto;
}

h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.subtitle {
  color: #666;
  margin-bottom: 2rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 2rem;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.error-message {
  color: #dc2626;
  margin-bottom: 1rem;
}

.retry-button {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #b91c1c;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.team-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.team-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.team-card.selected {
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.team-card h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.team-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #3b82f6;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.account-names {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.account-names h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.account-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.account-tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  color: #374151;
  font-size: 0.75rem;
  border-radius: 4px;
  font-weight: 500;
}

.team-card.selected .account-tag {
  background: #dbeafe;
  color: #1e40af;
}

.more-accounts {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 0.75rem;
  border-radius: 4px;
  font-weight: 500;
  font-style: italic;
}

.team-card.selected .more-accounts {
  background: #bfdbfe;
  color: #1e40af;
}

/* Responsive */
@media (max-width: 1200px) {
  .teams-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .teams-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .teams-grid {
    grid-template-columns: 1fr;
  }
}
</style>