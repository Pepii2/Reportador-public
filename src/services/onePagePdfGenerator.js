import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * One-Page PDF Report Generator
 * Clean, professional single-page marketing report
 */
export class OnePagePDFGenerator {
  constructor() {
    this.doc = null
    this.colors = {
      primary: '#2563eb',
      secondary: '#64748b',
      dark: '#1e293b',
      light: '#f1f5f9',
      white: '#ffffff'
    }
  }

  /**
   * Generate one-page PDF report
   */
  async generate(reportData, config = {}) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const margins = { top: 15, right: 15, bottom: 15, left: 15 }
    const contentWidth = pageWidth - margins.left - margins.right
    
    let yPos = margins.top

    // HEADER SECTION (Title, Subtitle, Brand)
    yPos = this.addHeader(config, margins, contentWidth, yPos)
    
    // METRICS CARDS SECTION (1/4 of page)
    const cardsHeight = 50
    yPos = this.addMetricsCards(reportData, margins, contentWidth, yPos, cardsHeight)
    
    // CHART SECTION (Middle of page)
    const chartHeight = 80
    yPos = this.addChart(reportData, config, margins, contentWidth, yPos, chartHeight)
    
    // TABLE SECTION (Bottom of page)
    const remainingHeight = pageHeight - yPos - margins.bottom - 10
    this.addDataTable(reportData, config, margins, contentWidth, yPos, remainingHeight)

