<script setup>
import { ref, computed, onMounted } from 'vue'
import { wizardStore } from '@/stores/wizardStore'
import reportService from '@/services/reportService'
import DataRangeChecker from '@/components/DataRangeChecker.vue'

const showDebugInfo = ref(false)

const dateRange = ref({
  startDate: wizardStore.dateRange.startDate || '',
  endDate: wizardStore.dateRange.endDate || ''
})

// Campaign-specific date management
const showAdvancedDates = ref(false)
const campaignSpecificDates = ref({})
const dateValidationError = ref(null)
const showDateCalendar = ref(false)
const calendarMonth = ref(new Date())
const selectedPresetRange = ref(null)

// Report Customization
const reportCustomization = ref({
  title: 'Reporte de Marketing Digital',
  subtitle: 'Análisis de Campañas Publicitarias',
  clientName: '',
  logo: null,
  logoPreview: null,
  accentColor: '#3b82f6',
  selectedCardMetrics: [],
  chartType: 'line',
  chartMetrics: []
})

const selectedMetrics = ref([...wizardStore.selectedMetrics])
const availableMetrics = computed(() => wizardStore.getAvailableMetrics())

// Loading and generation states
const isLoadingMetrics = ref(false)
const isGeneratingPreview = ref(false)
const isGeneratingReport = ref(false)
const isExporting = ref(false)
const previewData = ref(null)
const generationError = ref(null)
const showPreviewModal = ref(false)

const toggleMetric = (metric) => {
  const index = selectedMetrics.value.findIndex(m => m.id === metric.id)
  if (index > -1) {
    selectedMetrics.value.splice(index, 1)
  } else {
    selectedMetrics.value.push(metric)
  }
  wizardStore.setSelectedMetrics(selectedMetrics.value)
  
  // Auto-select metrics for visual configuration if not already selected
  if (!reportCustomization.value.selectedCardMetrics.includes(metric.id) && 
      reportCustomization.value.selectedCardMetrics.length < 6) {
    reportCustomization.value.selectedCardMetrics.push(metric.id)
  }
}

const isMetricSelected = (metricId) => {
  return selectedMetrics.value.some(m => m.id === metricId)
}

const updateDateRange = () => {
  // Validate the date range
  if (dateRange.value.startDate && dateRange.value.endDate) {
    const validation = wizardStore.validateDateRange(dateRange.value.startDate, dateRange.value.endDate)
    if (!validation.valid) {
      dateValidationError.value = validation.message
      return
    }
    dateValidationError.value = null
  }
  
  wizardStore.setDateRange(dateRange.value.startDate, dateRange.value.endDate)
}

const toggleAdvancedDates = () => {
  showAdvancedDates.value = !showAdvancedDates.value
  
  if (showAdvancedDates.value) {
    // Initialize campaign-specific dates
    wizardStore.selectedCampaigns.forEach(campaign => {
      if (!campaignSpecificDates.value[campaign.id]) {
        const campaignDates = wizardStore.campaignActiveDates[campaign.id]
        campaignSpecificDates.value[campaign.id] = {
          startDate: campaignDates?.startDate || dateRange.value.startDate,
          endDate: campaignDates?.endDate || dateRange.value.endDate,
          enabled: true
        }
      }
    })
  }
}

const updateCampaignDate = (campaignId, field, value) => {
  if (!campaignSpecificDates.value[campaignId]) {
    campaignSpecificDates.value[campaignId] = {}
  }
  campaignSpecificDates.value[campaignId][field] = value
  
  // Validate campaign-specific date
  const campaignDates = campaignSpecificDates.value[campaignId]
  if (campaignDates.startDate && campaignDates.endDate) {
    const validation = wizardStore.validateDateRange(campaignDates.startDate, campaignDates.endDate)
    campaignDates.validationError = validation.valid ? null : validation.message
  }
}

const getAvailableDatesForCampaign = (campaignId) => {
  const campaignData = wizardStore.campaignActiveDates[campaignId]
  return campaignData?.activeDates || []
}

const getCampaignDateInfo = (campaignId) => {
  const campaignData = wizardStore.campaignActiveDates[campaignId]
  if (!campaignData) return null
  
  return {
    startDate: campaignData.startDate,
    endDate: campaignData.endDate,
    totalDays: campaignData.totalDays,
    hasData: campaignData.activeDates.length > 0
  }
}

const getMetricsByCategory = (category) => {
  return availableMetrics.value.filter(m => m.category === category)
}

const categories = computed(() => {
  const cats = ['universal']
  if (wizardStore.selectedPlatform && wizardStore.selectedPlatform.id) {
    cats.push(wizardStore.selectedPlatform.id.toLowerCase())
  }
  return cats
})

const getCategoryName = (category) => {
  const names = {
    universal: 'Métricas Universales',
    facebook: 'Métricas de Facebook',
    google: 'Métricas de Google',
    tiktok: 'Métricas de TikTok'
  }
  return names[category] || category
}

const setLastWeek = () => {
  selectedPresetRange.value = 'week'
  const availableDates = getAllAvailableDates().sort()
  if (availableDates.length === 0) {
    dateValidationError.value = 'No hay datos disponibles para las campañas seleccionadas'
    return
  }
  
  // Get the last 7 available days
  const endIndex = availableDates.length - 1
  const startIndex = Math.max(0, endIndex - 6)
  
  dateRange.value.startDate = availableDates[startIndex]
  dateRange.value.endDate = availableDates[endIndex]
  updateDateRange()
}

const setLastMonth = () => {
  selectedPresetRange.value = 'month'
  const availableDates = getAllAvailableDates().sort()
  if (availableDates.length === 0) {
    dateValidationError.value = 'No hay datos disponibles para las campañas seleccionadas'
    return
  }
  
  // Get dates from the last month with available data
  const endDate = availableDates[availableDates.length - 1]
  const endDateObj = new Date(endDate)
  const startDateObj = new Date(endDateObj)
  startDateObj.setMonth(startDateObj.getMonth() - 1)
  const startDateStr = startDateObj.toISOString().split('T')[0]
  
  // Find the first available date on or after the target start date
  const startIndex = availableDates.findIndex(date => date >= startDateStr)
  const actualStartDate = startIndex >= 0 ? availableDates[startIndex] : availableDates[0]
  
  dateRange.value.startDate = actualStartDate
  dateRange.value.endDate = endDate
  updateDateRange()
}

const setLast30Days = () => {
  selectedPresetRange.value = '30days'
  const availableDates = getAllAvailableDates().sort()
  if (availableDates.length === 0) {
    dateValidationError.value = 'No hay datos disponibles para las campañas seleccionadas'
    return
  }
  
  // Get the last 30 available days
  const endIndex = availableDates.length - 1
  const startIndex = Math.max(0, endIndex - 29)
  
  dateRange.value.startDate = availableDates[startIndex]
  dateRange.value.endDate = availableDates[endIndex]
  updateDateRange()
}

const setCurrentMonth = () => {
  selectedPresetRange.value = 'current'
  const availableDates = getAllAvailableDates().sort()
  if (availableDates.length === 0) {
    dateValidationError.value = 'No hay datos disponibles para las campañas seleccionadas'
    return
  }
  
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  
  // Filter available dates to current month
  const currentMonthDates = availableDates.filter(date => date >= currentMonthStart && date <= currentMonthEnd)
  
  if (currentMonthDates.length > 0) {
    dateRange.value.startDate = currentMonthDates[0]
    dateRange.value.endDate = currentMonthDates[currentMonthDates.length - 1]
    updateDateRange()
  } else {
    dateValidationError.value = 'No hay datos disponibles para el mes actual'
  }
}

const setPreviousMonth = () => {
  selectedPresetRange.value = 'previous'
  const availableDates = getAllAvailableDates().sort()
  if (availableDates.length === 0) {
    dateValidationError.value = 'No hay datos disponibles para las campañas seleccionadas'
    return
  }
  
  const now = new Date()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
  
  // Filter available dates to previous month
  const prevMonthDates = availableDates.filter(date => date >= prevMonthStart && date <= prevMonthEnd)
  
  if (prevMonthDates.length > 0) {
    dateRange.value.startDate = prevMonthDates[0]
    dateRange.value.endDate = prevMonthDates[prevMonthDates.length - 1]
    updateDateRange()
  } else {
    dateValidationError.value = 'No hay datos disponibles para el mes anterior'
  }
}

