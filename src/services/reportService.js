import * as XLSX from 'xlsx'
import { OnePagePDFGenerator } from './onePagePdfGenerator'

class ReportService {
  constructor() {
    this.reportTemplates = {
      executive: 'Reporte Ejecutivo',
      detailed: 'Reporte Detallado',
      comparison: 'Reporte Comparativo'
    }
  }

  /**
   * Generate a comprehensive report based on configuration
   */
  async generateReport(config, data, customization = null) {
    console.log('🔄 Generating comprehensive report...')
    
    const reportData = this.processReportData(data, config)
    const analytics = this.calculateAnalytics(reportData, config, customization)
    
    return {
      success: true,
      data: reportData,
      analytics: analytics,
      customization: customization,
      metadata: {
        generatedAt: new Date().toISOString(),
        config: config,
        totalRows: reportData.length,
        dateRange: `${config.dateRange.start} - ${config.dateRange.end}`,
        campaigns: config.campaignIds?.length || 0,
        metrics: config.metrics?.length || 0
      }
    }
  }

  /**
   * Process and structure report data
   */
  processReportData(rawData, config) {
    console.log('🔄 Starting processReportData with:', {
      dataType: typeof rawData,
      isArray: Array.isArray(rawData),
      length: rawData?.length,
      configMetrics: config?.metrics
    })

    // Validate rawData is an array
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      console.error('❌ No valid raw data provided for report generation')
      throw new Error('No data available for report generation. Please check your date range and campaign selection.')
    }

    // Log sample of raw data to understand structure
    console.log('🔍 Raw data sample (first 3 rows):', rawData.slice(0, 3))
    
    // Data from BigQuery is now always in wide format
    console.log('📊 Processing wide format data from BigQuery')
    const processedData = rawData
    
    console.log(`🔄 Processed data: ${processedData.length} rows`)
    if (processedData.length > 0) {
      console.log('🔍 Processed data sample:', processedData[0])
    }
    
    // Add calculated fields to processed data
    const enrichedData = processedData.map(row => {
      const cost = parseFloat(row.cost) || 0
      const clicks = parseFloat(row.clicks) || 0
      const impressions = parseFloat(row.impressions) || 0
      const revenue = parseFloat(row.revenue) || 0

      return {
        ...row,
        // Ensure numeric fields are numbers
        cost,
        clicks,
        impressions,
        revenue,
        // Add calculated fields
        ctr: clicks && impressions ? ((clicks / impressions) * 100).toFixed(2) : '0.00',
        cpc: clicks && cost ? (cost / clicks).toFixed(2) : '0.00',
        cpm: impressions && cost ? ((cost / impressions) * 1000).toFixed(2) : '0.00',
        roas: revenue && cost ? (revenue / cost).toFixed(2) : '0.00'
      }
    })

    console.log('✅ Data processing complete:', {
      inputRows: rawData.length,
      outputRows: enrichedData.length,
      sampleCalculations: enrichedData[0] ? {
        cost: enrichedData[0].cost,
        clicks: enrichedData[0].clicks,
        ctr: enrichedData[0].ctr,
        cpc: enrichedData[0].cpc
      } : 'No data'
    })

