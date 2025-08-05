import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * Modern PDF Report Generator for Marketing Analytics
 * Professional, clean, and well-structured design
 */
export class PDFReportGenerator {
  constructor() {
    this.doc = null
    this.colors = {
      primary: { r: 37, g: 99, b: 235 },      // Blue
      secondary: { r: 99, g: 102, b: 241 },   // Indigo
      success: { r: 16, g: 185, b: 129 },     // Green
      danger: { r: 239, g: 68, b: 68 },       // Red
      warning: { r: 245, g: 158, b: 11 },     // Amber
      dark: { r: 31, g: 41, b: 55 },          // Dark gray
      gray: { r: 107, g: 114, b: 128 },       // Medium gray
      light: { r: 243, g: 244, b: 246 },      // Light gray
      white: { r: 255, g: 255, b: 255 }
    }
    this.fonts = {
      title: 24,
      heading1: 18,
      heading2: 14,
      heading3: 12,
      body: 10,
      small: 9,
      tiny: 8
    }
    this.margins = {
      top: 25,
      right: 20,
      bottom: 25,
      left: 20
    }
  }

  /**
   * Generate complete PDF report
   */
  async generate(reportData, config = {}) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = this.doc.internal.pageSize.getWidth()
    const pageHeight = this.doc.internal.pageSize.getHeight()
    const contentWidth = pageWidth - this.margins.left - this.margins.right

    // Cover page
    this.addCoverPage(reportData, config, pageWidth, pageHeight)

    // Executive summary
    this.doc.addPage()
    let yPos = this.margins.top
    yPos = this.addExecutiveSummary(reportData, contentWidth, yPos)

    // Key metrics dashboard
    this.doc.addPage()
    yPos = this.margins.top
    yPos = this.addMetricsDashboard(reportData, contentWidth, yPos)

    // Performance analysis
    if (reportData.analytics?.performance) {
      this.doc.addPage()
      yPos = this.margins.top
      yPos = this.addPerformanceAnalysis(reportData.analytics.performance, contentWidth, yPos)
    }

    // Campaign comparison
    if (reportData.analytics?.campaigns && reportData.analytics.campaigns.length > 0) {
      this.doc.addPage()
      yPos = this.margins.top
      yPos = this.addCampaignComparison(reportData.analytics.campaigns, contentWidth, yPos)
    }

    // Trends and insights
    if (reportData.analytics?.trends) {
      this.doc.addPage()
      yPos = this.margins.top
      yPos = this.addTrendsSection(reportData.analytics.trends, contentWidth, yPos)
    }

    // Detailed data table
    if (reportData.data && reportData.data.length > 0) {
      this.doc.addPage()
      yPos = this.margins.top
      yPos = this.addDataTable(reportData.data, config.metrics || [], contentWidth, yPos)
    }

    // Footer on all pages
    this.addFooterToAllPages()

