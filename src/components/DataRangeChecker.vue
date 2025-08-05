<script setup>
import { ref, onMounted } from 'vue'

const dataInfo = ref(null)
const loading = ref(false)
const error = ref(null)

const checkDataRange = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('/.netlify/functions/check-data-range')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result = await response.json()
    dataInfo.value = result.data
    console.log('BigQuery data range:', result.data)
  } catch (err) {
    error.value = err.message
    console.error('Failed to check data range:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  checkDataRange()
})
</script>

<template>
  <div class="data-range-checker">
    <h3>📊 BigQuery Data Range Check</h3>
    
    <div v-if="loading" class="loading">
      ⏳ Checking BigQuery data...
    </div>
    
    <div v-else-if="error" class="error">
      ❌ Error: {{ error }}
    </div>
    
    <div v-else-if="dataInfo" class="data-info">
      <div class="info-section">
        <h4>Data Range Summary</h4>
        <p><strong>Earliest Date:</strong> {{ dataInfo.dataRange.earliest_date || 'N/A' }}</p>
        <p><strong>Latest Date:</strong> {{ dataInfo.dataRange.latest_date || 'N/A' }}</p>
        <p><strong>Total Days:</strong> {{ dataInfo.dataRange.unique_dates || 0 }}</p>
        <p><strong>Total Campaigns:</strong> {{ dataInfo.dataRange.unique_campaigns || 0 }}</p>
        <p><strong>Total Rows:</strong> {{ dataInfo.dataRange.total_rows || 0 }}</p>
        <p><strong>Platforms:</strong> {{ dataInfo.dataRange.platforms?.join(', ') || 'N/A' }}</p>
      </div>
      
      <div v-if="dataInfo.monthlyDistribution?.length > 0" class="info-section">
        <h4>Monthly Distribution</h4>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Days</th>
              <th>Campaigns</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="month in dataInfo.monthlyDistribution" :key="month.month">
              <td>{{ month.month }}</td>
              <td>{{ month.days_with_data }}</td>
              <td>{{ month.campaigns }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="dataInfo.recentDates?.length > 0" class="info-section">
        <h4>Recent Dates ({{ dataInfo.recentDates.length }} shown)</h4>
        <div class="date-list">
          <span v-for="date in dataInfo.recentDates.slice(0, 10)" :key="date" class="date-item">
            {{ date }}
          </span>
        </div>
      </div>
    </div>
    
    <button @click="checkDataRange" class="refresh-btn">
      🔄 Refresh
    </button>
  </div>
</template>

<style scoped>
.data-range-checker {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin: 1rem 0;
}

h3 {
  margin-top: 0;
  color: #1e293b;
}

.loading, .error {
  padding: 1rem;
  text-align: center;
}

.error {
  color: #dc2626;
  background: #fef2f2;
  border-radius: 0.5rem;
}

.info-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 0.5rem;
}

.info-section h4 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #374151;
}

.info-section p {
  margin: 0.5rem 0;
  color: #64748b;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

th, td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

th {
  background: #f3f4f6;
  font-weight: 600;
}

.date-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.date-item {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-family: monospace;
}

.refresh-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.refresh-btn:hover {
  background: #2563eb;
}
</style>