    return enrichedData
  }

  /**
   * Convert BigQuery long format to wide format for report processing
   * Long format: [{date, campaign, metric, value}, ...]
   * Wide format: [{date, campaign, cost, clicks, impressions, ...}, ...]
   */
  convertLongToWideFormat(longFormatData) {
    console.log('🔄 Converting BigQuery unified_data long format to wide format...')
    console.log(`📊 Input: ${longFormatData.length} rows`)
    
    if (longFormatData.length === 0) {
      console.warn('⚠️ No data to convert')
      return []
    }
    
    // Log structure of first row to understand data format
    const firstRow = longFormatData[0]
    console.log('🔍 First row fields:', Object.keys(firstRow))
    console.log('🔍 First row sample:', firstRow)
    
    // Validate required fields exist
    const requiredFields = ['date', 'campaign', 'metric', 'value']
    const missingFields = requiredFields.filter(field => !(field in firstRow))
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields)
      throw new Error(`Data missing required fields: ${missingFields.join(', ')}`)
    }
    
    // Group by unique combination of date, campaign, account, platform  
    const grouped = {}
    let successfulRows = 0
    let skippedRows = 0
    
    longFormatData.forEach((row, index) => {
      // Extract fields from unified_data table structure
      const dateValue = row.date
      const campaignName = row.campaign
      const accountId = row.account
      const accountName = row.account_name
      const platform = row.platform
      const team = row.team
      const metricName = row.metric
      const metricValue = row.value
      
      // Skip rows with missing essential data
      if (!dateValue || !campaignName || !metricName || metricValue === null || metricValue === undefined) {
        if (index < 10) {
          console.log(`⚠️ Skipping row ${index} - missing data:`, {
            date: dateValue,
            campaign: campaignName,
            metric: metricName,
            value: metricValue
          })
        }
        skippedRows++
        return
      }
      
      // Create unique key for grouping
      const key = `${dateValue}_${campaignName}_${accountId || 'unknown'}_${platform || 'unknown'}`
      
      // Initialize group if it doesn't exist
      if (!grouped[key]) {
        grouped[key] = {
          date: dateValue,
          campaign: campaignName,
          account: accountId,
          account_name: accountName,
          platform: platform,
          team: team
        }
        
        if (Object.keys(grouped).length <= 3) {
          console.log(`🔍 Created group ${Object.keys(grouped).length}:`, grouped[key])
        }
      }
      
      // Add metric value to the grouped record
      const numericValue = parseFloat(metricValue)
      if (!isNaN(numericValue)) {
        grouped[key][metricName] = numericValue
        successfulRows++
        
        if (successfulRows <= 10) {
          console.log(`🔍 Added metric: ${metricName} = ${numericValue} (row ${index})`)
        }
      } else {
        console.warn(`⚠️ Invalid numeric value for ${metricName}:`, metricValue)
        skippedRows++
      }
    })
    
    const result = Object.values(grouped)
    
    // Log conversion results
    console.log('✅ Conversion complete:', {
      inputRows: longFormatData.length,
      outputRows: result.length,
      successfulRows,
      skippedRows,
      groupsCreated: Object.keys(grouped).length
    })
    
    // Log sample of converted data
    if (result.length > 0) {
      const sampleRow = result[0]
      const metricFields = Object.keys(sampleRow).filter(key => 
        !['date', 'campaign', 'account', 'account_name', 'platform', 'team'].includes(key)
      )
      console.log('🔍 Sample converted row:', sampleRow)
      console.log('🔍 Metrics found:', metricFields)
      console.log('🔍 Sample metric values:', metricFields.reduce((acc, field) => {
        acc[field] = sampleRow[field]
        return acc
      }, {}))
    }
    
    return result
  }

  /**
   * Calculate comprehensive analytics
   */
  calculateAnalytics(data, config, customization = null) {
    if (!data || data.length === 0) return {}

    const analytics = {
      summary: this.calculateSummaryMetrics(data),
      trends: this.calculateTrends(data),
      performance: this.calculatePerformanceMetrics(data),
      cards: customization ? this.calculateCardMetrics(data, customization.selectedCardMetrics) : {},
      chart: customization ? this.calculateChartData(data, customization.chartMetrics, customization.chartType) : {}
    }

    return analytics
  }

  calculateSummaryMetrics(data) {
    console.log('🔄 Calculating summary metrics from', data.length, 'rows')
    
    if (!data || data.length === 0) {
      console.warn('⚠️ No data provided for summary calculation')
      return this.getEmptySummary()
    }

    // Log sample data to understand structure
    console.log('🔍 Sample data for calculation:', data[0])

    const totals = data.reduce((acc, row) => {
      const cost = parseFloat(row.cost) || 0
      const clicks = parseInt(row.clicks) || 0
      const impressions = parseInt(row.impressions) || 0
      const conversions = parseInt(row.purchases || row.conversions) || 0
      const revenue = parseFloat(row.revenue) || 0

      acc.cost += cost
      acc.clicks += clicks
      acc.impressions += impressions
      acc.conversions += conversions
      acc.revenue += revenue

      return acc
    }, { cost: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0 })

    console.log('🔍 Calculated totals:', totals)

    const summary = {
      totalCost: totals.cost.toFixed(2),
      totalClicks: totals.clicks,
      totalImpressions: totals.impressions,
      totalConversions: totals.conversions,
      totalRevenue: totals.revenue.toFixed(2),
      averageCTR: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) : '0.00',
      averageCPC: totals.clicks > 0 ? (totals.cost / totals.clicks).toFixed(2) : '0.00',
      averageCPM: totals.impressions > 0 ? ((totals.cost / totals.impressions) * 1000).toFixed(2) : '0.00',
      roas: totals.cost > 0 ? (totals.revenue / totals.cost).toFixed(2) : '0.00'
    }

    console.log('✅ Summary metrics calculated:', summary)
    return summary
  }

  getEmptySummary() {
    return {
      totalCost: '0.00',
      totalClicks: 0,
      totalImpressions: 0,
      totalConversions: 0,
      totalRevenue: '0.00',
      averageCTR: '0.00',
      averageCPC: '0.00',
      averageCPM: '0.00',
      roas: '0.00'
    }
  }

  calculateTrends(data) {
    // Group by date for trend analysis
    const dateGroups = data.reduce((acc, row) => {
      const date = row.fecha || row.date
      if (!acc[date]) {
        acc[date] = { cost: 0, clicks: 0, impressions: 0, conversions: 0 }
      }
      acc[date].cost += parseFloat(row.cost || 0)
      acc[date].clicks += parseInt(row.clicks || 0)
      acc[date].impressions += parseInt(row.impressions || 0)
      acc[date].conversions += parseInt(row.purchases || row.conversions || 0)
      return acc
    }, {})

    const dates = Object.keys(dateGroups).sort()
    const trends = dates.map(date => ({
      date,
      ...dateGroups[date],
      ctr: dateGroups[date].impressions > 0 ? 
        ((dateGroups[date].clicks / dateGroups[date].impressions) * 100).toFixed(2) : '0.00'
    }))

    return {
      daily: trends,
      bestDay: trends.reduce((best, day) => 
        parseFloat(day.cost) > parseFloat(best.cost) ? day : best, trends[0] || {}),
      worstDay: trends.reduce((worst, day) => 
        parseFloat(day.cost) < parseFloat(worst.cost) ? day : worst, trends[0] || {})
    }
  }

  calculatePerformanceMetrics(data) {
    const campaigns = data.reduce((acc, row) => {
      const campaign = row.campaign_name || row.campaignName
      if (!acc[campaign]) {
        acc[campaign] = { cost: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0 }
      }
      acc[campaign].cost += parseFloat(row.cost || 0)
      acc[campaign].clicks += parseInt(row.clicks || 0)
      acc[campaign].impressions += parseInt(row.impressions || 0)
      acc[campaign].conversions += parseInt(row.purchases || row.conversions || 0)
      acc[campaign].revenue += parseFloat(row.revenue || 0)
      return acc
    }, {})

    const campaignPerformance = Object.entries(campaigns).map(([name, metrics]) => ({
      campaign: name,
      ...metrics,
      ctr: metrics.impressions > 0 ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2) : '0.00',
      cpc: metrics.clicks > 0 ? (metrics.cost / metrics.clicks).toFixed(2) : '0.00',
      roas: metrics.cost > 0 ? (metrics.revenue / metrics.cost).toFixed(2) : '0.00'
    }))

    return {
      byCampaign: campaignPerformance,
      topPerformer: campaignPerformance.reduce((top, campaign) => 
        parseFloat(campaign.roas) > parseFloat(top.roas || 0) ? campaign : top, {}),
      bottomPerformer: campaignPerformance.reduce((bottom, campaign) => 
        parseFloat(campaign.roas) < parseFloat(bottom.roas || Infinity) ? campaign : bottom, {})
    }
  }

  generateRecommendations(data, config) {
    const analytics = this.calculateSummaryMetrics(data)
    const recommendations = []

    // CTR recommendations
    if (parseFloat(analytics.averageCTR) < 1.0) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        title: 'Mejorar CTR',
        description: `Tu CTR promedio de ${analytics.averageCTR}% está por debajo del benchmark. Considera optimizar tus creativos y texto de anuncios.`,
        action: 'Prueba nuevas creatividades y mensajes más atractivos'
      })
    }

    // Cost recommendations
    if (parseFloat(analytics.averageCPC) > 2.0) {
      recommendations.push({
        type: 'cost',
        priority: 'medium',
        title: 'Optimizar CPC',
        description: `Tu CPC promedio de $${analytics.averageCPC} es alto. Revisa tus palabras clave y audiencias.`,
        action: 'Refina el targeting y considera ajustar pujas'
      })
    }

    // ROAS recommendations
    if (parseFloat(analytics.roas) < 3.0) {
      recommendations.push({
        type: 'revenue',
        priority: 'high',
        title: 'Mejorar ROAS',
        description: `Tu ROAS de ${analytics.roas}x necesita mejora. Enfócate en conversiones de mayor valor.`,
        action: 'Optimiza el embudo de conversión y mejora la landing page'
      })
    }

    return recommendations
  }

  /**
   * Calculate metrics for cards display
   */
  calculateCardMetrics(data, selectedCardMetrics) {
    if (!selectedCardMetrics || selectedCardMetrics.length === 0) return {}

    const totals = data.reduce((acc, row) => {
      acc.cost += parseFloat(row.cost || 0)
      acc.clicks += parseInt(row.clicks || 0)
      acc.impressions += parseInt(row.impressions || 0)
      acc.conversions += parseInt(row.purchases || row.conversions || 0)
      acc.revenue += parseFloat(row.revenue || 0)
      acc.reach += parseInt(row.reach || 0)
      acc.frequency += parseFloat(row.frequency || 0)
      return acc
    }, { cost: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0, reach: 0, frequency: 0 })

    const cardData = {}

    selectedCardMetrics.forEach(metricId => {
      switch (metricId) {
        case 'cost':
          cardData[metricId] = {
            value: totals.cost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
            trend: this.calculateTrend(data, 'cost'),
            format: 'currency'
          }
          break
        case 'clicks':
          cardData[metricId] = {
            value: totals.clicks.toLocaleString('es-ES'),
            trend: this.calculateTrend(data, 'clicks'),
            format: 'number'
          }
          break
        case 'impressions':
          cardData[metricId] = {
            value: totals.impressions.toLocaleString('es-ES'),
            trend: this.calculateTrend(data, 'impressions'),
            format: 'number'
          }
          break
        case 'purchases':
        case 'conversions':
          cardData[metricId] = {
            value: totals.conversions.toLocaleString('es-ES'),
            trend: this.calculateTrend(data, 'purchases'),
            format: 'number'
          }
          break
        case 'revenue':
          cardData[metricId] = {
            value: totals.revenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
            trend: this.calculateTrend(data, 'revenue'),
            format: 'currency'
          }
          break
        case 'reach':
          cardData[metricId] = {
            value: totals.reach.toLocaleString('es-ES'),
            trend: this.calculateTrend(data, 'reach'),
            format: 'number'
          }
          break
        case 'frequency':
          const avgFrequency = data.length > 0 ? (totals.frequency / data.length).toFixed(2) : '0.00'
          cardData[metricId] = {
            value: avgFrequency,
            trend: this.calculateTrend(data, 'frequency'),
            format: 'decimal'
          }
          break
        default:
          // Handle any other metrics
          const rawValue = totals[metricId] || 0
          cardData[metricId] = {
            value: rawValue.toLocaleString('es-ES'),
            trend: this.calculateTrend(data, metricId),
            format: 'number'
          }
      }
    })

    return cardData
  }

  /**
   * Calculate chart data for visualization
   */
  calculateChartData(data, chartMetrics, chartType) {
    if (!chartMetrics || chartMetrics.length === 0) return {}

    // Group data by date for time series
    const dateGroups = data.reduce((acc, row) => {
      const date = row.fecha || row.date
      if (!acc[date]) {
        acc[date] = { cost: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0, reach: 0, frequency: 0 }
      }
      acc[date].cost += parseFloat(row.cost || 0)
      acc[date].clicks += parseInt(row.clicks || 0)
      acc[date].impressions += parseInt(row.impressions || 0)
      acc[date].conversions += parseInt(row.purchases || row.conversions || 0)
      acc[date].revenue += parseFloat(row.revenue || 0)
      acc[date].reach += parseInt(row.reach || 0)
      acc[date].frequency += parseFloat(row.frequency || 0)
      return acc
    }, {})

    const dates = Object.keys(dateGroups).sort()
    const series = []

    chartMetrics.forEach((metricId, index) => {
      const metricData = dates.map(date => ({
        x: date,
        y: dateGroups[date][metricId] || 0
      }))

      series.push({
        name: this.getMetricDisplayName(metricId),
        data: metricData,
        color: this.getSeriesColor(index)
      })
    })

    return {
      type: chartType,
      series: series,
      categories: dates,
      metrics: chartMetrics
    }
  }

  /**
   * Calculate trend for a metric (simplified)
   */
  calculateTrend(data, metricId) {
    if (data.length < 2) return { direction: 'neutral', percentage: 0 }

    const sortedData = data.sort((a, b) => new Date(a.fecha || a.date) - new Date(b.fecha || b.date))
    const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2))
    const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2))

    const firstValue = firstHalf.reduce((sum, row) => sum + parseFloat(row[metricId] || 0), 0) / firstHalf.length
    const secondValue = secondHalf.reduce((sum, row) => sum + parseFloat(row[metricId] || 0), 0) / secondHalf.length

    if (firstValue === 0) return { direction: 'neutral', percentage: 0 }

    const percentage = ((secondValue - firstValue) / firstValue) * 100
    const direction = percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'neutral'

    return {
      direction,
      percentage: Math.abs(percentage).toFixed(1)
    }
  }

  /**
   * Get display name for metrics
   */
  getMetricDisplayName(metricId) {
    const names = {
      cost: 'Costo',
      clicks: 'Clics',
      impressions: 'Impresiones',
      purchases: 'Compras',
      conversions: 'Conversiones',
      revenue: 'Ingresos',
      reach: 'Alcance',
      frequency: 'Frecuencia'
    }
    return names[metricId] || metricId
  }

  /**
   * Get color for chart series
   */
  getSeriesColor(index) {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
    return colors[index % colors.length]
  }


  /**
   * Generate professional PDF report
   */
  async generatePDFReport(reportData, config) {
    console.log('📄 Generating one-page PDF report...')
    
    const generator = new OnePagePDFGenerator()
    const doc = await generator.generate(reportData, config)
    return doc
  }

  /**
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    }
    const contentWidth = pageWidth - margins.left - margins.right
    const contentHeight = pageHeight - margins.top - margins.bottom
    
    let yPosition = margins.top

    // Header Section with improved spacing
    yPosition = this.addProfessionalHeader(doc, customization, margins, contentWidth, yPosition, accentColor)
    yPosition += 20

    // Date range info with better styling
    this.addDateInfo(doc, config, margins, contentWidth, yPosition, accentColor)
    yPosition += 25

    // Metric Cards Section with Bootstrap-like grid
    if (reportData.analytics?.cards && Object.keys(reportData.analytics.cards).length > 0) {
      yPosition = this.addProfessionalMetricCards(doc, reportData.analytics.cards, customization, margins, contentWidth, yPosition, accentColor)
      yPosition += 20
    }

    // Chart Section with proper sizing
    if (reportData.analytics?.chart && reportData.analytics.chart.metrics?.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        doc.addPage()
        yPosition = margins.top
      }
      yPosition = this.addProfessionalChartSection(doc, reportData.analytics.chart, customization, margins, contentWidth, yPosition, accentColor)
      yPosition += 20
    }

    // Campaign Performance Table
    if (reportData.data && reportData.data.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 120) {
        doc.addPage()
        yPosition = margins.top
      }
      yPosition = this.addCampaignDataTable(doc, reportData.data, config, margins, contentWidth, yPosition, accentColor)
      yPosition += 20
    }

    // Performance summary (replacing executive brief)
    if (reportData.analytics?.summary) {
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = margins.top
      }
      yPosition = this.addPerformanceSummary(doc, reportData.analytics.summary, margins, contentWidth, yPosition, accentColor)
    }

    return doc
  }

  /**
   * Add professional header with proper spacing
   */
  addProfessionalHeader(doc, customization, margins, contentWidth, yPosition, accentColor) {
    const startY = yPosition

    // Header container with subtle background
    doc.setFillColor(250, 250, 250)
    doc.rect(margins.left, yPosition, contentWidth, 45, 'F')

    // Logo section (left side)
    if (customization.logoPreview) {
      // Logo placeholder with better styling
      doc.setFillColor(255, 255, 255)
      doc.rect(margins.left + 10, yPosition + 10, 30, 25, 'F')
      doc.setDrawColor(220, 220, 220)
      doc.rect(margins.left + 10, yPosition + 10, 30, 25, 'S')
      
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('LOGO', margins.left + 25, yPosition + 24, { align: 'center' })
    }

    // Title and subtitle section
    const textStartX = customization.logoPreview ? margins.left + 50 : margins.left + 10
    
    // Title
    doc.setFontSize(22)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(accentColor.r, accentColor.g, accentColor.b)
    doc.text(customization.title || 'Reporte de Marketing Digital', textStartX, yPosition + 18)

    // Subtitle
    doc.setFontSize(12)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(customization.subtitle || 'Análisis de Campañas Publicitarias', textStartX, yPosition + 28)

    // Client name (right aligned)
    if (customization.clientName) {
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(60, 60, 60)
      doc.text(customization.clientName, margins.left + contentWidth - 10, yPosition + 38, { align: 'right' })
    }

    return startY + 45
  }

  /**
   * Add date information with better styling
   */
  addDateInfo(doc, config, margins, contentWidth, yPosition, accentColor) {
    // Date range container
    doc.setFillColor(accentColor.r, accentColor.g, accentColor.b)
    doc.rect(margins.left, yPosition, contentWidth, 15, 'F')

    // Date text
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(255, 255, 255)
    const dateText = `Período de Análisis: ${this.formatDate(config.dateRange.start)} - ${this.formatDate(config.dateRange.end)}`
    doc.text(dateText, margins.left + contentWidth / 2, yPosition + 10, { align: 'center' })
  }

  /**
   * Add professional metric cards with Bootstrap-like grid
   */
  addProfessionalMetricCards(doc, cardsData, customization, margins, contentWidth, yPosition, accentColor) {
    const cardMetrics = Object.keys(cardsData)
    if (cardMetrics.length === 0) return yPosition

    const startY = yPosition

    // Section title with better styling
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text('Métricas Principales', margins.left, yPosition)
    yPosition += 20

    // Bootstrap-inspired grid system
    const cardsPerRow = Math.min(3, cardMetrics.length)
    const gutterWidth = 8
    const cardWidth = (contentWidth - (cardsPerRow - 1) * gutterWidth) / cardsPerRow
    const cardHeight = 40

    cardMetrics.forEach((metricId, index) => {
      const cardData = cardsData[metricId]
      const row = Math.floor(index / cardsPerRow)
      const col = index % cardsPerRow
      const x = margins.left + col * (cardWidth + gutterWidth)
      const y = yPosition + row * (cardHeight + 12)

      // Card shadow (subtle)
      doc.setFillColor(230, 230, 230)
      doc.roundedRect(x + 1, y + 1, cardWidth, cardHeight, 2, 2, 'F')

      // Card background
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F')

      // Card border
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.5)
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S')

      // Accent left border
      doc.setFillColor(accentColor.r, accentColor.g, accentColor.b)
      doc.rect(x, y, 3, cardHeight, 'F')

      // Metric name
      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(100, 100, 100)
      const metricName = this.getMetricDisplayName(metricId)
      doc.text(metricName, x + 8, y + 12)

      // Metric value with better formatting
      doc.setFontSize(18)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(40, 40, 40)
      const value = this.formatMetricValue(cardData.value, cardData.format)
      doc.text(value, x + 8, y + 28)

      // Trend indicator with better positioning
      if (cardData.trend) {
        const trendIcon = cardData.trend.direction === 'up' ? '↗' : cardData.trend.direction === 'down' ? '↘' : '→'
        const trendColor = cardData.trend.direction === 'up' ? [16, 185, 129] : cardData.trend.direction === 'down' ? [239, 68, 68] : [107, 114, 128]
        
        doc.setFontSize(9)
        doc.setFont(undefined, 'bold')
        doc.setTextColor(trendColor[0], trendColor[1], trendColor[2])
        doc.text(`${trendIcon} ${cardData.trend.percentage}%`, x + cardWidth - 6, y + 32, { align: 'right' })
      }
    })

    // Calculate final Y position with proper spacing
    const rows = Math.ceil(cardMetrics.length / cardsPerRow)
    return yPosition + rows * (cardHeight + 12)
  }

  /**
   * Add professional chart section with proper sizing
   */
  addProfessionalChartSection(doc, chartData, customization, margins, contentWidth, yPosition, accentColor) {
    const startY = yPosition

    // Section title
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text(`Análisis Visual - ${this.getChartTypeName(chartData.type)}`, margins.left, yPosition)
    yPosition += 20

    // Chart container with proper dimensions
    const chartHeight = 100
    const chartWidth = contentWidth

    // Chart background
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(margins.left, yPosition, chartWidth, chartHeight, 3, 3, 'F')

    // Chart border
    doc.setDrawColor(accentColor.r, accentColor.g, accentColor.b)
    doc.setLineWidth(1)
    doc.roundedRect(margins.left, yPosition, chartWidth, chartHeight, 3, 3, 'S')

    // Chart title inside container
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(60, 60, 60)
    doc.text(`Tendencia de Métricas - ${this.getChartTypeName(chartData.type)}`, margins.left + 10, yPosition + 15)

    // Chart visualization area
    const vizY = yPosition + 25
    const vizHeight = chartHeight - 35

    // Simple chart representation
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.5)
    
    // Grid lines (horizontal)
    for (let i = 0; i < 4; i++) {
      const gridY = vizY + (i * vizHeight / 3)
      doc.line(margins.left + 15, gridY, margins.left + chartWidth - 15, gridY)
    }

    // Draw simple trend lines for each metric
    chartData.metrics.forEach((metricId, index) => {
      const color = this.getSeriesColor(index)
      const rgb = this.hexToRgb(color)
      doc.setDrawColor(rgb.r, rgb.g, rgb.b)
      doc.setLineWidth(2)

      // Generate simple trend line
      const points = 10
      const startX = margins.left + 20
      const endX = margins.left + chartWidth - 20
      const stepX = (endX - startX) / (points - 1)

      for (let i = 0; i < points - 1; i++) {
        const x1 = startX + i * stepX
        const x2 = startX + (i + 1) * stepX
        const y1 = vizY + Math.random() * vizHeight
        const y2 = vizY + Math.random() * vizHeight
        doc.line(x1, y1, x2, y2)
      }
    })

    // Metrics legend
    const legendY = yPosition + chartHeight - 15
    doc.setFontSize(9)
    chartData.metrics.forEach((metricId, index) => {
      const color = this.getSeriesColor(index)
      const rgb = this.hexToRgb(color)
      const legendX = margins.left + 15 + (index * 80)

      // Legend color dot
      doc.setFillColor(rgb.r, rgb.g, rgb.b)
      doc.circle(legendX, legendY - 1, 2, 'F')

      // Legend text
      doc.setTextColor(60, 60, 60)
      doc.text(this.getMetricDisplayName(metricId), legendX + 8, legendY)
    })

    return yPosition + chartHeight
  }

  /**
   * Add performance summary (replaces executive brief)
   */
  addPerformanceSummary(doc, summary, margins, contentWidth, yPosition, accentColor) {
    const startY = yPosition

    // Section title
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text('Resumen de Rendimiento', margins.left, yPosition)
    yPosition += 20

    // Summary container
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(margins.left, yPosition, contentWidth, 50, 3, 3, 'F')

    // Key metrics in a clean layout
    const summaryItems = [
      { label: 'Inversión Total', value: `€${summary.totalCost}`, icon: '💰' },
      { label: 'Impresiones', value: summary.totalImpressions.toLocaleString('es-ES'), icon: '👁️' },
      { label: 'Clics', value: summary.totalClicks.toLocaleString('es-ES'), icon: '🖱️' },
      { label: 'CTR Promedio', value: `${summary.averageCTR}%`, icon: '📊' },
      { label: 'ROAS', value: `${summary.roas}x`, icon: '💹' }
    ]

    // Display metrics in rows
    summaryItems.forEach((item, index) => {
      const row = Math.floor(index / 3)
      const col = index % 3
      const itemWidth = contentWidth / 3
      const x = margins.left + col * itemWidth + 10
      const y = yPosition + 15 + row * 20

      // Icon
      doc.setFontSize(10)
      doc.text(item.icon, x, y)

      // Label
      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(item.label, x + 10, y)

      // Value
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(40, 40, 40)
      doc.text(item.value, x + 10, y + 8)
    })

    return yPosition + 50
  }

  /**
   * Helper functions
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 }
  }

  getChartTypeName(type) {
    const names = { line: 'de Líneas', bar: 'de Barras', area: 'de Área', pie: 'Circular' }
    return names[type] || 'de Líneas'
  }

  getChartIcon(type) {
    const icons = { line: '📈', bar: '📊', area: '📉', pie: '🥧' }
    return icons[type] || '📈'
  }

  /**
   * Format metric values for display
   */
  formatMetricValue(value, format) {
    if (!value) return '0'
    
    switch (format) {
      case 'currency':
        return value.toString().replace(/[€$]/g, '€')
      case 'decimal':
        return value.toString()
      case 'number':
      default:
        return value.toString()
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    })
  }

  /**
   * Generate comprehensive Excel report
   */
  async generateExcelReport(reportData, config) {
    console.log('📊 Generating Excel report...')
    
    const workbook = XLSX.utils.book_new()

    // Summary sheet
    if (reportData.analytics?.summary) {
      const summaryData = [
        ['Reporte de Marketing Digital'],
        [''],
        ['Información General'],
        ['Generado', new Date().toLocaleDateString('es-ES')],
        ['Período', `${config.dateRange.start} - ${config.dateRange.end}`],
        ['Plataforma', config.platform || 'Multiple'],
        [''],
        ['Métricas Resumen'],
        ['Inversión Total', parseFloat(reportData.analytics.summary.totalCost)],
        ['Impresiones', parseInt(reportData.analytics.summary.totalImpressions)],
        ['Clics', parseInt(reportData.analytics.summary.totalClicks)],
        ['Conversiones', parseInt(reportData.analytics.summary.totalConversions)],
        ['Ingresos', parseFloat(reportData.analytics.summary.totalRevenue)],
        ['CTR Promedio (%)', parseFloat(reportData.analytics.summary.averageCTR)],
        ['CPC Promedio', parseFloat(reportData.analytics.summary.averageCPC)],
        ['CPM Promedio', parseFloat(reportData.analytics.summary.averageCPM)],
        ['ROAS', parseFloat(reportData.analytics.summary.roas)]
      ]

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')
    }

    // Data sheet
    if (reportData.data?.length > 0) {
      const dataSheet = XLSX.utils.json_to_sheet(reportData.data)
      XLSX.utils.book_append_sheet(workbook, dataSheet, 'Datos')
    }

    // Performance by campaign
    if (reportData.analytics?.performance?.byCampaign) {
      const perfSheet = XLSX.utils.json_to_sheet(reportData.analytics.performance.byCampaign)
      XLSX.utils.book_append_sheet(workbook, perfSheet, 'Rendimiento por Campaña')
    }

    // Daily trends
    if (reportData.analytics?.trends?.daily) {
      const trendsSheet = XLSX.utils.json_to_sheet(reportData.analytics.trends.daily)
      XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Tendencias Diarias')
    }

    // Recommendations
    if (reportData.analytics?.recommendations) {
      const recSheet = XLSX.utils.json_to_sheet(reportData.analytics.recommendations)
      XLSX.utils.book_append_sheet(workbook, recSheet, 'Recomendaciones')
    }

    return workbook
  }

  /**
   * Add campaign performance data table to PDF
   */
  addCampaignDataTable(doc, data, config, margins, contentWidth, yPosition, accentColor) {
    const startY = yPosition

    // Section title
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text('Datos de Rendimiento por Campaña', margins.left, yPosition)
    yPosition += 15

    // Prepare table data by grouping by campaign
    const campaignData = this.groupDataByCampaign(data, config.metrics)
    
    if (campaignData.length === 0) {
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text('No hay datos disponibles para mostrar', margins.left, yPosition + 10)
      return yPosition + 20
    }

    // Define table columns based on selected metrics
    const columns = [
      { title: 'Campaña', dataKey: 'campaign' },
      { title: 'Fecha', dataKey: 'date' }
    ]

    // Add columns for each selected metric
    config.metrics.forEach(metricId => {
      const displayName = this.getMetricDisplayName(metricId)
      columns.push({ title: displayName, dataKey: metricId })
    })

    // Add calculated metrics
    columns.push(
      { title: 'CTR %', dataKey: 'ctr' },
      { title: 'CPC', dataKey: 'cpc' },
      { title: 'CPM', dataKey: 'cpm' }
    )

    // Generate table using jsPDF-autotable
    doc.autoTable({
      startY: yPosition,
      head: [columns.map(col => col.title)],
      body: campaignData.map(row => columns.map(col => {
        const value = row[col.dataKey]
        if (typeof value === 'number') {
          // Determine decimal places based on column type
          let minDecimals = 0
          let maxDecimals = 0
          
          if (col.dataKey.includes('cost') || col.dataKey.includes('revenue')) {
            minDecimals = 2
            maxDecimals = 2
          } else if (col.dataKey.includes('ctr') || col.dataKey.includes('cpc') || col.dataKey.includes('cpm')) {
            minDecimals = 0
            maxDecimals = 2
          } else {
            minDecimals = 0
            maxDecimals = 0
          }
          
          return value.toLocaleString('es-ES', { 
            minimumFractionDigits: minDecimals,
            maximumFractionDigits: maxDecimals
          })
        }
        return value || '-'
      })),
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [accentColor.r, accentColor.g, accentColor.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      margin: { left: margins.left, right: margins.right },
      tableWidth: 'auto',
      columnStyles: {
        0: { cellWidth: 40 }, // Campaign name
        1: { cellWidth: 20 }   // Date
      }
    })

    return doc.lastAutoTable.finalY + 10
  }

  /**
   * Group data by campaign for table display
   */
  groupDataByCampaign(data, selectedMetrics) {
    if (!data || data.length === 0) return []

    // Sort data by campaign and date
    const sortedData = data.sort((a, b) => {
      if (a.campaign !== b.campaign) {
        return (a.campaign || '').localeCompare(b.campaign || '')
      }
      return (a.date || '').localeCompare(b.date || '')
    })

    // Limit to top 20 rows for PDF space
    return sortedData.slice(0, 20).map(row => ({
      campaign: row.campaign || 'Sin nombre',
      date: this.formatDate(row.date),
      ...selectedMetrics.reduce((acc, metric) => {
        acc[metric] = row[metric] || 0
        return acc
      }, {}),
      ctr: row.ctr || '0.00',
      cpc: row.cpc || '0.00',
      cpm: row.cpm || '0.00'
    }))
  }
}

export default new ReportService()