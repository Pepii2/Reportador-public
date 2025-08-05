<template>
  <div class="bigquery-inspector">
    <h2>BigQuery Data Inspector</h2>
    
    <!-- Controls -->
    <div class="controls">
      <div class="control-group">
        <label for="team">Team</label>
        <select id="team" v-model="selectedTeam" @change="fetchData">
          <option value="">All Teams</option>
          <option value="TimBeta">TimBeta</option>
          <option value="Assist Team">Assist Team</option>
          <option value="DARTs">DARTs</option>
          <option value="DespeTeam">DespeTeam</option>
          <option value="FinTeam">FinTeam</option>
        </select>
      </div>
      
      <div class="control-group">
        <label for="platform">Platform</label>
        <select id="platform" v-model="selectedPlatform" @change="fetchData">
          <option value="">All Platforms</option>
          <option value="facebook">Facebook</option>
          <option value="google">Google Ads</option>
          <option value="tiktok">TikTok</option>
        </select>
      </div>
      
      <div class="control-group">
        <label for="limit">Limit</label>
        <input 
          id="limit" 
          type="number" 
          v-model.number="limit" 
          min="10" 
          max="1000" 
          step="10"
          @change="fetchData"
        >
      </div>
      
      <button @click="fetchData" class="fetch-button" :disabled="loading">
        {{ loading ? 'Loading...' : 'Fetch Data' }}
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Fetching data from BigQuery...</p>
    </div>

    <!-- Data Display -->
    <div v-else-if="data && data.length > 0" class="data-container">
      <div class="data-summary">
        <p><strong>Total Rows:</strong> {{ data.length }}</p>
        <p><strong>Date Range:</strong> {{ dateRange }}</p>
      </div>
      
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Team</th>
              <th>Campaign Name</th>
              <th>Campaign ID</th>
              <th class="numeric">Cost</th>
              <th class="numeric">Clicks</th>
              <th class="numeric">Impressions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in data" :key="index">
              <td>{{ formatDate(row.date.value) }}</td>
              <td>{{ row.team }}</td>
              <td class="campaign-name">{{ row.campaign_name }}</td>
              <td class="campaign-id">{{ row.campaign_id }}</td>
              <td class="numeric">{{ formatCurrency(row.cost) }}</td>
              <td class="numeric">{{ formatNumber(row.clicks) }}</td>
              <td class="numeric">{{ formatNumber(row.impressions) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- No Data State -->
    <div v-else-if="!loading && fetchAttempted" class="no-data">
      <p>No data found for the selected filters.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiService from '@/services/apiService'

// State
const selectedTeam = ref('TimBeta')
const selectedPlatform = ref('')
const limit = ref(100)
const loading = ref(false)
const error = ref('')
const data = ref([])
const fetchAttempted = ref(false)

// Methods
const fetchData = async () => {
  loading.value = true
  error.value = ''
  fetchAttempted.value = true
  
  try {
    // Create config for the API call
    const config = {
      team: selectedTeam.value || undefined,
      platform: selectedPlatform.value || undefined,
      limit: limit.value,
      dateRange: {
        start: '2025-07-01',
        end: '2025-08-01'
      },
      accountIds: [],
      campaignIds: [],
      metrics: ['cost', 'clicks', 'impressions'],
      raw: true
    }
    
    console.log('🔍 Fetching BigQuery data with config:', config)
    
    const response = await apiService.generateReport(config)
    
    console.log('📊 API Response:', response)
    
    if (response.success && response.data) {
      // Handle the nested data structure
      if (response.data.data && Array.isArray(response.data.data)) {
        data.value = response.data.data
      } else if (Array.isArray(response.data)) {
        data.value = response.data
      } else {
        console.warn('Unexpected response structure:', response)
        error.value = 'Unexpected response format'
      }
    } else {
      error.value = response.message || 'Failed to fetch data'
    }
  } catch (err) {
    console.error('❌ Error fetching data:', err)
    error.value = `Error: ${err.message}`
  } finally {
    loading.value = false
  }
}

// Computed
const dateRange = computed(() => {
  if (!data.value.length) return 'N/A'
  const dates = data.value.map(row => new Date(row.date.value))
  const minDate = new Date(Math.min(...dates))
  const maxDate = new Date(Math.max(...dates))
  return `${formatDate(minDate.toISOString().split('T')[0])} - ${formatDate(maxDate.toISOString().split('T')[0])}`
})

// Formatters
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('es-ES').format(value)
}

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.bigquery-inspector {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h2 {
  color: #333;
  margin-bottom: 20px;
}

/* Controls */
.controls {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.control-group label {
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

.control-group select,
.control-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}

.fetch-button {
  padding: 8px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}

.fetch-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.fetch-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Error and Loading States */
.error-message {
  background-color: #fee;
  border: 1px solid #fcc;
  color: #c00;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Data Display */
.data-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.data-summary {
  display: flex;
  gap: 30px;
  margin-bottom: 20px;
  font-size: 14px;
}

.data-summary p {
  margin: 0;
}

.table-wrapper {
  overflow-x: auto;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-table th {
  background-color: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #dee2e6;
  position: sticky;
  top: 0;
}

.data-table th.numeric,
.data-table td.numeric {
  text-align: right;
}

.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #dee2e6;
}

.data-table tbody tr:hover {
  background-color: #f8f9fa;
}

.campaign-name,
.campaign-id {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #666;
}

/* Responsive */
@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-group select,
  .control-group input {
    width: 100%;
  }
  
  .fetch-button {
    width: 100%;
  }
}
</style>