const setQuarter = () => {
  selectedPresetRange.value = 'quarter'
  const availableDates = getAllAvailableDates().sort()
  if (availableDates.length === 0) {
    dateValidationError.value = 'No hay datos disponibles para las campañas seleccionadas'
    return
  }
  
  // Get the last 90 available days (approximately a quarter)
  const endIndex = availableDates.length - 1
  const startIndex = Math.max(0, endIndex - 89)
  
  dateRange.value.startDate = availableDates[startIndex]
  dateRange.value.endDate = availableDates[endIndex]
  updateDateRange()
}

const confirmDateSelection = () => {
  updateDateRange()
  showDateCalendar.value = false
}

const selectDefaultMetrics = () => {
  const defaultMetricIds = ['cost', 'clicks', 'impressions', 'ctr', 'cpm']
  const metricsToSelect = availableMetrics.value.filter(m => defaultMetricIds.includes(m.id))
  
  if (metricsToSelect.length >= 3) {
    selectedMetrics.value = metricsToSelect.slice(0, 5) // Select up to 5 default metrics
    wizardStore.setSelectedMetrics(selectedMetrics.value)
    console.log('✅ Selected default metrics:', selectedMetrics.value.map(m => m.id))
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const calculateDays = () => {
  if (!dateRange.value.startDate || !dateRange.value.endDate) return 0
  const start = new Date(dateRange.value.startDate)
  const end = new Date(dateRange.value.endDate)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
}

const estimateRows = () => {
  const campaigns = wizardStore.selectedCampaigns.length || 1
  const days = calculateDays() || 1
  return campaigns * days
}

// Report generation functions
const generatePreview = async () => {
  if (!wizardStore.isReadyForPreview()) {
    generationError.value = 'Por favor completa la configuración antes de generar la vista previa'
    return
  }
  
  isGeneratingPreview.value = true
  generationError.value = null
  
  try {
    const response = await wizardStore.generateReportPreview()
    previewData.value = response.data
    showPreviewModal.value = true
    console.log('✅ Preview generated successfully')
  } catch (error) {
    console.error('❌ Preview generation failed:', error)
    generationError.value = error.message || 'Error al generar la vista previa'
  } finally {
    isGeneratingPreview.value = false
  }
}

const closePreviewModal = () => {
  showPreviewModal.value = false
}

// Fallback PDF generation when main generation fails
const createFallbackPDF = async (config, response) => {
  const jsPDF = (await import('jspdf')).default
  const doc = new jsPDF()
  
  let y = 20
  
  // Header
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('Reporte de Marketing Digital', 20, y)
  y += 15
  
  // Date range
  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.text(`Período: ${config.dateRange.start} - ${config.dateRange.end}`, 20, y)
  y += 10
  
  // Platform
  if (config.platform) {
    doc.text(`Plataforma: ${config.platform}`, 20, y)
    y += 10
  }
  
  // Selected campaigns
  if (config.campaignIds && config.campaignIds.length > 0) {
    doc.text(`Campañas seleccionadas: ${config.campaignIds.length}`, 20, y)
    y += 10
  }
  
  // Selected metrics
  if (config.metrics && config.metrics.length > 0) {
    doc.text(`Métricas: ${config.metrics.join(', ')}`, 20, y)
    y += 15
  }
  
  // Summary data if available
  if (response?.analytics?.summary) {
    const summary = response.analytics.summary
    doc.setFont(undefined, 'bold')
    doc.text('Resumen:', 20, y)
    y += 10
    doc.setFont(undefined, 'normal')
    
    if (summary.totalCost) doc.text(`Inversión Total: $${summary.totalCost}`, 20, y), y += 8
    if (summary.totalImpressions) doc.text(`Impresiones: ${parseInt(summary.totalImpressions).toLocaleString()}`, 20, y), y += 8
    if (summary.totalClicks) doc.text(`Clics: ${parseInt(summary.totalClicks).toLocaleString()}`, 20, y), y += 8
    if (summary.averageCTR) doc.text(`CTR Promedio: ${summary.averageCTR}%`, 20, y), y += 8
  }
  
  // Footer
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 20, 280)
  
  return doc
}

// Test function for simple PDF generation
const testPDFGeneration = async () => {
  try {
    console.log('🧪 Testing simple PDF generation...')
    
    // Create a simple PDF for testing
    const jsPDF = (await import('jspdf')).default
    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text('Test PDF Report', 20, 20)
    doc.text('This is a test to verify PDF generation works', 20, 40)
    doc.text(`Generated at: ${new Date().toLocaleString()}`, 20, 60)
    
    // Download test PDF
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    const filename = 'test_report.pdf'
    
    const downloadLink = document.createElement('a')
    downloadLink.href = pdfUrl
    downloadLink.download = filename
    downloadLink.style.display = 'none'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    
    console.log('✅ Test PDF generated successfully')
    alert('Test PDF generated! Check your downloads.')
    
  } catch (error) {
    console.error('❌ Test PDF generation failed:', error)
    alert(`Test PDF failed: ${error.message}`)
  }
}

const generatePDFReport = async () => {
  console.log('🚀 generatePDFReport function called!')
  console.log('Debug - Current wizard state:')
  console.log('- selectedTeam:', wizardStore.selectedTeam)
  console.log('- selectedPlatform:', wizardStore.selectedPlatform)
  console.log('- selectedAdAccounts:', wizardStore.selectedAdAccounts.length)
  console.log('- selectedCampaigns:', wizardStore.selectedCampaigns.length)
  console.log('- selectedMetrics:', wizardStore.selectedMetrics.length)
  console.log('- dateRange:', wizardStore.dateRange)
  console.log('- isReadyForPreview:', wizardStore.isReadyForPreview())
  console.log('- isReadyForGeneration:', wizardStore.isReadyForGeneration())
  
  if (!wizardStore.isReadyForGeneration()) {
    const message = wizardStore.getStepValidationMessage(6)
    console.log('❌ Not ready for generation:', message)
    generationError.value = message
    alert(`❌ No se puede generar el PDF: ${message}`)
    return
  }
  
  console.log('✅ Ready for generation, starting PDF process...')
  isGeneratingReport.value = true
  generationError.value = null
  
  try {
    console.log('📄 Starting PDF report generation...')
    
    // Generate the full report with analytics
    let response
    try {
      // Ensure we have selected metrics for the report
      if (selectedMetrics.value.length === 0) {
        throw new Error('Debes seleccionar al menos una métrica para el reporte')
      }
      
      response = await wizardStore.generateReport(reportCustomization.value)
      console.log('✅ Report data generated successfully')
      console.log('Response structure:', Object.keys(response))
      console.log('Response data length:', response.data?.length)
      
      // Validate we have data
      if (!response.data || response.data.length === 0) {
        throw new Error('No se encontraron datos para el período y métricas seleccionadas')
      }
    } catch (reportError) {
      console.error('❌ Report generation failed:', reportError)
      throw new Error(`Error generando datos del reporte: ${reportError.message}`)
    }
    
    // Use the imported reportService
    const config = {
      reportType: wizardStore.reportType,
      team: wizardStore.selectedTeam,
      platform: wizardStore.selectedPlatform?.id,
      accountIds: wizardStore.selectedAdAccounts.map(acc => acc.id),
      campaignIds: wizardStore.selectedCampaigns.map(camp => camp.id),
      metrics: wizardStore.selectedMetrics.map(metric => metric.id),
      dateRange: {
        start: wizardStore.dateRange.startDate,
        end: wizardStore.dateRange.endDate
      }
    }
    
    console.log('📄 Generating PDF document...')
    console.log('Config:', config)
    
    let pdfDoc
    try {
      pdfDoc = await reportService.generatePDFReport(response, config)
      console.log('✅ PDF document generated')
    } catch (pdfError) {
      console.error('❌ PDF generation failed:', pdfError)
      // Fallback: create a simple PDF with basic info
      console.log('📄 Creating fallback PDF with basic information...')
      pdfDoc = await createFallbackPDF(config, response)
    }
    
    // Create filename with current date
    const today = new Date().toISOString().split('T')[0]
    const filename = `reporte_marketing_${today}.pdf`
    console.log('📄 Creating download for:', filename)
    
    // Download the PDF
    const pdfBlob = pdfDoc.output('blob')
    console.log('📄 PDF blob created, size:', pdfBlob.size, 'bytes')
    
    const pdfUrl = URL.createObjectURL(pdfBlob)
    console.log('📄 PDF URL created:', pdfUrl)
    
    // Create download link and trigger download
    const downloadLink = document.createElement('a')
    downloadLink.href = pdfUrl
    downloadLink.download = filename
    downloadLink.style.display = 'none'
    document.body.appendChild(downloadLink)
    
    console.log('📄 Triggering download...')
    downloadLink.click()
    
    // Alternative download method if the first one doesn't work
    setTimeout(() => {
      if (document.body.contains(downloadLink)) {
        // Try opening in new window as fallback
        const newWindow = window.open(pdfUrl, '_blank')
        if (newWindow) {
          console.log('📄 Opened PDF in new window as fallback')
        } else {
          // Show manual download link
          alert(`Si la descarga no comenzó automáticamente, haz clic en este enlace: ${pdfUrl}`)
        }
      }
      document.body.removeChild(downloadLink)
    }, 100)
    
    // Clean up the URL object
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl)
      console.log('📄 PDF URL cleaned up')
    }, 1000)
    
    // Show success message with analytics
    const analytics = response.analytics?.summary
    let message = `✅ PDF generado y descargado exitosamente!\n\n`
    message += `📊 Datos: ${response.data?.length || 0} filas\n`
    message += `📄 Archivo: ${filename}\n`
    
    if (analytics) {
      message += `\n📈 Resumen del período:\n`
      message += `💰 Inversión Total: $${analytics.totalCost}\n`
      message += `👁️ Impresiones: ${parseInt(analytics.totalImpressions).toLocaleString()}\n`
      message += `🖱️ Clics: ${parseInt(analytics.totalClicks).toLocaleString()}\n`
      message += `🎯 CTR: ${analytics.averageCTR}%\n`
      message += `💵 ROAS: ${analytics.roas}x\n`
    }
    
    if (response.analytics?.recommendations?.length > 0) {
      message += `\n🔍 Se generaron ${response.analytics.recommendations.length} recomendaciones`
    }
    
    alert(message)
    console.log('✅ PDF report generation completed successfully')
  } catch (error) {
    console.error('❌ PDF report generation failed:', error)
    
    // Provide user-friendly error messages
    if (error.message.includes('404')) {
      generationError.value = 'La funcionalidad de generación de reportes no está disponible en el servidor'
    } else if (error.message.includes('Failed to fetch')) {
      generationError.value = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
    } else if (error.message.includes('datos del reporte')) {
      generationError.value = 'Error al obtener los datos. Verifica que hayas seleccionado campañas y métricas válidas.'
    } else {
      generationError.value = `Error al generar el PDF: ${error.message}`
    }
    
    alert(`❌ Error al generar PDF: ${generationError.value}`)
  } finally {
    isGeneratingReport.value = false
  }
}