    return this.doc
  }

  /**
   * Add header with title, subtitle and brand
   */
  addHeader(config, margins, contentWidth, yPos) {
    // Brand/Logo area
    if (config.logo || config.companyName) {
      this.doc.setFillColor(this.colors.light)
      this.doc.rect(margins.left, yPos, contentWidth, 25, 'F')
      
      // Company name or logo placeholder
      this.doc.setFontSize(10)
      this.doc.setTextColor(this.colors.secondary)
      this.doc.setFont(undefined, 'normal')
      this.doc.text(config.companyName || 'COMPANY', margins.left + 5, yPos + 7)
    }

    // Title
    this.doc.setFontSize(20)
    this.doc.setFont(undefined, 'bold')
    this.doc.setTextColor(this.colors.dark)
    this.doc.text(config.title || 'Reporte de Marketing Digital', margins.left + 5, yPos + 16)

    // Subtitle with date range
    this.doc.setFontSize(11)
    this.doc.setFont(undefined, 'normal')
    this.doc.setTextColor(this.colors.secondary)
    const dateRange = `${this.formatDate(config.dateRange?.start)} - ${this.formatDate(config.dateRange?.end)}`
    this.doc.text(dateRange, margins.left + 5, yPos + 22)

    // Platform badge
    if (config.platform) {
      const platformText = config.platform.toUpperCase()
      const textWidth = this.doc.getTextWidth(platformText)
      const badgeX = margins.left + contentWidth - textWidth - 10
      
      this.doc.setFillColor(this.colors.primary)
      this.doc.roundedRect(badgeX - 2, yPos + 10, textWidth + 8, 8, 2, 2, 'F')
      
      this.doc.setFontSize(8)
      this.doc.setTextColor(this.colors.white)
      this.doc.text(platformText, badgeX + 2, yPos + 15)
    }

    return yPos + 30
  }

  /**
   * Add metrics cards section
   */
  addMetricsCards(reportData, margins, contentWidth, yPos, height) {
    const summary = reportData.analytics?.summary || {}
    const selectedMetrics = reportData.customization?.selectedCardMetrics || []
    
    // Default metrics if none selected
    const metrics = selectedMetrics.length > 0 ? selectedMetrics : [
      { id: 'cost', label: 'Inversión', value: summary.totalCost },
      { id: 'impressions', label: 'Impresiones', value: summary.totalImpressions },
      { id: 'clicks', label: 'Clics', value: summary.totalClicks },
      { id: 'ctr', label: 'CTR', value: summary.averageCTR }
    ]

    // Calculate card dimensions
    const cardsPerRow = Math.min(metrics.length, 4)
    const cardWidth = (contentWidth - (cardsPerRow - 1) * 5) / cardsPerRow
    const cardHeight = height / Math.ceil(metrics.length / cardsPerRow) - 5

    metrics.forEach((metric, index) => {
      const row = Math.floor(index / cardsPerRow)
      const col = index % cardsPerRow
      const x = margins.left + col * (cardWidth + 5)
      const y = yPos + row * (cardHeight + 5)

      // Card background
      this.doc.setFillColor(this.colors.white)
      this.doc.setDrawColor(this.colors.light)
      this.doc.setLineWidth(0.5)
      this.doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD')

      // Metric label
      this.doc.setFontSize(9)
      this.doc.setFont(undefined, 'normal')
      this.doc.setTextColor(this.colors.secondary)
      const label = this.getMetricLabel(metric.id || metric.label)
      this.doc.text(label, x + 5, y + 8)

      // Metric value
      this.doc.setFontSize(16)
      this.doc.setFont(undefined, 'bold')
      this.doc.setTextColor(this.colors.dark)
      const value = this.formatMetricValue(metric.value || summary[`total${this.capitalize(metric.id)}`] || summary[metric.id], metric.id)
      
      // Truncate value if too long
      const maxWidth = cardWidth - 10
      let displayValue = value
      if (this.doc.getTextWidth(displayValue) > maxWidth) {
        this.doc.setFontSize(14)
        if (this.doc.getTextWidth(displayValue) > maxWidth) {
          this.doc.setFontSize(12)
        }
      }
      
      this.doc.text(displayValue, x + 5, y + 20)

      // Trend or additional info (if available)
      if (metric.trend) {
        const trendText = metric.trend > 0 ? `↑ ${metric.trend}%` : `↓ ${Math.abs(metric.trend)}%`
        const trendColor = metric.trend > 0 ? '#10b981' : '#ef4444'
        this.doc.setFontSize(8)
        this.doc.setTextColor(trendColor)
        this.doc.text(trendText, x + 5, y + 27)
      }
    })

    return yPos + height + 10
  }

  /**
   * Add chart section
   */
  addChart(reportData, config, margins, contentWidth, yPos, height) {
    // Chart container
    this.doc.setFillColor(this.colors.white)
    this.doc.setDrawColor(this.colors.light)
    this.doc.setLineWidth(0.5)
    this.doc.roundedRect(margins.left, yPos, contentWidth, height, 3, 3, 'FD')

    // Chart title
    const chartType = config.customization?.chartType || 'line'
    const chartMetrics = config.customization?.chartMetrics || ['impressions', 'clicks']
    
    this.doc.setFontSize(11)
    this.doc.setFont(undefined, 'bold')
    this.doc.setTextColor(this.colors.dark)
    this.doc.text(`Evolución de Métricas`, margins.left + 5, yPos + 8)

    // Chart visualization area
    const chartX = margins.left + 10
    const chartY = yPos + 15
    const chartWidth = contentWidth - 20
    const chartHeight = height - 25

    // Draw simple line chart representation
    this.drawSimpleChart(reportData.data || [], chartMetrics, chartX, chartY, chartWidth, chartHeight)

    // Legend
    const legendY = yPos + height - 5
    chartMetrics.forEach((metric, index) => {
      const legendX = margins.left + 10 + (index * 50)
      const color = this.getMetricColor(index)
      
      // Color dot
      this.doc.setFillColor(color)
      this.doc.circle(legendX, legendY - 2, 2, 'F')
      
      // Label
      this.doc.setFontSize(8)
      this.doc.setTextColor(this.colors.secondary)
      this.doc.text(this.getMetricLabel(metric), legendX + 5, legendY)
    })

    return yPos + height + 10
  }

  /**
   * Add data table section
   */
  addDataTable(reportData, config, margins, contentWidth, yPos, maxHeight) {
    const data = reportData.data || []
    const metrics = config.metrics || ['cost', 'impressions', 'clicks', 'ctr']
    
    if (data.length === 0) return

    // Prepare table data
    const headers = ['Fecha', ...metrics.map(m => this.getMetricLabel(m))]
    const rows = data.slice(0, 15).map(row => [
      this.formatDate(row.date),
      ...metrics.map(m => this.formatMetricValue(row[m], m))
    ])

    // Add table with autoTable
    this.doc.autoTable({
      head: [headers],
      body: rows,
      startY: yPos,
      margin: { left: margins.left, right: margins.right },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        lineColor: '#e2e8f0',
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [37, 99, 235], // primary color
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Date column
      },
      didDrawPage: (data) => {
        // Add note if more data exists
        if (data.cursor.y < yPos + maxHeight - 10 && reportData.data.length > 15) {
          this.doc.setFontSize(8)
          this.doc.setTextColor(this.colors.secondary)
          this.doc.setFont(undefined, 'italic')
          this.doc.text(
            `Mostrando 15 de ${reportData.data.length} registros totales`,
            margins.left,
            data.cursor.y + 5
          )
        }
      }
    })

    // Footer
    const pageHeight = 297
    this.doc.setFontSize(7)
    this.doc.setTextColor(this.colors.secondary)
    this.doc.setFont(undefined, 'normal')
    this.doc.text(
      `Generado el ${new Date().toLocaleDateString('es-ES')} | Reportador Digital`,
      margins.left,
      pageHeight - 10
    )
  }

  /**
   * Draw simple chart visualization
   */
  drawSimpleChart(data, metrics, x, y, width, height) {
    if (data.length < 2) {
      // No data message
      this.doc.setFontSize(10)
      this.doc.setTextColor(this.colors.secondary)
      this.doc.text('No hay suficientes datos para mostrar', x + width/2, y + height/2, { align: 'center' })
      return
    }

    // Draw axes
    this.doc.setDrawColor(this.colors.light)
    this.doc.setLineWidth(0.5)
    this.doc.line(x, y + height, x + width, y + height) // X axis
    this.doc.line(x, y, x, y + height) // Y axis

    // Draw grid lines
    this.doc.setDrawColor('#f1f5f9')
    this.doc.setLineWidth(0.1)
    for (let i = 1; i <= 4; i++) {
      const gridY = y + (height * i / 4)
      this.doc.line(x, gridY, x + width, gridY)
    }

    // Plot lines for each metric
    metrics.forEach((metric, metricIndex) => {
      const color = this.getMetricColor(metricIndex)
      const values = data.slice(0, 30).map(d => parseFloat(d[metric]) || 0)
      
      if (values.length === 0) return
      
      const maxValue = Math.max(...values)
      const minValue = Math.min(...values)
      const range = maxValue - minValue || 1
      
      this.doc.setDrawColor(color)
      this.doc.setLineWidth(1.5)
      
      const points = values.map((value, i) => ({
        x: x + (i / (values.length - 1)) * width,
        y: y + height - ((value - minValue) / range) * height
      }))
      
      // Draw line
      points.forEach((point, i) => {
        if (i > 0) {
          this.doc.line(points[i-1].x, points[i-1].y, point.x, point.y)
        }
      })
      
      // Draw points
      this.doc.setFillColor(color)
      points.forEach(point => {
        this.doc.circle(point.x, point.y, 1, 'F')
      })
    })
  }

  /**
   * Helper methods
   */
  formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  formatMetricValue(value, metric) {
    if (value === null || value === undefined) return '0'
    
    const metricStr = String(metric).toLowerCase()
    
    // Currency metrics
    if (metricStr.includes('cost') || metricStr.includes('cpc') || 
        metricStr.includes('cpm') || metricStr.includes('revenue')) {
      const num = parseFloat(value) || 0
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num)
    }
    
    // Percentage metrics
    if (metricStr.includes('ctr') || metricStr.includes('rate')) {
      return `${parseFloat(value || 0).toFixed(2)}%`
    }
    
    // ROAS
    if (metricStr.includes('roas')) {
      return `${parseFloat(value || 0).toFixed(2)}x`
    }
    
    // Regular numbers
    const num = parseInt(value) || 0
    return new Intl.NumberFormat('es-ES').format(num)
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
      roas: 'ROAS',
      totalCost: 'Inversión Total',
      totalImpressions: 'Impresiones Totales',
      totalClicks: 'Clics Totales',
      averageCTR: 'CTR Promedio',
      averageCPC: 'CPC Promedio',
      averageCPM: 'CPM Promedio'
    }
    return labels[metric] || metric
  }

  getMetricColor(index) {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    return colors[index % colors.length]
  }

  capitalize(str) {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}

export default OnePagePDFGenerator