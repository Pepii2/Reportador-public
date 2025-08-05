import { reactive } from 'vue'
import apiService from '@/services/apiService'
import reportService from '@/services/reportService'
import * as XLSX from 'xlsx'

export const wizardStore = reactive({
  // Step 0: Team Selection (NEW)
  selectedTeam: null,
  
  // Step 1: Platform Selection
  selectedPlatform: null,
  
  // Step 2: Report Type Selection
  reportType: null, // 'simple', 'compare-campaigns', 'compare-periods'
  
  // Step 3: Ad Account Selection
  selectedAdAccounts: [],
  availableAdAccounts: [],
  
  // Step 4: Campaign Selection
  selectedCampaigns: [],
  availableCampaigns: [],
  unifiedReports: true, // true for unified, false for separate reports
  
  // Step 5: Ad Set Selection
  selectedAdSets: [],
  availableAdSets: [],
  
  // Step 6: Date and Metrics Configuration
  dateRange: {
    startDate: null,
    endDate: null
  },
  campaignActiveDates: {}, // campaignId: { startDate, endDate, activeDates: [] }
  selectedMetrics: [],
  availableMetrics: [
    // Universal metrics
    { id: 'cost', name: 'Costo', category: 'universal', unit: 'currency' },
    { id: 'clicks', name: 'Clics', category: 'universal', unit: 'count' },
    { id: 'impressions', name: 'Impresiones', category: 'universal', unit: 'count' },
    
    // Facebook specific
    { id: 'reach', name: 'Alcance', category: 'facebook', unit: 'count' },
    { id: 'frequency', name: 'Frecuencia', category: 'facebook', unit: 'ratio' },
    { id: 'inline_link_clicks', name: 'Clics en Enlaces', category: 'facebook', unit: 'count' },
    { id: 'inline_post_engagement', name: 'Interacciones', category: 'facebook', unit: 'count' },
    { id: 'video_views', name: 'Visualizaciones de Video', category: 'facebook', unit: 'count' },
    { id: 'purchases', name: 'Compras', category: 'facebook', unit: 'count' },
    { id: 'revenue', name: 'Ingresos', category: 'facebook', unit: 'currency' },
    
    // TikTok specific
    { id: 'video_play_actions', name: 'Reproducciones de Video', category: 'tiktok', unit: 'count' },
    { id: 'video_watched_2_s', name: 'Videos > 2s', category: 'tiktok', unit: 'count' },
    { id: 'purchases_value', name: 'Valor de Compras', category: 'tiktok', unit: 'currency' },
    
    // Google specific
    { id: 'conversions', name: 'Conversiones', category: 'google', unit: 'count' }
  ],
  
  // Navigation
  currentStep: 0, // Start at team selection
  maxStep: 0,
  
  // Methods
  setTeam(teamId) {
    this.selectedTeam = teamId
    this.updateMaxStep(1)
  },
  
  setSelectedPlatform(platform) {
    this.selectedPlatform = platform
    this.updateMaxStep(2)
  },
  
  setReportType(type) {
    this.reportType = type
    this.updateMaxStep(3)
  },
  
  setSelectedAdAccounts(accounts) {
    this.selectedAdAccounts = accounts
    this.updateMaxStep(4)
  },
  
  async setSelectedCampaigns(campaigns, unified = true) {
    this.selectedCampaigns = campaigns
    this.unifiedReports = unified
    
    // Auto-load and select all ad sets for selected campaigns
    if (campaigns.length > 0) {
      try {
        const accountIds = this.selectedAdAccounts.map(acc => acc.id)
        const campaignIds = campaigns.map(camp => camp.id)
        
        // Load ad sets, metrics, and campaign dates in parallel
        const [adSetsResult, metricsResult, datesResult] = await Promise.allSettled([
          this.loadAdSets(accountIds, campaignIds),
          this.loadAvailableMetrics(accountIds),
          this.loadCampaignActiveDates(campaignIds)
        ])
        
        // Auto-select all available ad sets
        this.selectedAdSets = [...this.availableAdSets]
        console.log(`✅ Auto-selected ${this.selectedAdSets.length} ad sets for campaigns`)
        
        if (metricsResult.status === 'fulfilled') {
          console.log('✅ Metrics loaded successfully')
        } else {
          console.warn('⚠️ Could not load metrics:', metricsResult.reason)
        }
      } catch (error) {
        console.warn('⚠️ Could not auto-load campaign data:', error)
      }
    } else {
      this.selectedAdSets = []
      this.availableAdSets = []
    }
    
    // Skip AdSet step by going directly to step 6
    this.updateMaxStep(6)
  },
  
  setSelectedAdSets(adSets) {
    this.selectedAdSets = adSets
    this.updateMaxStep(6)
  },
  
  setDateRange(startDate, endDate) {
    this.dateRange.startDate = startDate
    this.dateRange.endDate = endDate
  },
  
  setSelectedMetrics(metrics) {
    this.selectedMetrics = metrics
  },
  
  updateMaxStep(step) {
    if (step > this.maxStep) {
      this.maxStep = step
    }
  },
  
  setCurrentStep(step) {
    this.currentStep = step
  },
  
  canGoToStep(step) {
    return step <= this.maxStep
  },
  
  nextStep() {
    if (this.currentStep < 6) {
      // Skip AdSet selection step (step 5)
      if (this.currentStep === 4) {
        this.currentStep = 6
      } else {
        this.currentStep++
      }
    }
  },
  
  previousStep() {
    if (this.currentStep > 0) {
      // Skip AdSet selection step (step 5) when going back
      if (this.currentStep === 6) {
        this.currentStep = 4
      } else {
        this.currentStep--
      }
    }
  },
  
  // Get configuration object for API calls
  get config() {
    return {
      team: this.selectedTeam,
      platform: this.selectedPlatform,
      reportType: this.reportType,
      accounts: this.selectedAdAccounts,
      campaigns: this.selectedCampaigns,
      adSets: this.selectedAdSets,
      dateRange: this.dateRange,
      metrics: this.selectedMetrics,
      unified: this.unifiedReports
    }
  },
  
  getAvailableMetrics() {
    if (!this.selectedPlatform || !this.selectedPlatform.id) return this.availableMetrics
    
    return this.availableMetrics.filter(metric => 
      metric.category === 'universal' || metric.category === this.selectedPlatform.id.toLowerCase()
    )
  },
  
  reset() {
    this.selectedTeam = null
    this.selectedPlatform = null
    this.reportType = null
    this.selectedAdAccounts = []
    this.availableAdAccounts = []
    this.selectedCampaigns = []
    this.availableCampaigns = []
    this.unifiedReports = true
    this.selectedAdSets = []
    this.availableAdSets = []
    this.dateRange = { startDate: null, endDate: null }
    this.selectedMetrics = []
    this.currentStep = 0
    this.maxStep = 0
  },

  // Validation helpers
  validateStep(step) {
    switch (step) {
      case 0: return this.selectedTeam !== null
      case 1: return this.selectedPlatform !== null
      case 2: return this.reportType !== null
      case 3: return this.selectedAdAccounts.length > 0
      case 4: return this.selectedCampaigns.length > 0
      case 6: return this.selectedMetrics.length >= 3 && this.dateRange.startDate && this.dateRange.endDate
      default: return false
    }
  },

  getStepValidationMessage(step) {
    switch (step) {
      case 0: return 'Selecciona un equipo'
      case 1: return 'Selecciona una plataforma'
      case 2: return 'Selecciona un tipo de reporte'
      case 3: return 'Selecciona al menos una cuenta publicitaria'
      case 4: return 'Selecciona al menos una campaña'
      case 6: return 'Selecciona al menos 3 métricas y un rango de fechas'
      default: return 'Paso no válido'
    }
  },

  // API Integration Methods
  async loadAdAccounts(platform = null, teamFilter = null) {
    try {
      console.log('🔍 Loading ad accounts from API...')
      const filters = {}
      if (platform) filters.platform = platform
      // Use provided team filter or the selected team
      const team = teamFilter || this.selectedTeam
      if (team) filters.team = team
      
      const response = await apiService.getAdAccounts(filters)
      
      // Handle different API response formats for ad accounts
      let accountsData = []
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          accountsData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          accountsData = response.data.data
          console.log('🔍 Found nested accounts data array with', accountsData.length, 'items')
        } else {
          console.log('🔍 Accounts API response structure:', response.data)
          console.log('🔍 Accounts API response keys:', Object.keys(response.data))
        }
      } else if (response.data && Array.isArray(response.data)) {
        accountsData = response.data
      }
      
      // Process account data - show what fields are available
      this.availableAdAccounts = accountsData
      
      if (accountsData.length > 0) {
        console.log('🔍 Sample account data:', accountsData[0])
        console.log('🔍 Available account fields:', Object.keys(accountsData[0]))
      }
      
      console.log(`✅ Loaded ${this.availableAdAccounts.length} ad accounts`)
      return this.availableAdAccounts
    } catch (error) {
      console.error('❌ Failed to load ad accounts:', error)
      throw error
    }
  },

  async loadCampaigns(accountIds, options = {}) {
    try {
      console.log('🔍 Loading campaigns from API...')
      // Add team to options if available
      const enhancedOptions = {
        ...options,
        team: this.selectedTeam
      }
      const response = await apiService.getCampaigns(this.selectedPlatform?.id || this.selectedPlatform, accountIds, enhancedOptions)
      
      // Handle different API response formats for campaigns
      let campaignsData = []
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          campaignsData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          campaignsData = response.data.data
          console.log('🔍 Found nested campaigns data array with', campaignsData.length, 'items')
        } else {
          console.log('🔍 Campaigns API response structure:', response.data)
          console.log('🔍 Campaigns API response keys:', Object.keys(response.data))
        }
      } else if (response.data && Array.isArray(response.data)) {
        campaignsData = response.data
      }
      
      // Process campaign data - show what fields are available
      this.availableCampaigns = campaignsData
      
      if (campaignsData.length > 0) {
        console.log('🔍 Sample campaign data:', campaignsData[0])
        console.log('🔍 Available campaign fields:', Object.keys(campaignsData[0]))
      }
      
      console.log(`✅ Loaded ${this.availableCampaigns.length} campaigns`)
      return this.availableCampaigns
    } catch (error) {
      console.error('❌ Failed to load campaigns:', error)
      throw error
    }
  },

  async loadAdSets(accountIds, campaignIds) {
    try {
      console.log('🔍 Loading ad sets from API...')
      const response = await apiService.getAdSets(accountIds, campaignIds)
      
      // Handle different API response formats for ad sets
      let adSetsData = []
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          adSetsData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          adSetsData = response.data.data
          console.log('🔍 Found nested ad sets data array with', adSetsData.length, 'items')
        } else {
          console.log('🔍 Ad sets API response structure:', response.data)
          console.log('🔍 Ad sets API response keys:', Object.keys(response.data))
          console.warn('⚠️ Ad sets API returned unexpected format, using empty array')
        }
      } else if (response.data && Array.isArray(response.data)) {
        adSetsData = response.data
      }
      
      this.availableAdSets = adSetsData
      console.log(`✅ Loaded ${this.availableAdSets.length} ad sets`)
      return this.availableAdSets
    } catch (error) {
      console.error('❌ Failed to load ad sets:', error)
      console.warn('⚠️ Setting ad sets to empty array due to API error')
      this.availableAdSets = []
      return this.availableAdSets
    }
  },

  async loadAvailableMetrics(accountIds) {
    try {
      console.log('🔍 Loading available metrics from API...')
      const response = await apiService.getAvailableMetrics(this.selectedPlatform?.id || this.selectedPlatform)
      
      // Handle different API response formats for metrics
      let metricsData = []
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          metricsData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          metricsData = response.data.data
          console.log('🔍 Found nested metrics data array with', metricsData.length, 'items')
        } else {
          console.log('🔍 Metrics API response structure:', response.data)
        }
      } else if (response.data && Array.isArray(response.data)) {
        metricsData = response.data
      }
      
      // Update available metrics based on API response
      if (metricsData && metricsData.length > 0) {
        const apiMetrics = metricsData
          .filter(metric => metric && metric.id && metric.name) // Filter out invalid metrics
          .map(metric => ({
            id: metric.id,
            name: metric.name,
            category: metric.category || 'universal',
            unit: this.getMetricUnit(metric)
          }))
        
        // Merge with existing static metrics, preferring API data
        const existingMetrics = this.availableMetrics.filter(m => 
          !apiMetrics.find(am => am.id === m.id)
        )
        
        this.availableMetrics = [...apiMetrics, ...existingMetrics]
        
        // Auto-select default metrics if none selected
        if (this.selectedMetrics.length === 0) {
          this.autoSelectDefaultMetrics()
        }
      }
      
      console.log(`✅ Loaded ${metricsData?.length || 0} metrics from API`)
      return metricsData || []
    } catch (error) {
      console.error('❌ Failed to load metrics:', error)
      // Auto-select defaults even with static metrics
      if (this.selectedMetrics.length === 0) {
        this.autoSelectDefaultMetrics()
      }
      return this.availableMetrics
    }
  },

  getMetricUnit(metric) {
    // Determine unit based on metric properties
    if (metric.unit) return metric.unit
    if (!metric.id) return 'count' // Safety check for undefined id
    
    const metricId = metric.id.toLowerCase()
    if (metricId === 'cost' || metricId.includes('value') || metricId.includes('revenue')) {
      return 'currency'
    }
    if (metricId === 'frequency' || metricId.includes('rate') || metricId.includes('ratio')) {
      return 'ratio'
    }
    return 'count'
  },

  autoSelectDefaultMetrics() {
    const defaultMetricIds = ['cost', 'clicks', 'impressions']
    const defaultMetrics = this.availableMetrics.filter(m => 
      defaultMetricIds.includes(m.id)
    )
    
    if (defaultMetrics.length > 0) {
      this.selectedMetrics = defaultMetrics
      console.log('✅ Auto-selected default metrics:', defaultMetrics.map(m => m.name).join(', '))
    }
  },

  async generateReport(customization = null) {
    try {
      console.log('🔍 Generating comprehensive report...')
      
      // Validate required data
      if (!this.isReadyForGeneration()) {
        throw new Error('Missing required data for report generation')
      }
      
      const config = {
        reportType: this.reportType,
        team: this.selectedTeam,
        platform: this.selectedPlatform?.id || this.selectedPlatform?.name,
        accountIds: this.selectedAdAccounts.map(acc => acc.id),
        campaignIds: this.selectedCampaigns.map(camp => camp.id),
        adSetIds: this.selectedAdSets.map(adSet => adSet.id),
        metrics: this.selectedMetrics.map(metric => metric.id),
        dateRange: {
          start: this.dateRange.startDate,
          end: this.dateRange.endDate
        },
        unified: this.unifiedReports
      }

      // Get data from API
      console.log('🔗 Requesting report data from API...')
      const apiResponse = await apiService.generateReport(config)
      
      // Handle different API response formats for report generation
      let reportData = null
      if (apiResponse.success && apiResponse.data) {
        if (Array.isArray(apiResponse.data)) {
          reportData = apiResponse.data
        } else if (apiResponse.data.rows && Array.isArray(apiResponse.data.rows)) {
          reportData = apiResponse.data.rows
        } else if (typeof apiResponse.data === 'object') {
          console.log('🔍 Report API response structure:', apiResponse.data)
          console.log('🔍 Report API response keys:', Object.keys(apiResponse.data))
          
          // Try to find array data in nested structure
          if (apiResponse.data.data && Array.isArray(apiResponse.data.data)) {
            reportData = apiResponse.data.data
            console.log('🔍 Found nested report data array with', reportData.length, 'rows')
          } else {
            console.error('❌ Report API data is an object but contains no array. Structure:', JSON.stringify(apiResponse.data, null, 2))
            throw new Error('Report API returned data in unexpected format')
          }
        } else {
          console.error('❌ Report API data is not in expected array format')
          throw new Error('Report API returned data in unexpected format')
        }
      }

      if (!reportData || !Array.isArray(reportData)) {
        console.error('❌ API returned invalid report data format:', apiResponse)
        throw new Error('Invalid report data format received from API')
      }

      if (reportData.length === 0) {
        console.error('❌ API returned no report data')
        throw new Error('No report data available for the selected criteria')
      }

      console.log(`📊 Retrieved ${reportData.length} rows from API`)

      // Log the raw API data before processing
      console.log('🔍 Raw API data structure check:')
      console.log('- reportData type:', typeof reportData)
      console.log('- reportData is array:', Array.isArray(reportData))
      console.log('- reportData length:', reportData?.length)
      if (reportData?.length > 0) {
        console.log('- First row keys:', Object.keys(reportData[0]))
        console.log('- First row sample:', reportData[0])
        console.log('- Sample metric values from first few rows:')
        reportData.slice(0, 3).forEach((row, i) => {
          console.log(`  Row ${i}:`, {
            date: row.date,
            campaign: row.campaign,
            metric: row.metric,
            value: row.value,
            platform: row.platform
          })
        })
      }

      // Generate comprehensive report using ReportService
      const reportResult = await reportService.generateReport(config, reportData, customization)
      
      console.log(`✅ Comprehensive report generated with ${reportResult.data?.length || 0} rows`)
      console.log(`📈 Analytics calculated: ${Object.keys(reportResult.analytics || {}).length} sections`)
      if (reportResult.data?.length > 0) {
        console.log('🔍 Final processed data sample:', reportResult.data[0])
      }
      
      return reportResult
    } catch (error) {
      console.error('❌ Failed to generate comprehensive report:', error)
      throw error
    }
  },

  async generateReportPreview() {
    try {
      console.log('👀 Generating report preview...')
      
      // Validate required data
      if (!this.isReadyForPreview()) {
        throw new Error('Missing required data for report preview')
      }
      
      const config = {
        reportType: this.reportType,
        team: this.selectedTeam,
        platform: this.selectedPlatform?.id,
        accountIds: this.selectedAdAccounts.map(acc => acc.id),
        campaignIds: this.selectedCampaigns.map(camp => camp.id),
        adSetIds: this.selectedAdSets.map(adSet => adSet.id),
        metrics: this.selectedMetrics.map(metric => metric.id),
        dateRange: {
          start: this.dateRange.startDate,
          end: this.dateRange.endDate
        },
        unified: this.unifiedReports,
        preview: true,
        limit: 50 // Limit preview to 50 rows
      }

      const response = await apiService.generateReportPreview(config)
      
      // Handle different API response formats for preview
      let previewData = null
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          previewData = response.data
        } else if (response.data.rows && Array.isArray(response.data.rows)) {
          previewData = response.data.rows
        } else if (typeof response.data === 'object') {
          console.log('🔍 Preview API response structure:', response.data)
          console.log('🔍 Preview API response keys:', Object.keys(response.data))
          
          // Try to find array data in nested structure
          if (response.data.data && Array.isArray(response.data.data)) {
            previewData = response.data.data
            console.log('🔍 Found nested preview data array with', previewData.length, 'rows')
          } else {
            console.error('❌ Preview API data is an object but contains no array. Structure:', JSON.stringify(response.data, null, 2))
            throw new Error('Preview API returned data in unexpected format')
          }
        } else {
          console.error('❌ Preview API data is not in expected array format')
          throw new Error('Preview API returned data in unexpected format')
        }
      }

      if (!previewData || !Array.isArray(previewData)) {
        console.error('❌ Preview API returned invalid data format:', response)
        throw new Error('Invalid preview data format received from API')
      }

      if (previewData.length === 0) {
        console.error('❌ Preview API returned no data')
        throw new Error('No preview data available for the selected criteria')
      }
      
      console.log(`✅ Preview generated with ${previewData.length} rows`)
      // Return the processed response with the correct data format
      return {
        ...response,
        data: previewData
      }
    } catch (error) {
      console.error('❌ Failed to generate preview:', error)
      throw error
    }
  },

  isReadyForPreview() {
    return (
      this.selectedTeam &&
      this.selectedPlatform &&
      this.selectedAdAccounts.length > 0 &&
      this.selectedCampaigns.length > 0 &&
      this.selectedMetrics.length >= 1
    )
  },

  isReadyForGeneration() {
    return (
      this.isReadyForPreview() &&
      this.dateRange.startDate &&
      this.dateRange.endDate &&
      this.selectedMetrics.length >= 3
    )
  },

  async exportReport(format = 'pdf', customization = null) {
    try {
      console.log(`📊 Exporting professional ${format.toUpperCase()} report...`)
      
      if (!this.isReadyForGeneration()) {
        throw new Error('Missing required data for report export')
      }
      
      const config = {
        reportType: this.reportType,
        team: this.selectedTeam,
        platform: this.selectedPlatform?.id || this.selectedPlatform?.name,
        accountIds: this.selectedAdAccounts.map(acc => acc.id),
        campaignIds: this.selectedCampaigns.map(camp => camp.id),
        adSetIds: this.selectedAdSets.map(adSet => adSet.id),
        metrics: this.selectedMetrics.map(metric => metric.id),
        dateRange: {
          start: this.dateRange.startDate,
          end: this.dateRange.endDate
        },
        unified: this.unifiedReports,
        format: format
      }

      // First, generate the comprehensive report data
      const reportData = await this.generateReport(customization)
      
      // Then generate the specific format
      if (format.toLowerCase() === 'pdf') {
        const pdfDoc = await reportService.generatePDFReport(reportData, config)
        const pdfBlob = pdfDoc.output('blob')
        const pdfUrl = URL.createObjectURL(pdfBlob)
        
        return {
          success: true,
          downloadUrl: pdfUrl,
          filename: `reporte_marketing_${new Date().toISOString().split('T')[0]}.pdf`,
          message: 'Reporte PDF profesional generado exitosamente'
        }
      } else if (format.toLowerCase() === 'excel') {
        const workbook = await reportService.generateExcelReport(reportData, config)
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
        const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const excelUrl = URL.createObjectURL(excelBlob)
        
        return {
          success: true,
          downloadUrl: excelUrl,
          filename: `reporte_marketing_${new Date().toISOString().split('T')[0]}.xlsx`,
          message: 'Reporte Excel profesional generado exitosamente'
        }
      }
      
      throw new Error(`Formato de exportación no soportado: ${format}`)
    } catch (error) {
      console.error(`❌ Failed to export professional ${format} report:`, error)
      throw error
    }
  },


  calculateDateRangeDays() {
    if (!this.dateRange.startDate || !this.dateRange.endDate) return 1
    const start = new Date(this.dateRange.startDate)
    const end = new Date(this.dateRange.endDate)
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  },


  async loadCampaignActiveDates(campaignIds, forceRefresh = false) {
    try {
      // Clear existing dates if force refresh
      if (forceRefresh) {
        this.campaignActiveDates = {}
      }
      
      console.log('📅 Extracting active dates from campaign data...')
      const activeDates = await this.extractActiveDatesFromData(campaignIds)
      
      if (activeDates && Object.keys(activeDates).length > 0) {
        this.campaignActiveDates = activeDates
        console.log(`✅ Extracted active dates for ${Object.keys(this.campaignActiveDates).length} campaigns`)
        return this.campaignActiveDates
      } else {
        console.error('❌ No active dates found for campaigns:', campaignIds)
        this.campaignActiveDates = {}
        throw new Error('No active dates available for selected campaigns')
      }
    } catch (error) {
      console.error('❌ Failed to load campaign active dates:', error.message)
      this.campaignActiveDates = {}
      throw error
    }
  },

  async extractActiveDatesFromData(campaignIds) {
    try {
      // Create a basic config to query data for these campaigns
      const config = {
        reportType: this.reportType || 'simple',
        team: this.selectedTeam,
        platform: this.selectedPlatform?.id || this.selectedPlatform?.name,
        accountIds: this.selectedAdAccounts.map(acc => acc.id),
        campaignIds: campaignIds,
        adSetIds: this.selectedAdSets.map(adSet => adSet.id),
        metrics: ['cost', 'clicks', 'impressions'], // Basic metrics to check data availability
        startDate: this.getDateMonthsAgo(6), // Look back 6 months
        endDate: new Date().toISOString().split('T')[0], // Until today
        unified: this.unifiedReports,
        groupBy: 'date',
        extractDates: true // Flag to indicate we want to extract dates
      }
      
      console.log('📅 Date extraction config:', {
        team: config.team,
        platform: config.platform,
        campaignIds: config.campaignIds,
        dateRange: `${config.startDate} to ${config.endDate}`
      })

      // Try to get data from API
      console.log('🔗 Requesting campaign data from API...')
      const dataResponse = await apiService.generateReport(config)

      // Handle different API response formats
      let actualData = null
      if (dataResponse.success && dataResponse.data) {
        // Check if data is already an array or needs to be extracted
        if (Array.isArray(dataResponse.data)) {
          actualData = dataResponse.data
        } else if (dataResponse.data.rows && Array.isArray(dataResponse.data.rows)) {
          actualData = dataResponse.data.rows
        } else if (typeof dataResponse.data === 'object') {
          // Log the actual structure to understand the API response
          console.log('🔍 API response structure:', dataResponse.data)
          console.log('🔍 API response keys:', Object.keys(dataResponse.data))
          
          // Try to find array data in nested structure
          if (dataResponse.data.data && Array.isArray(dataResponse.data.data)) {
            actualData = dataResponse.data.data
            console.log('🔍 Found nested data array with', actualData.length, 'rows')
          } else {
            console.error('❌ API data is an object but contains no array. Structure:', JSON.stringify(dataResponse.data, null, 2))
            throw new Error('API returned data in unexpected format. Cannot extract campaign dates.')
          }
        }
      }

      if (!actualData || !Array.isArray(actualData)) {
        console.error('❌ API returned invalid data format:', dataResponse)
        throw new Error('Invalid data format received from API')
      }

      if (actualData.length === 0) {
        console.error('❌ API returned no data for campaigns:', campaignIds)
        throw new Error('No data available for selected campaigns')
      }

      console.log(`📊 Processing ${actualData.length} rows for date extraction`)

      // Extract dates from actual data
      const campaignDates = {}
      
      campaignIds.forEach(campaignId => {
        // Find all data rows for this campaign - handle both campaign name and ID matching
        const campaignRows = actualData.filter(row => 
          row.campaign === campaignId || 
          row.campaign_id === campaignId || 
          row.campaignId === campaignId ||
          row.campaign_name === campaignId
        )
        
        if (campaignRows.length > 0) {
          console.log(`📅 Found ${campaignRows.length} data rows for campaign ${campaignId}`)
          
          // Log first few rows to understand the data structure
          console.log('🔍 Sample rows for debugging:', campaignRows.slice(0, 2))
          
          // Extract unique dates from BigQuery long format data
          const rawDates = campaignRows.map(row => row.date || row.fecha)
          console.log('📅 Raw dates found:', rawDates.slice(0, 5))
          
          const dates = rawDates
            .filter(date => date) // Remove null/undefined dates
            .map(date => {
              try {
                // Handle different date formats
                let dateValue = date
                
                // Handle BigQuery date objects with {value: 'YYYY-MM-DD'} format
                if (typeof date === 'object' && date !== null && date.value) {
                  console.log('🔍 Found BigQuery date object, extracting value:', date.value)
                  dateValue = date.value
                }
                
                if (typeof dateValue === 'string') {
                  // If it's already in YYYY-MM-DD format
                  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                    return dateValue
                  }
                  // If it has time component, remove it
                  if (dateValue.includes('T')) {
                    return dateValue.split('T')[0]
                  }
                  // Try to parse as date string
                  const parsed = new Date(dateValue)
                  if (!isNaN(parsed.getTime())) {
                    return parsed.toISOString().split('T')[0]
                  }
                }
                // Handle Date objects
                if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
                  return dateValue.toISOString().split('T')[0]
                }
                // Handle timestamp numbers
                if (typeof dateValue === 'number') {
                  const dateObj = new Date(dateValue)
                  if (!isNaN(dateObj.getTime())) {
                    return dateObj.toISOString().split('T')[0]
                  }
                }
                console.warn('⚠️ Unrecognized date format after processing:', dateValue, typeof dateValue)
                return null
              } catch (error) {
                console.error('❌ Error parsing date:', date, error.message)
                return null
              }
            })
            .filter(date => date !== null) // Remove failed parsing attempts
            .filter((date, index, array) => array.indexOf(date) === index) // Remove duplicates
            .sort()
          
          console.log(`📅 Successfully extracted ${dates.length} unique dates for campaign ${campaignId}:`, dates.slice(0, 3), dates.length > 3 ? '...' : '')

          if (dates.length > 0) {
            campaignDates[campaignId] = {
              campaignId,
              startDate: dates[0],
              endDate: dates[dates.length - 1],
              activeDates: dates,
              totalDays: dates.length
            }
            console.log(`✅ Campaign ${campaignId} has data from ${dates[0]} to ${dates[dates.length - 1]} (${dates.length} days)`)
          } else {
            console.warn(`⚠️ No valid dates found for campaign ${campaignId} after parsing`)
          }
        }
      })

      if (Object.keys(campaignDates).length === 0) {
        console.error('❌ No dates could be extracted from campaign data')
        throw new Error('No valid dates found in campaign data')
      }

      console.log(`✅ Successfully extracted dates for ${Object.keys(campaignDates).length} campaigns`)
      return campaignDates
    } catch (error) {
      console.error('❌ Error extracting dates from data:', error.message)
      throw error
    }
  },

  getDateMonthsAgo(months) {
    const date = new Date()
    date.setMonth(date.getMonth() - months)
    return date.toISOString().split('T')[0]
  },

  getAvailableDateRange() {
    if (Object.keys(this.campaignActiveDates).length === 0) {
      return { startDate: null, endDate: null, availableDates: [] }
    }

    // Find the overall date range across all selected campaigns
    let earliestStart = null
    let latestEnd = null
    const allAvailableDates = new Set()

    Object.values(this.campaignActiveDates).forEach(campaign => {
      if (!earliestStart || campaign.startDate < earliestStart) {
        earliestStart = campaign.startDate
      }
      if (!latestEnd || campaign.endDate > latestEnd) {
        latestEnd = campaign.endDate
      }
      
      campaign.activeDates.forEach(date => allAvailableDates.add(date))
    })

    return {
      startDate: earliestStart,
      endDate: latestEnd,
      availableDates: Array.from(allAvailableDates).sort()
    }
  },

  validateDateRange(startDate, endDate) {
    const availableRange = this.getAvailableDateRange()
    
    if (!availableRange.availableDates.length) {
      return { valid: false, message: 'No hay fechas disponibles para las campañas seleccionadas' }
    }

    const isStartValid = availableRange.availableDates.includes(startDate)
    const isEndValid = availableRange.availableDates.includes(endDate)
    
    if (!isStartValid) {
      return { valid: false, message: `La fecha de inicio ${startDate} no tiene datos disponibles` }
    }
    
    if (!isEndValid) {
      return { valid: false, message: `La fecha de fin ${endDate} no tiene datos disponibles` }
    }

    return { valid: true, message: 'Rango de fechas válido' }
  },

  async testApiConnection() {
    try {
      const result = await apiService.testConnection()
      console.log('🔗 API Connection Test:', result.connected ? '✅ Connected' : '❌ Failed')
      return result
    } catch (error) {
      console.error('❌ API connection test failed:', error)
      return { connected: false, error: error.message }
    }
  }
})