const exportReport = async (format) => {
  if (!wizardStore.isReadyForGeneration()) {
    generationError.value = wizardStore.getStepValidationMessage(6)
    return
  }
  
  isExporting.value = true
  generationError.value = null
  
  try {
    const response = await wizardStore.exportReport(format, reportCustomization.value)
    console.log(`✅ Report exported as ${format.toUpperCase()}`)
    
    // Handle different response types
    if (response.downloadUrl) {
      // Direct download URL - create download link
      const a = document.createElement('a')
      a.href = response.downloadUrl
      a.download = response.filename || `reporte_${format}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(response.downloadUrl), 100)
      
      // Show success message
      alert(`✅ ${response.message || `Exportación ${format.toUpperCase()} completada`}`)
    } else if (response.response && response.response instanceof Response) {
      // File response - create blob and download
      const blob = await response.response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_${format}_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } else {
      // Fallback - show success message
      const message = response.message || `✅ Exportación ${format.toUpperCase()} completada exitosamente`
      alert(message)
    }
  } catch (error) {
    console.error(`❌ Export as ${format} failed:`, error)
    
    // Provide user-friendly error messages
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      generationError.value = `⚠️ La exportación ${format.toUpperCase()} no está disponible aún. Usa el botón "Generar Reporte" para ver los datos o intenta más tarde.`
    } else if (error.message.includes('Failed to fetch')) {
      generationError.value = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
    } else {
      generationError.value = error.message || `Error al exportar como ${format.toUpperCase()}`
    }
  } finally {
    isExporting.value = false
  }
}

const canGenerateReport = computed(() => {
  return wizardStore.isReadyForGeneration()
})

const canGeneratePreview = computed(() => {
  return wizardStore.isReadyForPreview()
})

const availableDateRange = computed(() => {
  const range = wizardStore.getAvailableDateRange()
  console.log('Available date range:', range)
  return range
})

const campaignDateSummary = computed(() => {
  if (Object.keys(wizardStore.campaignActiveDates).length === 0) return null
  
  const campaigns = wizardStore.selectedCampaigns.map(campaign => {
    const dateInfo = getCampaignDateInfo(campaign.id)
    return {
      name: campaign.name,
      id: campaign.id,
      ...dateInfo
    }
  })
  
  return campaigns
})

// Report Customization Functions
const handleLogoUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('El logo debe ser menor a 2MB')
      return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
      reportCustomization.value.logoPreview = e.target.result
      reportCustomization.value.logo = file
    }
    reader.readAsDataURL(file)
  }
}

const removeLogo = () => {
  reportCustomization.value.logo = null
  reportCustomization.value.logoPreview = null
}

const toggleCardMetric = (metricId) => {
  const index = reportCustomization.value.selectedCardMetrics.indexOf(metricId)
  if (index > -1) {
    reportCustomization.value.selectedCardMetrics.splice(index, 1)
  } else {
    if (reportCustomization.value.selectedCardMetrics.length < 6) {
      reportCustomization.value.selectedCardMetrics.push(metricId)
    } else {
      alert('Máximo 6 métricas en tarjetas')
    }
  }
}

const toggleChartMetric = (metricId) => {
  const index = reportCustomization.value.chartMetrics.indexOf(metricId)
  if (index > -1) {
    reportCustomization.value.chartMetrics.splice(index, 1)
  } else {
    if (reportCustomization.value.chartMetrics.length < 4) {
      reportCustomization.value.chartMetrics.push(metricId)
    } else {
      alert('Máximo 4 métricas en gráfico')
    }
  }
}

const predefinedColors = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Morado', value: '#8b5cf6' },
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Naranja', value: '#f59e0b' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Esmeralda', value: '#059669' },
  { name: 'Gris', value: '#6b7280' },
  { name: 'Negro', value: '#1f2937' }
]

const chartTypes = [
  { id: 'line', name: 'Líneas', icon: '📈' },
  { id: 'bar', name: 'Barras', icon: '📊' },
  { id: 'area', name: 'Área', icon: '📉' },
  { id: 'pie', name: 'Circular', icon: '🥧' }
]

const getMetricName = (metricId) => {
  const metric = availableMetrics.value.find(m => m.id === metricId)
  return metric ? metric.name : metricId
}

const isCardMetricSelected = (metricId) => {
  return reportCustomization.value.selectedCardMetrics.includes(metricId)
}

const isChartMetricSelected = (metricId) => {
  return reportCustomization.value.chartMetrics.includes(metricId)
}

// Calendar functions
const toggleDateCalendar = () => {
  showDateCalendar.value = !showDateCalendar.value
}

const navigateCalendar = (direction) => {
  const newMonth = new Date(calendarMonth.value)
  newMonth.setMonth(newMonth.getMonth() + direction)
  calendarMonth.value = newMonth
}

const generateCalendarDays = () => {
  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth()
  
  // Get first day of month and last day
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Get first day of week for the first day of month
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())
  
  // Generate 42 days (6 weeks) for calendar grid
  const days = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    
    const dateString = date.toISOString().split('T')[0]
    const isCurrentMonth = date.getMonth() === month
    const isToday = dateString === new Date().toISOString().split('T')[0]
    const hasData = isDateAvailable(dateString)
    const isSelected = isDateSelected(dateString)
    
    days.push({
      date: date,
      dateString: dateString,
      day: date.getDate(),
      isCurrentMonth: isCurrentMonth,
      isToday: isToday,
      hasData: hasData,
      isSelected: isSelected,
      isStartDate: dateString === dateRange.value.startDate,
      isEndDate: dateString === dateRange.value.endDate
    })
  }
  
  return days
}

const isDateAvailable = (dateString) => {
  // Check if any selected campaign has data for this date
  for (const campaign of wizardStore.selectedCampaigns) {
    const campaignDates = wizardStore.campaignActiveDates[campaign.id]
    if (campaignDates?.activeDates?.includes(dateString)) {
      return true
    }
  }
  return false
}

const isDateSelected = (dateString) => {
  if (!dateRange.value.startDate && !dateRange.value.endDate) return false
  
  const date = new Date(dateString)
  const start = dateRange.value.startDate ? new Date(dateRange.value.startDate) : null
  const end = dateRange.value.endDate ? new Date(dateRange.value.endDate) : null
  
  if (start && end) {
    return date >= start && date <= end
  } else if (start) {
    return dateString === dateRange.value.startDate
  }
  
  return false
}

const selectCalendarDate = (day) => {
  if (!day.hasData) {
    dateValidationError.value = `No hay datos disponibles para ${formatDate(day.dateString)}`
    return
  }
  
  dateValidationError.value = null
  
  // Logic for selecting date range
  if (!dateRange.value.startDate || (dateRange.value.startDate && dateRange.value.endDate)) {
    // Start new selection
    dateRange.value.startDate = day.dateString
    dateRange.value.endDate = null
  } else if (dateRange.value.startDate && !dateRange.value.endDate) {
    // Complete the range
    const startDate = new Date(dateRange.value.startDate)
    const selectedDate = new Date(day.dateString)
    
    if (selectedDate < startDate) {
      // Selected date is before start, swap them
      dateRange.value.endDate = dateRange.value.startDate
      dateRange.value.startDate = day.dateString
    } else {
      dateRange.value.endDate = day.dateString
    }
    
    // Close calendar after selecting both dates
    setTimeout(() => {
      showDateCalendar.value = false
    }, 300)
  }
  
  updateDateRange()
}

const getDateStatus = (day) => {
  if (!day.isCurrentMonth) return 'other-month'
  if (!day.hasData) return 'unavailable'
  if (day.isStartDate || day.isEndDate) return 'selected-endpoint'
  if (day.isSelected) return 'selected-range'
  if (day.hasData) return 'available'
  return 'default'
}

const getMonthName = (date) => {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

// Helper function to get all available dates across all selected campaigns
const getAllAvailableDates = () => {
  const allDates = new Set()
  
  for (const campaign of wizardStore.selectedCampaigns) {
    const campaignDates = wizardStore.campaignActiveDates[campaign.id]
    if (campaignDates?.activeDates) {
      campaignDates.activeDates.forEach(date => allDates.add(date))
    }
  }
  
  return Array.from(allDates).sort()
}

// Force refresh dates from BigQuery
const refreshDates = async () => {
  try {
    dateValidationError.value = null
    const campaignIds = wizardStore.selectedCampaigns.map(c => c.id)
    
    console.log('🔄 Force refreshing dates for campaigns:', campaignIds)
    
    // Force refresh the dates
    await wizardStore.loadCampaignActiveDates(campaignIds, true)
    
    // Update the date range based on newly loaded dates
    const availableDates = getAllAvailableDates()
    if (availableDates.length > 0) {
      // Set to last 30 available days
      const endDate = availableDates[availableDates.length - 1]
      const startIndex = Math.max(0, availableDates.length - 30)
      const startDate = availableDates[startIndex]
      
      dateRange.value.startDate = startDate
      dateRange.value.endDate = endDate
      updateDateRange()
      
      alert(`✅ Fechas actualizadas! Encontradas ${availableDates.length} fechas disponibles desde ${availableDates[0]} hasta ${availableDates[availableDates.length - 1]}`)
    } else {
      alert('⚠️ No se encontraron fechas disponibles para las campañas seleccionadas')
    }
  } catch (error) {
    console.error('Error refreshing dates:', error)
    dateValidationError.value = 'Error al actualizar fechas: ' + error.message
  }
}

onMounted(async () => {
  // Load metrics from API if we have selected accounts and they're not loaded yet
  const accountIds = wizardStore.selectedAdAccounts.map(acc => acc.id)
  if (accountIds.length > 0 && availableMetrics.value.length <= 10) {
    isLoadingMetrics.value = true
    try {
      await wizardStore.loadAvailableMetrics(accountIds)
    } catch (error) {
      console.error('Failed to load metrics from API:', error)
      generationError.value = 'No se pudieron cargar las métricas desde la API'
    } finally {
      isLoadingMetrics.value = false
    }
  }

  // Sync selected metrics from store
  if (wizardStore.selectedMetrics.length > 0) {
    selectedMetrics.value = [...wizardStore.selectedMetrics]
  } else {
    // Auto-select default metrics if none are selected
    const defaultMetricIds = ['cost', 'clicks', 'impressions', 'ctr', 'cpm']
    const defaultMetrics = availableMetrics.value.filter(m => defaultMetricIds.includes(m.id))
    if (defaultMetrics.length >= 3) {
      selectedMetrics.value = defaultMetrics
      wizardStore.setSelectedMetrics(defaultMetrics)
      console.log('Auto-selected default metrics:', defaultMetrics.map(m => m.id))
    }
  }
  
  // Set default date range based on available dates
  if (!dateRange.value.startDate || !dateRange.value.endDate) {
    const availableRange = wizardStore.getAvailableDateRange()
    if (availableRange.availableDates.length > 0) {
      // Get the last 30 available days or all available days if less than 30
      const availableDates = availableRange.availableDates.sort()
      const endDate = availableDates[availableDates.length - 1]
      const startIndex = Math.max(0, availableDates.length - 30)
      const startDate = availableDates[startIndex]
      
      dateRange.value.startDate = startDate
      dateRange.value.endDate = endDate
      updateDateRange()
      console.log('✅ Auto-set date range:', startDate, 'to', endDate)
    } else {
      // Fallback to last 30 days if no available dates
      setLast30Days()
    }
  }
  
  // Auto-select some metrics for visualization if none selected
  if (selectedMetrics.value.length > 0 && reportCustomization.value.selectedCardMetrics.length === 0) {
    // Auto-select up to 6 metrics for cards
    const metricsToShow = selectedMetrics.value.slice(0, 6)
    reportCustomization.value.selectedCardMetrics = metricsToShow.map(m => m.id)
    
    // Auto-select up to 4 metrics for chart
    const chartMetrics = selectedMetrics.value.slice(0, 4)
    reportCustomization.value.chartMetrics = chartMetrics.map(m => m.id)
  }
})

// Expose functions to parent component for footer buttons
defineExpose({
  generatePreview,
  generateReport: generatePDFReport,
  canGeneratePreview,
  canGenerateReport,
  isGeneratingPreview,
  isGeneratingReport,
  selectedMetrics
})
</script>

<template>
  <div class="date-metrics-configuration">
    <div class="step-header">
      <h2>Configuración Final</h2>
      <p>Selecciona el rango de fechas y las métricas para tu reporte</p>
    </div>
    
    <!-- Debug Info Button -->
    <button 
      v-if="!showDebugInfo" 
      @click="showDebugInfo = true" 
      class="debug-toggle-btn"
      title="Mostrar información de depuración">
      🐛
    </button>
    
    <!-- Validation Status -->
    <div v-if="!canGenerateReport" class="validation-status">
      <h4>Para generar el reporte necesitas:</h4>
      <ul>
        <li :class="{ 'completed': selectedMetrics.length >= 3 }">
          ✓ Seleccionar al menos 3 métricas ({{ selectedMetrics.length }}/3)
        </li>
        <li :class="{ 'completed': dateRange.startDate && dateRange.endDate }">
          ✓ Seleccionar rango de fechas
        </li>
      </ul>
      <button v-if="selectedMetrics.length < 3" @click="selectDefaultMetrics" class="btn btn-sm btn-primary" style="margin-top: 0.5rem; width: 100%;">
        Seleccionar métricas básicas
      </button>
      <button v-if="!dateRange.startDate || !dateRange.endDate" @click="setLast30Days" class="btn btn-sm btn-primary" style="margin-top: 0.5rem; width: 100%;">
        Usar últimos 30 días
      </button>
    </div>
    
    <!-- Debug Info Panel -->
    <div v-if="showDebugInfo" class="debug-info-panel">
      <button @click="showDebugInfo = false" class="btn btn-sm btn-secondary" style="margin-bottom: 1rem;">
        ❌ Cerrar Debug
      </button>
      <DataRangeChecker />
    </div>

    <div class="configuration-wrapper">
      <div class="configuration-grid">
      <!-- Report Customization -->
      <div class="config-section">
        <div class="section-header">
          <h3>🎨 Personalización del Reporte</h3>
          <p>Configura el aspecto visual de tu reporte</p>
        </div>

        <div class="section-content">
          <!-- Report Branding -->
        <div class="customization-subsection">
          <h4>Información del Reporte</h4>
          <div class="form-group">
            <label class="form-label">Título del Reporte</label>
            <input
              v-model="reportCustomization.title"
              type="text"
              class="form-input"
              maxlength="60"
              placeholder="Reporte de Marketing Digital"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Subtítulo</label>
            <input
              v-model="reportCustomization.subtitle"
              type="text"
              class="form-input"
              maxlength="80"
              placeholder="Análisis de Campañas Publicitarias"
            />
          </div>
          <div class="form-group">
            <label class="form-label">Nombre del Cliente</label>
            <input
              v-model="reportCustomization.clientName"
              type="text"
              class="form-input"
              maxlength="50"
              placeholder="Nombre del cliente (opcional)"
            />
          </div>
        </div>

        <!-- Logo Upload -->
        <div class="customization-subsection">
          <h4>Logo de la Empresa</h4>
          <div class="logo-upload">
            <div v-if="!reportCustomization.logoPreview" class="logo-upload-area">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                @change="handleLogoUpload"
                style="display: none"
              />
              <label for="logo-upload" class="logo-upload-button">
                <div class="upload-icon">📁</div>
                <div>Subir Logo</div>
                <div class="upload-hint">PNG, JPG hasta 2MB</div>
              </label>
            </div>
            <div v-else class="logo-preview">
              <img :src="reportCustomization.logoPreview" alt="Logo preview" />
              <button @click="removeLogo" class="remove-logo-btn">✕</button>
            </div>
          </div>
        </div>

        <!-- Color Theme -->
        <div class="customization-subsection">
          <h4>Color de Acento</h4>
          <div class="color-picker">
            <div class="color-grid">
              <div
                v-for="color in predefinedColors"
                :key="color.value"
                class="color-option"
                :class="{ 'color-selected': reportCustomization.accentColor === color.value }"
                :style="{ backgroundColor: color.value }"
                @click="reportCustomization.accentColor = color.value"
                :title="color.name"
              ></div>
            </div>
            <div class="custom-color">
              <input
                v-model="reportCustomization.accentColor"
                type="color"
                class="color-input"
              />
              <span class="color-value">{{ reportCustomization.accentColor }}</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- Date Selection -->
      <div class="config-section date-selection-section">
        <div class="section-header">
          <h3>📅 Rango de Fechas</h3>
          <p>Selecciona el período para tu análisis</p>
        </div>

        <div class="section-content">
          <!-- Campaign Activity Summary -->
        <div v-if="campaignDateSummary" class="campaign-dates-summary">
          <h4>Actividad de Campañas</h4>
          <div class="campaigns-date-list">
            <div v-for="campaign in campaignDateSummary" :key="campaign.id" class="campaign-date-item">
              <div class="campaign-info">
                <span class="campaign-name">{{ campaign.name }}</span>
                <span class="date-range" v-if="campaign.hasData">
                  {{ formatDate(campaign.startDate) }} - {{ formatDate(campaign.endDate) }}
                </span>
                <span class="no-data" v-else>Sin datos disponibles</span>
              </div>
              <div class="campaign-stats">
                <span class="total-days">{{ campaign.totalDays }} días activos</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Date Range Controls -->
        <div class="date-range-controls">
          <div class="control-header">
            <h4>Configuración de Fechas</h4>
            <button 
              @click="toggleAdvancedDates" 
              class="btn btn-outline btn-sm"
            >
              {{ showAdvancedDates ? '📅 Configuración Simple' : '⚙️ Configuración Avanzada' }}
            </button>
          </div>

          <!-- Simple Date Selection -->
          <div v-if="!showAdvancedDates" class="simple-dates">
            <!-- Date Input Controls -->
            <div class="date-selection-button-container">
              <div class="selected-dates-display" v-if="dateRange.startDate && dateRange.endDate">
                <span class="date-label">Fechas seleccionadas:</span>
                <span class="date-value">{{ formatDate(dateRange.startDate) }} - {{ formatDate(dateRange.endDate) }}</span>
              </div>
              <button @click="showDateCalendar = true" class="btn btn-primary calendar-button">
                📅 Selección desde calendario
              </button>
            </div>


            <div v-if="dateValidationError" class="validation-error">
              ⚠️ {{ dateValidationError }}
            </div>


          </div>

          <!-- Advanced Campaign-Specific Dates -->
          <div v-if="showAdvancedDates" class="advanced-dates">
            <div class="advanced-header">
              <h4>⚙️ Configuración por Campaña</h4>
              <p>Configura fechas específicas para cada campaña seleccionada</p>
            </div>

            <div class="campaigns-config">
              <div v-for="campaign in wizardStore.selectedCampaigns" :key="campaign.id" class="campaign-config">
                <div class="campaign-header">
                  <h5>{{ campaign.name }}</h5>
                  <label class="toggle-switch">
                    <input 
                      type="checkbox" 
                      v-model="campaignSpecificDates[campaign.id].enabled"
                    />
                    <span class="slider">Incluir en reporte</span>
                  </label>
                </div>

                <div v-if="campaignSpecificDates[campaign.id]?.enabled" class="campaign-dates">
                  <div class="date-inputs">
                    <div class="form-group">
                      <label class="form-label">Inicio</label>
                      <input
                        :value="campaignSpecificDates[campaign.id]?.startDate || ''"
                        type="date"
                        class="form-input"
                        :min="getCampaignDateInfo(campaign.id)?.startDate"
                        :max="getCampaignDateInfo(campaign.id)?.endDate"
                        @input="updateCampaignDate(campaign.id, 'startDate', $event.target.value)"
                      />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Fin</label>
                      <input
                        :value="campaignSpecificDates[campaign.id]?.endDate || ''"
                        type="date"
                        class="form-input"
                        :min="getCampaignDateInfo(campaign.id)?.startDate"
                        :max="getCampaignDateInfo(campaign.id)?.endDate"
                        @input="updateCampaignDate(campaign.id, 'endDate', $event.target.value)"
                      />
                    </div>
                  </div>

                  <div v-if="campaignSpecificDates[campaign.id]?.validationError" class="validation-error">
                    ⚠️ {{ campaignSpecificDates[campaign.id].validationError }}
                  </div>

                  <div class="campaign-info-text">
                    <p>📊 Disponible: {{ getAvailableDatesForCampaign(campaign.id).length }} días</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- Visual Metrics Configuration -->
      <div class="config-section">
        <div class="section-header">
          <h3>📊 Configuración Visual</h3>
          <p>Selecciona qué mostrar en tu reporte</p>
        </div>

        <div class="section-content">
          <!-- Metric Cards Selection -->
        <div class="customization-subsection">
          <h4>Tarjetas de Métricas (máximo 6)</h4>
          <p class="subsection-desc">Estas métricas se mostrarán como tarjetas destacadas en el reporte</p>
          <div class="visual-metrics-grid">
            <div
              v-for="metric in availableMetrics"
              :key="metric.id"
              class="visual-metric-item"
              :class="{ 'visual-metric-selected': isCardMetricSelected(metric.id) }"
              @click="toggleCardMetric(metric.id)"
            >
              <div class="metric-icon">💳</div>
              <div class="metric-info">
                <div class="metric-name">{{ metric.name }}</div>
                <div class="metric-category">{{ getCategoryName(metric.category) }}</div>
              </div>
              <div class="selection-indicator">
                <div v-if="isCardMetricSelected(metric.id)" class="check-icon">✓</div>
              </div>
            </div>
          </div>
          <div class="selection-count">
            {{ reportCustomization.selectedCardMetrics.length }}/6 tarjetas seleccionadas
          </div>
        </div>

        <!-- Chart Configuration -->
        <div class="customization-subsection">
          <h4>Gráfico Principal</h4>
          <p class="subsection-desc">Configura el gráfico que aparecerá en tu reporte</p>
          
          <!-- Chart Type Selection -->
          <div class="chart-type-selection">
            <label class="form-label">Tipo de Gráfico</label>
            <div class="chart-types-grid">
              <div
                v-for="chartType in chartTypes"
                :key="chartType.id"
                class="chart-type-item"
                :class="{ 'chart-type-selected': reportCustomization.chartType === chartType.id }"
                @click="reportCustomization.chartType = chartType.id"
              >
                <div class="chart-type-icon">{{ chartType.icon }}</div>
                <div class="chart-type-name">{{ chartType.name }}</div>
              </div>
            </div>
          </div>

          <!-- Chart Metrics Selection -->
          <div class="chart-metrics-selection">
            <label class="form-label">Métricas del Gráfico (máximo 4)</label>
            <div class="visual-metrics-grid">
              <div
                v-for="metric in availableMetrics"
                :key="metric.id"
                class="visual-metric-item"
                :class="{ 'visual-metric-selected': isChartMetricSelected(metric.id) }"
                @click="toggleChartMetric(metric.id)"
              >
                <div class="metric-icon">📈</div>
                <div class="metric-info">
                  <div class="metric-name">{{ metric.name }}</div>
                  <div class="metric-category">{{ getCategoryName(metric.category) }}</div>
                </div>
                <div class="selection-indicator">
                  <div v-if="isChartMetricSelected(metric.id)" class="check-icon">✓</div>
                </div>
              </div>
            </div>
            <div class="selection-count">
              {{ reportCustomization.chartMetrics.length }}/4 métricas seleccionadas
            </div>
          </div>
        </div>

        <!-- Basic Metrics Selection (hidden, for compatibility) -->
        <div style="display: none;">
          <div v-for="metric in availableMetrics" :key="metric.id">
            <input
              type="checkbox"
              :checked="isMetricSelected(metric.id)"
              @change="toggleMetric(metric)"
            />
          </div>
        </div>
        </div>
      </div>
    </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoadingMetrics" class="loading-section">
      <div class="loading-spinner">⏳</div>
      <p>Cargando métricas disponibles...</p>
    </div>

    <!-- Error State -->
    <div v-if="generationError" class="error-section">
      <div class="error-icon">❌</div>
      <p>{{ generationError }}</p>
      <button @click="generationError = null" class="btn btn-secondary btn-sm">Cerrar</button>
    </div>

    <!-- Preview Section -->
    <div v-if="previewData && previewData.length > 0" class="preview-section">
      <div class="section-header">
        <h3>👀 Vista Previa del Reporte</h3>
        <p>Mostrando las primeras {{ Math.min(previewData.length, 10) }} filas de {{ previewData.length }} total</p>
      </div>
      <div class="preview-table">
        <table>
          <thead>
            <tr>
              <th v-for="column in Object.keys(previewData[0] || {})" :key="column">
                {{ column }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in previewData.slice(0, 10)" :key="index">
              <td v-for="column in Object.keys(row)" :key="column">
                {{ row[column] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>


    <!-- Report Preview -->
    <div v-if="reportCustomization.selectedCardMetrics.length > 0 || reportCustomization.chartMetrics.length > 0" class="report-preview">
      <div class="preview-card">
        <div class="preview-header">
          <h3>🎨 Vista Previa del Reporte</h3>
        </div>
        <div class="preview-content">
          <!-- Report Header Preview -->
          <div class="preview-report-header" :style="{ borderColor: reportCustomization.accentColor }">
            <div class="preview-logo" v-if="reportCustomization.logoPreview">
              <img :src="reportCustomization.logoPreview" alt="Logo" />
            </div>
            <div class="preview-text">
              <h1 :style="{ color: reportCustomization.accentColor }">{{ reportCustomization.title }}</h1>
              <h2>{{ reportCustomization.subtitle }}</h2>
              <p v-if="reportCustomization.clientName">{{ reportCustomization.clientName }}</p>
            </div>
          </div>

          <!-- Preview Cards -->
          <div v-if="reportCustomization.selectedCardMetrics.length > 0" class="preview-cards">
            <h4>Tarjetas de Métricas</h4>
            <div class="cards-preview-grid">
              <div
                v-for="metricId in reportCustomization.selectedCardMetrics"
                :key="metricId"
                class="preview-metric-card"
                :style="{ borderTopColor: reportCustomization.accentColor }"
              >
                <div class="card-title">{{ getMetricName(metricId) }}</div>
                <div class="card-value" :style="{ color: reportCustomization.accentColor }">$12,345</div>
                <div class="card-trend">↗ +15.2%</div>
              </div>
            </div>
          </div>

          <!-- Preview Chart -->
          <div v-if="reportCustomization.chartMetrics.length > 0" class="preview-chart">
            <h4>Gráfico Principal ({{ chartTypes.find(c => c.id === reportCustomization.chartType)?.name }})</h4>
            <div class="chart-preview" :style="{ borderColor: reportCustomization.accentColor }">
              <div class="chart-placeholder">
                <div class="chart-icon">{{ chartTypes.find(c => c.id === reportCustomization.chartType)?.icon }}</div>
                <div class="chart-metrics">
                  <div v-for="metricId in reportCustomization.chartMetrics" :key="metricId" class="chart-metric">
                    <span class="metric-dot" :style="{ backgroundColor: reportCustomization.accentColor }"></span>
                    {{ getMetricName(metricId) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Configuration Summary -->
          <div class="summary-section">
            <h4>Configuración:</h4>
            <div class="config-summary-items">
              <div class="config-item">
                <span class="config-label">Período:</span>
                <span class="config-value" v-if="dateRange.startDate && dateRange.endDate">
                  {{ formatDate(dateRange.startDate) }} - {{ formatDate(dateRange.endDate) }}
                </span>
                <span class="config-value text-muted" v-else>Sin fechas seleccionadas</span>
              </div>
              <div class="config-item">
                <span class="config-label">Color de acento:</span>
                <span class="config-value">
                  <span class="color-preview" :style="{ backgroundColor: reportCustomization.accentColor }"></span>
                  {{ reportCustomization.accentColor }}
                </span>
              </div>
              <div class="config-item">
                <span class="config-label">Tarjetas:</span>
                <span class="config-value">{{ reportCustomization.selectedCardMetrics.length }} métricas</span>
              </div>
              <div class="config-item">
                <span class="config-label">Gráfico:</span>
                <span class="config-value">
                  {{ chartTypes.find(c => c.id === reportCustomization.chartType)?.name }} 
                  ({{ reportCustomization.chartMetrics.length }} métricas)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreviewModal" class="preview-modal-overlay" @click="closePreviewModal">
      <div class="preview-modal" @click.stop>
        <div class="modal-header">
          <h3>👀 Vista Previa del Reporte</h3>
          <button @click="closePreviewModal" class="close-modal-btn">✕</button>
        </div>
        <div class="modal-content">
          <div v-if="previewData && previewData.length > 0" class="preview-table-modal">
            <p>Mostrando las primeras {{ Math.min(previewData.length, 10) }} filas de {{ previewData.length }} total</p>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th v-for="column in Object.keys(previewData[0] || {})" :key="column">
                      {{ column }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in previewData.slice(0, 10)" :key="index">
                    <td v-for="column in Object.keys(row)" :key="column">
                      {{ row[column] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="no-preview-data">
            <p>No hay datos de vista previa disponibles</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Date Selection Modal -->
  <div v-if="showDateCalendar" class="modal-overlay" @click.self="showDateCalendar = false">
    <div class="modal-container date-modal">
      <div class="modal-header">
        <h3>Seleccionar Rango de Fechas</h3>
        <button @click="showDateCalendar = false" class="modal-close-btn">✕</button>
      </div>
      
      <div class="modal-body">
        <!-- Preset Date Ranges -->
        <div class="preset-date-ranges">
          <h4>Rangos Predefinidos</h4>
          <div class="preset-buttons">
            <button 
              @click="setLastWeek" 
              class="preset-btn"
              :class="{ 'active': selectedPresetRange === 'week' }"
            >
              📅 Última Semana
            </button>
            <button 
              @click="setLastMonth" 
              class="preset-btn"
              :class="{ 'active': selectedPresetRange === 'month' }"
            >
              📅 Último Mes
            </button>
            <button 
              @click="setLast30Days" 
              class="preset-btn"
              :class="{ 'active': selectedPresetRange === '30days' }"
            >
              📅 Últimos 30 Días
            </button>
            <button 
              @click="setCurrentMonth" 
              class="preset-btn"
              :class="{ 'active': selectedPresetRange === 'current' }"
            >
              📅 Mes Actual
            </button>
            <button 
              @click="setPreviousMonth" 
              class="preset-btn"
              :class="{ 'active': selectedPresetRange === 'previous' }"
            >
              📅 Mes Anterior
            </button>
            <button 
              @click="setQuarter" 
              class="preset-btn"
              :class="{ 'active': selectedPresetRange === 'quarter' }"
            >
              📅 Último Trimestre
            </button>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Calendar Section -->
        <div class="calendar-section">
          <h4>Selección Manual</h4>
          
          <div class="calendar-navigation">
            <button @click="navigateCalendar(-1)" class="calendar-nav-btn">‹</button>
            <h4 class="calendar-title">{{ getMonthName(calendarMonth) }}</h4>
            <button @click="navigateCalendar(1)" class="calendar-nav-btn">›</button>
          </div>

          <div class="calendar-legend">
            <div class="legend-item">
              <span class="legend-color unavailable"></span>
              <span>Sin datos</span>
            </div>
            <div class="legend-item">
              <span class="legend-color available"></span>
              <span>Disponible</span>
            </div>
            <div class="legend-item">
              <span class="legend-color selected"></span>
              <span>Seleccionado</span>
            </div>
          </div>

          <div class="calendar-grid">
            <div class="calendar-weekdays">
              <div class="weekday">Dom</div>
              <div class="weekday">Lun</div>
              <div class="weekday">Mar</div>
              <div class="weekday">Mié</div>
              <div class="weekday">Jue</div>
              <div class="weekday">Vie</div>
              <div class="weekday">Sáb</div>
            </div>

            <div class="calendar-days">
              <div
                v-for="day in generateCalendarDays()"
                :key="day.dateString"
                class="calendar-day"
                :class="[
                  `calendar-day--${getDateStatus(day)}`,
                  { 'calendar-day--today': day.isToday }
                ]"
                @click="selectCalendarDate(day)"
                :title="day.hasData ? `Datos disponibles: ${formatDate(day.dateString)}` : `Sin datos: ${formatDate(day.dateString)}`"
              >
                {{ day.day }}
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Dates Display -->
        <div class="selected-dates-preview">
          <p v-if="dateRange.startDate && dateRange.endDate">
            <strong>Fechas seleccionadas:</strong> {{ formatDate(dateRange.startDate) }} - {{ formatDate(dateRange.endDate) }}
          </p>
          <p v-else-if="dateRange.startDate">
            <strong>Fecha de inicio:</strong> {{ formatDate(dateRange.startDate) }}
          </p>
          <p v-else>
            Selecciona un rango de fechas
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="showDateCalendar = false" class="btn btn-secondary">Cancelar</button>
        <button 
          @click="confirmDateSelection" 
          class="btn btn-primary"
          :disabled="!dateRange.startDate || !dateRange.endDate"
        >
          Confirmar Selección
        </button>
      </div>
    </div>
  </div>
</template>


<style scoped>
.date-metrics-configuration {
  max-width: 1800px;
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

.configuration-wrapper {
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  justify-content: center;
}

.configuration-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2.5rem;
  height: 600px;
  padding: 1rem 2rem;
  min-width: 1600px;
}

.config-section {
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.date-selection-section {
  flex: 1.25;
}

.section-header {
  margin-bottom: 0.5rem;
  flex-shrink: 0;
}

.section-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.section-header h3 {
  color: #1e293b;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
}

.section-header p {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.4;
}

.date-inputs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.date-shortcuts {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.metrics-categories {
  space-y: 1.5rem;
}

.metric-category {
  margin-bottom: 1.5rem;
}

.category-title {
  color: #374151;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.metric-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.metric-item:hover {
  border-color: #cbd5e1;
  background-color: #f8fafc;
}

.metric-selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.metric-checkbox {
  margin-right: 0.75rem;
}

.metric-info {
  flex: 1;
}

.metric-name {
  font-weight: 500;
  color: #1e293b;
}

.metric-unit {
  font-size: 0.75rem;
  color: #64748b;
}

.configuration-summary {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #7dd3fc;
  border-radius: 1rem;
  padding: 1.5rem;
}

.summary-header h3 {
  color: #0c4a6e;
  font-weight: 600;
  margin-bottom: 1rem;
}

.summary-section {
  margin-bottom: 1rem;
}

.summary-section h4 {
  color: #075985;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.summary-section p {
  color: #0369a1;
  margin: 0;
}

.text-muted {
  color: #64748b !important;
  font-style: italic;
}

.metric-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.metric-chip {
  background-color: white;
  border: 1px solid #7dd3fc;
  color: #0369a1;
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}

.estimation-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  gap: 0.5rem;
}

.stat-label {
  color: #075985;
}

.stat-value {
  color: #0c4a6e;
  font-weight: 600;
}

/* Loading and Error States */
.loading-section, .error-section {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  margin-bottom: 2rem;
}

.loading-spinner {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.error-section {
  background: #fef2f2;
  border-color: #fca5a5;
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.error-section p {
  color: #991b1b;
  margin-bottom: 1rem;
}

/* Preview Section */
.preview-section {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  margin-bottom: 2rem;
  padding: 1.5rem;
}

.preview-table {
  overflow-x: auto;
  margin-top: 1rem;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.preview-table th,
.preview-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.preview-table th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #374151;
}

.preview-table td {
  color: #6b7280;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.export-buttons {
  display: flex;
  gap: 0.5rem;
}

/* Responsive - Prioritize keeping 3 columns aligned */
@media (max-width: 1200px) {
  .configuration-grid {
    gap: 1.5rem;
    min-width: 900px;
  }
}

@media (max-width: 1000px) {
  .configuration-grid {
    gap: 1rem;
    min-width: 800px;
  }
}

/* Only break to 2 columns on very small screens */
@media (max-width: 800px) {
  .configuration-wrapper {
    overflow-y: auto;
  }
  .configuration-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    min-width: 600px;
    min-height: auto;
  }
}

@media (max-width: 600px) {
  .configuration-wrapper {
    overflow-y: auto;
  }
  .configuration-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    min-width: 300px;
    min-height: auto;
  }
  
  .date-inputs {
    flex-direction: column;
  }
  
  .estimation-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }
  
  .export-buttons {
    justify-content: center;
  }
  
  .visual-metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .chart-types-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Campaign Date Selection Styles */
.campaign-dates-summary {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.campaign-dates-summary h4 {
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.campaigns-date-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.campaign-date-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 0.25rem;
  border: 1px solid #e5e7eb;
}

.campaign-name {
  font-weight: 500;
  color: #1f2937;
}

.date-range {
  font-size: 0.875rem;
  color: #6b7280;
  margin-left: 0.5rem;
}

.no-data {
  font-size: 0.875rem;
  color: #ef4444;
  font-style: italic;
  margin-left: 0.5rem;
}

.total-days {
  font-size: 0.75rem;
  color: #059669;
  background: #ecfdf5;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.date-range-controls {
  margin-top: 1rem;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.control-header h4 {
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.simple-dates {
  padding: 1rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.validation-error {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 0.25rem;
  border: 1px solid #fca5a5;
  margin: 0.5rem 0;
  font-size: 0.875rem;
}

.available-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.25rem;
}

.available-info p {
  margin: 0;
  font-size: 0.875rem;
  color: #0369a1;
}

.limited-data-warning {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 0.25rem;
}

.limited-data-warning p {
  margin: 0;
  font-size: 0.875rem;
  color: #92400e;
  line-height: 1.4;
}

.limited-data-warning p + p {
  margin-top: 0.5rem;
}

.advanced-dates {
  padding: 1rem;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.advanced-header {
  margin-bottom: 1.5rem;
}

.advanced-header h4 {
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.advanced-header p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.campaigns-config {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.campaign-config {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  background: #fafafa;
}

.campaign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.campaign-header h5 {
  color: #1f2937;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
}

.toggle-switch input[type="checkbox"] {
  transform: scale(1.1);
}

.campaign-dates {
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.campaign-info-text {
  margin-top: 0.75rem;
}

.campaign-info-text p {
  margin: 0;
  font-size: 0.875rem;
  color: #059669;
}

@media (max-width: 768px) {
  .campaign-date-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .control-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .campaign-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}

/* Report Customization Styles */
.customization-subsection {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.customization-subsection:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.customization-subsection h4 {
  color: #1e293b;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.subsection-desc {
  color: #64748b;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

/* Logo Upload Styles */
.logo-upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.2s ease;
}

.logo-upload-area:hover {
  border-color: #94a3b8;
  background-color: #f8fafc;
}

.logo-upload-button {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 2rem;
}

.upload-hint {
  font-size: 0.75rem;
  color: #64748b;
}

.logo-preview {
  position: relative;
  display: inline-block;
  max-width: 200px;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.logo-preview img {
  width: 100%;
  height: auto;
  max-height: 100px;
  object-fit: contain;
}

.remove-logo-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Color Picker Styles */
.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-selected {
  border-color: #1e293b;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #1e293b;
}

.custom-color {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-input {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.color-value {
  font-family: monospace;
  font-size: 0.875rem;
  color: #64748b;
}

/* Visual Metrics Grid */
.visual-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.visual-metric-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  font-size: 0.875rem;
}

.visual-metric-item:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.visual-metric-selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.metric-icon {
  font-size: 1.25rem;
  margin-right: 0.5rem;
}

.metric-info {
  flex: 1;
}

.metric-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.125rem;
  font-size: 0.875rem;
  line-height: 1.2;
}

.metric-category {
  font-size: 0.625rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.selection-indicator {
  margin-left: 0.75rem;
}

.check-icon {
  background: #10b981;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: bold;
}

.selection-count {
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Chart Type Selection */
.chart-types-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.chart-type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.chart-type-item:hover {
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chart-type-selected {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.chart-type-icon {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.chart-type-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.75rem;
}

/* Report Preview Styles */
.report-preview {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  margin-bottom: 2rem;
}

.preview-card {
  padding: 1.5rem;
}

.preview-header h3 {
  color: #1e293b;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.preview-report-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border-left: 4px solid;
  margin-bottom: 1.5rem;
}

.preview-logo {
  flex-shrink: 0;
}

.preview-logo img {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

.preview-text h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.preview-text h2 {
  font-size: 1.125rem;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.preview-text p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

.preview-cards,
.preview-chart {
  margin-bottom: 1.5rem;
}

.preview-cards h4,
.preview-chart h4 {
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.cards-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.preview-metric-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  border-top: 3px solid;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.card-trend {
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 500;
}

.chart-preview {
  background: white;
  border-radius: 0.5rem;
  padding: 2rem;
  border: 2px solid;
  text-align: center;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.chart-icon {
  font-size: 3rem;
}

.chart-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.chart-metric {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
}

.metric-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.config-summary-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.config-label {
  font-weight: 500;
  color: #374151;
}

.config-value {
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-preview {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .configuration-grid {
    grid-template-columns: 1fr;
  }
  
  .color-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .chart-types-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .visual-metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .cards-preview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .config-summary-items {
    grid-template-columns: 1fr;
  }
  
  .preview-report-header {
    flex-direction: column;
    text-align: center;
  }
  
  .chart-metrics {
    flex-direction: column;
  }
}

/* Visual Calendar Styles */
.date-input-section {
  margin-bottom: 1rem;
}

.date-selection-button-container {
  text-align: center;
  margin: 1.5rem 0;
}

.selected-dates-display {
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.date-label {
  color: #64748b;
  margin-right: 0.5rem;
}

.date-value {
  color: #1e293b;
  font-weight: 600;
}

.calendar-button {
  font-size: 1rem;
  padding: 0.75rem 1.5rem;
}

.date-input-wrapper {
  position: relative;
}

.calendar-toggle {
  text-align: center;
  margin-top: 1rem;
}

/* Debug Button Styles */
.debug-toggle-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #3b82f6;
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 100;
}

.debug-toggle-btn:hover {
  background-color: #2563eb;
  transform: scale(1.1);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

.debug-info-panel {
  position: fixed;
  bottom: 80px;
  right: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-width: 400px;
  max-height: 500px;
  overflow-y: auto;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.date-modal {
  max-width: 900px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s;
}

.modal-close-btn:hover {
  color: #1f2937;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Preset Date Ranges */
.preset-date-ranges {
  margin-bottom: 2rem;
}

.preset-date-ranges h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.preset-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.preset-btn {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.preset-btn:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.preset-btn.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 2rem 0;
}

/* Calendar Section in Modal */
.calendar-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.calendar-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
}

.calendar-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  text-transform: capitalize;
}

.calendar-nav-btn {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.25rem;
  color: #6b7280;
  transition: all 0.2s;
}

.calendar-nav-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.calendar-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 0.25rem;
  border: 1px solid #d1d5db;
}

.legend-color.unavailable {
  background-color: #ef4444;
}

.legend-color.available {
  background-color: #3b82f6;
}

.legend-color.selected {
  background-color: #10b981;
}

.calendar-grid {
  width: 100%;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 0.5rem;
}

.weekday {
  padding: 0.5rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  background: #f9fafb;
  border-radius: 0.25rem;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border: 2px solid transparent;
}

/* Calendar day states */
.calendar-day--other-month {
  color: #d1d5db;
  background-color: #f9fafb;
  cursor: not-allowed;
}

.calendar-day--unavailable {
  background-color: #fee2e2;
  color: #dc2626;
  cursor: not-allowed;
  border-color: #fca5a5;
}

.calendar-day--unavailable:hover {
  background-color: #fecaca;
}

.calendar-day--available {
  background-color: #dbeafe;
  color: #1d4ed8;
  border-color: #93c5fd;
}

.calendar-day--available:hover {
  background-color: #bfdbfe;
  border-color: #60a5fa;
  transform: scale(1.05);
}

.calendar-day--selected-range {
  background-color: #d1fae5;
  color: #047857;
  border-color: #6ee7b7;
}

.calendar-day--selected-endpoint {
  background-color: #10b981;
  color: white;
  border-color: #059669;
  font-weight: 700;
}

.calendar-day--selected-endpoint:hover {
  background-color: #059669;
}

.calendar-day--today {
  box-shadow: 0 0 0 2px #f59e0b;
}

.calendar-day--today.calendar-day--available {
  box-shadow: 0 0 0 2px #f59e0b, 0 0 0 4px #dbeafe;
}

.calendar-day--today.calendar-day--selected-endpoint {
  box-shadow: 0 0 0 2px #f59e0b, 0 0 0 4px #10b981;
}

/* Responsive calendar */
@media (max-width: 768px) {
  .calendar-legend {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .legend-item {
    justify-content: center;
  }
  
  .calendar-day {
    font-size: 0.75rem;
  }
  
  .weekday {
    padding: 0.375rem;
    font-size: 0.75rem;
  }
}

/* Preview Modal Styles */
.preview-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.preview-modal {
  background: white;
  border-radius: 1rem;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-header h3 {
  margin: 0;
  color: #1e293b;
  font-weight: 600;
}

.close-modal-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.close-modal-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.preview-table-modal {
  width: 100%;
}

.preview-table-modal p {
  margin-bottom: 1rem;
  color: #64748b;
  font-size: 0.875rem;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
}

.table-container table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.table-container th,
.table-container td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.table-container th {
  background-color: #f8fafc;
  font-weight: 600;
  color: #374151;
  position: sticky;
  top: 0;
}

.table-container td {
  color: #6b7280;
}

.table-container tr:last-child td {
  border-bottom: none;
}

.no-preview-data {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.no-preview-data p {
  margin: 0;
  font-size: 1rem;
}

/* Selected Dates Preview in Modal */
.selected-dates-preview {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.selected-dates-preview p {
  margin: 0;
  color: #374151;
  font-size: 0.875rem;
}

.selected-dates-preview strong {
  color: #1f2937;
  font-weight: 600;
}

/* Validation Status */
.validation-status {
  position: fixed;
  top: 100px;
  right: 20px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 50;
  max-width: 300px;
}

.validation-status h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
}

.validation-status ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.validation-status li {
  font-size: 0.875rem;
  color: #92400e;
  margin-bottom: 0.25rem;
}

.validation-status li.completed {
  color: #059669;
  font-weight: 500;
}
</style>