<template>
  <div class="pdf-report-container">
    <h1>Reporte de Campañas</h1>
    
    <!-- Style 1: Compact Table -->
    <section class="report-section">
      <h2>Resumen Ejecutivo</h2>
      <PDFReportTable
        :data="campaignData"
        :metrics="compactMetrics"
        table-style="compact"
        :show-totals="true"
        :platform="selectedPlatform"
      />
    </section>

    <!-- Style 2: Standard Table -->
    <section class="report-section">
      <h2>Análisis de Rendimiento</h2>
      <PDFReportTable
        :data="campaignData"
        :metrics="standardMetrics"
        table-style="standard"
        :show-totals="false"
        :platform="selectedPlatform"
      />
    </section>

    <!-- Style 3: Detailed Table -->
    <section class="report-section">
      <h2>Detalle Completo de Métricas</h2>
      <PDFReportTable
        :data="campaignData"
        :metrics="detailedMetrics"
        table-style="detailed"
        :show-totals="true"
        :headers="{ campaign: 'Nombre de Campaña', total: 'Totales' }"
        :platform="selectedPlatform"
      />
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PDFReportTable from './PDFReportTable.vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  selectedMetrics: { type: Array, default: () => [] },
  platform: { type: String, default: 'facebook' }
})

// Sample data (replace with actual data from your BigQuery integration)
const campaignData = computed(() => props.data.length ? props.data : [
  {
    campaign_name: 'Black Friday 2024',
    cost: 15000,
    clicks: 3500,
    impressions: 125000,
    ctr: 0.028,
    cpc: 4.29,
    cpm: 120,
    reach: 95000,
    frequency: 1.32,
    purchases: 45,
    revenue: 67500,
    roas: 4.5,
    conversions: 180,
    engagement_rate: 0.042
  },
  {
    campaign_name: 'Campaña Navideña',
    cost: 22000,
    clicks: 5200,
    impressions: 180000,
    ctr: 0.029,
    cpc: 4.23,
    cpm: 122.22,
    reach: 140000,
    frequency: 1.29,
    purchases: 78,
    revenue: 117000,
    roas: 5.32,
    conversions: 290,
    engagement_rate: 0.038
  },
  {
    campaign_name: 'Lanzamiento Producto X',
    cost: 8500,
    clicks: 1800,
    impressions: 75000,
    ctr: 0.024,
    cpc: 4.72,
    cpm: 113.33,
    reach: 60000,
    frequency: 1.25,
    purchases: 22,
    revenue: 33000,
    roas: 3.88,
    conversions: 95,
    engagement_rate: 0.035
  }
])

const selectedPlatform = computed(() => props.platform)

// Define different metric sets for each table style
const compactMetrics = computed(() => {
  if (props.selectedMetrics.length) {
    // Use first 4-5 metrics for compact view
    return props.selectedMetrics.slice(0, 5)
  }
  // Default compact metrics
  return ['cost', 'clicks', 'impressions', 'ctr', 'conversions']
})

const standardMetrics = computed(() => {
  if (props.selectedMetrics.length) {
    // Use first 7-8 metrics for standard view
    return props.selectedMetrics.slice(0, 8)
  }
  // Default standard metrics based on platform
  if (selectedPlatform.value === 'facebook') {
    return ['cost', 'reach', 'impressions', 'clicks', 'ctr', 'purchases', 'revenue', 'roas']
  } else if (selectedPlatform.value === 'google') {
    return ['cost', 'impressions', 'clicks', 'ctr', 'cpc', 'conversions', 'conversion_rate']
  } else {
    return ['cost', 'impressions', 'clicks', 'ctr', 'p_video_play', 'p_video_play_100']
  }
})

const detailedMetrics = computed(() => {
  if (props.selectedMetrics.length) {
    // Use all selected metrics for detailed view
    return props.selectedMetrics
  }
  // Default detailed metrics - comprehensive set
  return [
    'cost',
    'impressions',
    'reach',
    'frequency',
    'clicks',
    'ctr',
    'cpc',
    'cpm',
    'conversions',
    'purchases',
    'revenue',
    'roas',
    'engagement_rate'
  ]
})
</script>

<style scoped>
.pdf-report-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  background: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  color: #2c3e50;
  font-size: 28px;
  margin-bottom: 30px;
  text-align: center;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
}

.report-section {
  margin-bottom: 40px;
}

h2 {
  color: #34495e;
  font-size: 20px;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 4px solid #3498db;
}

/* PDF export styles */
@media print {
  .pdf-report-container {
    padding: 20px;
  }
  
  .report-section {
    page-break-inside: avoid;
    margin-bottom: 30px;
  }
  
  h1 {
    font-size: 24px;
    margin-bottom: 20px;
  }
  
  h2 {
    font-size: 18px;
    margin-bottom: 10px;
  }
}
</style>