    return this.doc
  }

  /**
   * Add professional cover page
   */
  addCoverPage(reportData, config, pageWidth, pageHeight) {
    // Background gradient effect
    this.setGradientBackground(pageHeight)

    // Logo section
    if (config.logo) {
      try {
        this.doc.addImage(config.logo, 'PNG', this.margins.left, 30, 40, 20)
      } catch (e) {
        console.warn('Could not add logo:', e)
      }
    }

    // Report title
    const centerX = pageWidth / 2
    this.setColor('white')
    this.doc.setFontSize(this.fonts.title)
    this.doc.setFont(undefined, 'bold')
    this.doc.text('REPORTE DE MARKETING DIGITAL', centerX, 100, { align: 'center' })

    // Subtitle with platform and date range
    this.doc.setFontSize(this.fonts.heading2)
    this.doc.setFont(undefined, 'normal')
    const platform = config.platform ? config.platform.toUpperCase() : 'MULTIPLATAFORMA'
    this.doc.text(platform, centerX, 115, { align: 'center' })

    // Date range
    this.doc.setFontSize(this.fonts.heading3)
    const dateRange = `${this.formatDate(config.dateRange?.start)} - ${this.formatDate(config.dateRange?.end)}`
    this.doc.text(dateRange, centerX, 130, { align: 'center' })

    // Key highlights box
    if (reportData.analytics?.summary) {
      this.addCoverHighlights(reportData.analytics.summary, centerX, 160, pageWidth)
    }

    // Company/Client name
    if (config.companyName) {
      this.doc.setFontSize(this.fonts.heading2)
      this.doc.setFont(undefined, 'bold')
      this.doc.text(config.companyName, centerX, pageHeight - 60, { align: 'center' })
    }

    // Generation date
    this.doc.setFontSize(this.fonts.small)
    this.doc.setFont(undefined, 'normal')
    this.doc.text(`Generado el ${new Date().toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}`, centerX, pageHeight - 30, { align: 'center' })
  }

  /**
   * Add cover page highlights
   */
  addCoverHighlights(summary, centerX, yPos, pageWidth) {
    const boxWidth = 160
    const boxHeight = 60
    const startX = (pageWidth - boxWidth) / 2

    // White background box
    this.doc.setFillColor(255, 255, 255)
    this.doc.setDrawColor(255, 255, 255)
    this.doc.roundedRect(startX, yPos, boxWidth, boxHeight, 5, 5, 'FD')

    // Highlights content
    this.setColor('dark')
    this.doc.setFontSize(this.fonts.body)
    
    const highlights = [
      { label: 'Inversión Total', value: this.formatCurrency(summary.totalCost) },
      { label: 'Impresiones', value: this.formatNumber(summary.totalImpressions) },
      { label: 'Conversiones', value: this.formatNumber(summary.totalConversions || 0) },
      { label: 'ROAS', value: `${parseFloat(summary.roas || 0).toFixed(2)}x` }
    ]

    highlights.forEach((item, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = startX + 20 + (col * 70)
      const y = yPos + 20 + (row * 25)

      this.doc.setFont(undefined, 'normal')
      this.setColor('gray')
      this.doc.setFontSize(this.fonts.small)
      this.doc.text(item.label, x, y)

      this.doc.setFont(undefined, 'bold')
      this.setColor('primary')
      this.doc.setFontSize(this.fonts.heading3)
      this.doc.text(item.value, x, y + 7)
    })
  }

  /**
   * Add executive summary section
   */
  addExecutiveSummary(reportData, contentWidth, yPos) {
    // Section title
    this.addSectionTitle('RESUMEN EJECUTIVO', yPos)
    yPos += 15

    // Performance overview
    const summary = reportData.analytics?.summary || {}
    const insights = this.generateInsights(summary)

    // Key takeaways box
    this.doc.setFillColor(this.colors.light.r, this.colors.light.g, this.colors.light.b)
    this.doc.roundedRect(this.margins.left, yPos, contentWidth, 40, 3, 3, 'F')

    this.doc.setFontSize(this.fonts.body)
    this.setColor('dark')
    this.doc.setFont(undefined, 'normal')

    const takeaways = [
      `La campaña generó ${this.formatNumber(summary.totalImpressions)} impresiones con una inversión de ${this.formatCurrency(summary.totalCost)}.`,
      `Se obtuvieron ${this.formatNumber(summary.totalClicks)} clics con un CTR promedio del ${parseFloat(summary.averageCTR || 0).toFixed(2)}%.`,
      `El costo por clic promedio fue de ${this.formatCurrency(summary.averageCPC)} con un CPM de ${this.formatCurrency(summary.averageCPM)}.`,
      insights.primary
    ]

    let textY = yPos + 8
    takeaways.forEach((text, index) => {
      const lines = this.doc.splitTextToSize(text, contentWidth - 10)
      lines.forEach(line => {
        this.doc.text('• ' + line, this.margins.left + 5, textY)
        textY += 6
      })
    })

    yPos += 45

    // Performance indicators
    this.addPerformanceIndicators(summary, contentWidth, yPos)
    yPos += 35

    return yPos
  }

  /**
   * Add metrics dashboard
   */
  addMetricsDashboard(reportData, contentWidth, yPos) {
    this.addSectionTitle('MÉTRICAS PRINCIPALES', yPos)
    yPos += 15

    const metrics = this.prepareMetricCards(reportData.analytics?.summary || {})
    const cardWidth = (contentWidth - 10) / 3
    const cardHeight = 35

    metrics.forEach((metric, index) => {
      const row = Math.floor(index / 3)
      const col = index % 3
      const x = this.margins.left + col * (cardWidth + 5)
      const y = yPos + row * (cardHeight + 5)

      this.drawMetricCard(metric, x, y, cardWidth, cardHeight)
    })

    return yPos + Math.ceil(metrics.length / 3) * (cardHeight + 5) + 10
  }

  /**
   * Draw individual metric card
   */
  drawMetricCard(metric, x, y, width, height) {
    // Card background
    this.doc.setFillColor(255, 255, 255)
    this.doc.setDrawColor(229, 231, 235)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(x, y, width, height, 2, 2, 'FD')

    // Metric icon/indicator
    if (metric.trend) {
      const trendColor = metric.trend > 0 ? this.colors.success : this.colors.danger
      this.doc.setFillColor(trendColor.r, trendColor.g, trendColor.b)
      this.doc.circle(x + 8, y + 8, 2, 'F')
    }

    // Metric label
    this.doc.setFontSize(this.fonts.small)
    this.doc.setFont(undefined, 'normal')
    this.setColor('gray')
    this.doc.text(metric.label, x + 15, y + 9)

    // Metric value
    this.doc.setFontSize(this.fonts.heading2)
    this.doc.setFont(undefined, 'bold')
    this.setColor('dark')
    this.doc.text(metric.value, x + 15, y + 20)

    // Trend indicator
    if (metric.trend !== undefined && metric.trend !== null) {
      const trendText = metric.trend > 0 ? `↑ ${Math.abs(metric.trend)}%` : `↓ ${Math.abs(metric.trend)}%`
      const trendColor = metric.trend > 0 ? 'success' : 'danger'
      this.doc.setFontSize(this.fonts.tiny)
      this.doc.setFont(undefined, 'normal')
      this.setColor(trendColor)
      this.doc.text(trendText, x + 15, y + 27)
    }
  }

  /**
   * Add campaign comparison section
   */
  addCampaignComparison(campaigns, contentWidth, yPos) {
    this.addSectionTitle('COMPARACIÓN DE CAMPAÑAS', yPos)
    yPos += 15

    // Prepare table data
    const tableData = campaigns.map(campaign => [
      campaign.name || campaign.campaign_name,
      this.formatCurrency(campaign.cost),
      this.formatNumber(campaign.impressions),
      this.formatNumber(campaign.clicks),
      `${parseFloat(campaign.ctr || 0).toFixed(2)}%`,
      this.formatCurrency(campaign.cpc || 0),
      this.formatCurrency(campaign.cpm || 0)
    ])

    // Add table
    this.doc.autoTable({
      head: [['Campaña', 'Inversión', 'Impresiones', 'Clics', 'CTR', 'CPC', 'CPM']],
      body: tableData,
      startY: yPos,
      margin: { left: this.margins.left, right: this.margins.right },
      styles: {
        fontSize: this.fonts.small,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [this.colors.primary.r, this.colors.primary.g, this.colors.primary.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [this.colors.light.r, this.colors.light.g, this.colors.light.b]
      }
    })

    return this.doc.previousAutoTable.finalY + 10
  }

  /**
   * Add trends section with visualizations
   */
  addTrendsSection(trends, contentWidth, yPos) {
    this.addSectionTitle('TENDENCIAS Y EVOLUCIÓN', yPos)
    yPos += 15

    // Daily trends description
    this.doc.setFontSize(this.fonts.body)
    this.setColor('gray')
    this.doc.text('Evolución diaria de las métricas principales durante el período analizado:', this.margins.left, yPos)
    yPos += 10

    // Simulated trend visualization
    const chartHeight = 60
    this.doc.setFillColor(248, 250, 252)
    this.doc.roundedRect(this.margins.left, yPos, contentWidth, chartHeight, 3, 3, 'F')

    // Draw simple trend lines
    if (trends.daily && trends.daily.length > 0) {
      this.drawSimpleTrendChart(trends.daily, this.margins.left, yPos, contentWidth, chartHeight)
    }

    return yPos + chartHeight + 15
  }

  /**
   * Add detailed data table
   */
  addDataTable(data, metrics, contentWidth, yPos) {
    this.addSectionTitle('DATOS DETALLADOS', yPos)
    yPos += 15

    // Prepare table headers and data
    const headers = ['Fecha', ...metrics.map(m => this.getMetricLabel(m))]
    const tableData = data.slice(0, 30).map(row => {
      const rowData = [this.formatDate(row.date)]
      metrics.forEach(metric => {
        rowData.push(this.formatMetricValue(row[metric], metric))
      })
      return rowData
    })

    // Add table
    this.doc.autoTable({
      head: [headers],
      body: tableData,
      startY: yPos,
      margin: { left: this.margins.left, right: this.margins.right },
      styles: {
        fontSize: this.fonts.tiny,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [this.colors.dark.r, this.colors.dark.g, this.colors.dark.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: this.fonts.small
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      }
    })

    if (data.length > 30) {
      const finalY = this.doc.previousAutoTable.finalY + 5
      this.doc.setFontSize(this.fonts.small)
      this.setColor('gray')
      this.doc.text(`Mostrando 30 de ${data.length} registros totales`, this.margins.left, finalY)
    }

    return this.doc.previousAutoTable.finalY + 10
  }

  /**
   * Helper methods
   */
  setGradientBackground(height) {
    const steps = 20
    const stepHeight = height / steps
    
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps
      const r = Math.round(this.colors.primary.r + (this.colors.secondary.r - this.colors.primary.r) * ratio)
      const g = Math.round(this.colors.primary.g + (this.colors.secondary.g - this.colors.primary.g) * ratio)
      const b = Math.round(this.colors.primary.b + (this.colors.secondary.b - this.colors.primary.b) * ratio)
      
      this.doc.setFillColor(r, g, b)
      this.doc.rect(0, i * stepHeight, this.doc.internal.pageSize.getWidth(), stepHeight, 'F')
    }
  }

  addSectionTitle(title, yPos) {
    this.doc.setFontSize(this.fonts.heading1)
    this.doc.setFont(undefined, 'bold')
    this.setColor('dark')
    this.doc.text(title, this.margins.left, yPos)
  }

  addPerformanceIndicators(summary, contentWidth, yPos) {
    const indicators = [
      { label: 'CTR', value: parseFloat(summary.averageCTR || 0), target: 2, format: '%' },
      { label: 'CPC', value: parseFloat(summary.averageCPC || 0), target: 1.5, format: '€' },
      { label: 'ROAS', value: parseFloat(summary.roas || 0), target: 3, format: 'x' }
    ]

    const indicatorWidth = contentWidth / indicators.length
    
    indicators.forEach((indicator, index) => {
      const x = this.margins.left + index * indicatorWidth
      const performance = indicator.value >= indicator.target ? 'good' : 'needs-improvement'
      const color = performance === 'good' ? this.colors.success : this.colors.warning
      
      // Indicator bar
      this.doc.setFillColor(229, 231, 235)
      this.doc.rect(x, yPos, indicatorWidth - 10, 4, 'F')
      
      const fillWidth = Math.min((indicator.value / indicator.target) * (indicatorWidth - 10), indicatorWidth - 10)
      this.doc.setFillColor(color.r, color.g, color.b)
      this.doc.rect(x, yPos, fillWidth, 4, 'F')
      
      // Label and value
      this.doc.setFontSize(this.fonts.small)
      this.setColor('gray')
      this.doc.text(indicator.label, x, yPos + 10)
      
      this.doc.setFont(undefined, 'bold')
      this.setColor('dark')
      const valueText = `${indicator.value.toFixed(2)}${indicator.format}`
      this.doc.text(valueText, x, yPos + 16)
      
      this.doc.setFont(undefined, 'normal')
      this.doc.setFontSize(this.fonts.tiny)
      this.setColor('gray')
      this.doc.text(`Objetivo: ${indicator.target}${indicator.format}`, x, yPos + 22)
    })
  }

  drawSimpleTrendChart(data, x, y, width, height) {
    // Simple line chart visualization
    const padding = 10
    const chartX = x + padding
    const chartY = y + padding
    const chartWidth = width - 2 * padding
    const chartHeight = height - 2 * padding
    
    if (data.length < 2) return
    
    // Get min/max values for scaling
    const values = data.map(d => d.cost || 0)
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const range = maxValue - minValue || 1
    
    // Draw trend line
    this.doc.setDrawColor(this.colors.primary.r, this.colors.primary.g, this.colors.primary.b)
    this.doc.setLineWidth(1)
    
    const points = data.slice(0, 30).map((d, i) => ({
      x: chartX + (i / (Math.min(data.length, 30) - 1)) * chartWidth,
      y: chartY + chartHeight - ((d.cost - minValue) / range) * chartHeight
    }))
    
    points.forEach((point, i) => {
      if (i > 0) {
        this.doc.line(points[i-1].x, points[i-1].y, point.x, point.y)
      }
    })
  }

  prepareMetricCards(summary) {
    return [
      { label: 'Inversión Total', value: this.formatCurrency(summary.totalCost), trend: null },
      { label: 'Impresiones', value: this.formatNumber(summary.totalImpressions), trend: null },
      { label: 'Clics', value: this.formatNumber(summary.totalClicks), trend: null },
      { label: 'CTR Promedio', value: `${parseFloat(summary.averageCTR || 0).toFixed(2)}%`, trend: null },
      { label: 'CPC Promedio', value: this.formatCurrency(summary.averageCPC), trend: null },
      { label: 'CPM Promedio', value: this.formatCurrency(summary.averageCPM), trend: null },
      { label: 'Conversiones', value: this.formatNumber(summary.totalConversions || 0), trend: null },
      { label: 'Ingresos', value: this.formatCurrency(summary.totalRevenue || 0), trend: null },
      { label: 'ROAS', value: `${parseFloat(summary.roas || 0).toFixed(2)}x`, trend: null }
    ]
  }

  generateInsights(summary) {
    const ctr = parseFloat(summary.averageCTR || 0)
    const roas = parseFloat(summary.roas || 0)
    
    let primary = ''
    if (roas >= 3) {
      primary = `Excelente retorno de inversión con un ROAS de ${roas.toFixed(2)}x, superando el objetivo estándar.`
    } else if (roas >= 2) {
      primary = `Buen retorno de inversión con un ROAS de ${roas.toFixed(2)}x, dentro de los parámetros esperados.`
    } else {
      primary = `El ROAS de ${roas.toFixed(2)}x sugiere oportunidades de optimización en la estrategia de conversión.`
    }
    
    return { primary }
  }

  setColor(colorName) {
    const color = this.colors[colorName] || this.colors.dark
    this.doc.setTextColor(color.r, color.g, color.b)
  }

  formatCurrency(value) {
    const num = parseFloat(value) || 0
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  formatNumber(value) {
    const num = parseInt(value) || 0
    return new Intl.NumberFormat('es-ES').format(num)
  }

  formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  formatMetricValue(value, metric) {
    if (metric.includes('cost') || metric.includes('cpc') || metric.includes('cpm') || metric.includes('revenue')) {
      return this.formatCurrency(value)
    } else if (metric.includes('ctr') || metric.includes('rate')) {
      return `${parseFloat(value || 0).toFixed(2)}%`
    } else {
      return this.formatNumber(value)
    }
  }

  getMetricLabel(metric) {
    const labels = {
      cost: 'Inversión',
      impressions: 'Impresiones',
      clicks: 'Clics',
      ctr: 'CTR',
      cpc: 'CPC',
      cpm: 'CPM',
      conversions: 'Conversiones',
      revenue: 'Ingresos',
      roas: 'ROAS'
    }
    return labels[metric] || metric
  }

  addFooterToAllPages() {
    const pageCount = this.doc.internal.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Footer line
      this.doc.setDrawColor(229, 231, 235)
      this.doc.setLineWidth(0.5)
      const pageHeight = this.doc.internal.pageSize.getHeight()
      this.doc.line(this.margins.left, pageHeight - 15, this.doc.internal.pageSize.getWidth() - this.margins.right, pageHeight - 15)
      
      // Page number
      this.doc.setFontSize(this.fonts.small)
      this.setColor('gray')
      this.doc.text(`Página ${i} de ${pageCount}`, this.doc.internal.pageSize.getWidth() - this.margins.right, pageHeight - 8, { align: 'right' })
      
      // Confidentiality notice
      if (i > 1) {
        this.doc.setFontSize(this.fonts.tiny)
        this.doc.text('Confidencial - Reporte de Marketing Digital', this.margins.left, pageHeight - 8)
      }
    }
  }
}

export default PDFReportGenerator