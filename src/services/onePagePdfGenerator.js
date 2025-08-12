import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { prepareEvidenciaData } from '@/utils/dataAggregator'

/**
 * One-Page PDF Report Generator
 * Clean, professional single-page marketing report with platform-specific styling
 */
export class OnePagePDFGenerator {
  constructor() {
    this.doc = null
    this.colors = {
      primary: '#2563eb',
      secondary: '#64748b',
      dark: '#1e293b',
      light: '#f1f5f9',
      white: '#ffffff',
      // Platform specific colors
      facebook: '#1877F2',
      google: '#4285F4',
      tiktok: '#FF0050'
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
    const cardsHeight = 45
    yPos = this.addMetricsCards(reportData, margins, contentWidth, yPos, cardsHeight)
    
    // CHART SECTION (Middle of page)
    const chartHeight = 70
    yPos = this.addChart(reportData, config, margins, contentWidth, yPos, chartHeight)
    
    // EVIDENCIA TABLE SECTION (Bottom of page)
    const remainingHeight = pageHeight - yPos - margins.bottom - 10
    this.addEvidenciaTable(reportData, config, margins, contentWidth, yPos, remainingHeight)

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
      const platformColor = this.colors[config.platform] || this.colors.primary
      
      this.doc.setFillColor(platformColor)
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

    // Calculate card dimensions (max 6 cards)
    const displayMetrics = metrics.slice(0, 6)
    const cardsPerRow = Math.min(displayMetrics.length, 3)
    const rows = Math.ceil(displayMetrics.length / cardsPerRow)
    const cardWidth = (contentWidth - (cardsPerRow - 1) * 5) / cardsPerRow
    const cardHeight = (height - (rows - 1) * 5) / rows

    displayMetrics.forEach((metric, index) => {
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
      const value = this.formatMetricValue(
        metric.value || summary[`total${this.capitalize(metric.id)}`] || summary[metric.id], 
        metric.id
      )
      
      // Truncate value if too long
      const maxWidth = cardWidth - 10
      let displayValue = value
      if (this.doc.getTextWidth(displayValue) > maxWidth) {
        this.doc.setFontSize(14)
      }
      
      this.doc.text(displayValue, x + 5, y + 18)
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
   * Add evidencia table with platform-specific styling
   */
  addEvidenciaTable(reportData, config, margins, contentWidth, yPos, maxHeight) {
    const platform = config.platform || 'facebook'
    const evidenciaConfig = config.customization?.evidenciaConfig || {
      fields: ['campaign_name', 'status', 'cost', 'impressions', 'clicks', 'ctr'],
      style: 'standard'
    }
    
    // Aggregate data by campaign (one row per campaign)
    const aggregatedData = prepareEvidenciaData(reportData.data || [], {
      groupBy: 'campaign_name',
      selectedFields: evidenciaConfig.fields,
      sortBy: 'cost',
      sortOrder: 'desc'
    })

    if (aggregatedData.length === 0) return

    // Title
    this.doc.setFontSize(11)
    this.doc.setFont(undefined, 'bold')
    this.doc.setTextColor(this.colors.dark)
    this.doc.text('Evidencia - Resumen por Campaña', margins.left, yPos + 5)

    // Prepare table headers based on selected fields
    const headers = evidenciaConfig.fields.map(field => this.getFieldLabel(field))
    
    // Prepare table rows (one per campaign with summed metrics)
    const rows = aggregatedData.map(campaign => {
      return evidenciaConfig.fields.map(field => {
        const value = campaign[field]
        return this.formatFieldValue(value, field)
      })
    })

    // Platform-specific styling
    const platformStyles = this.getPlatformTableStyles(platform)

    // Add table with autoTable
    this.doc.autoTable({
      head: [headers],
      body: rows,
      startY: yPos + 10,
      margin: { left: margins.left, right: margins.right },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: platformStyles.lineColor,
        lineWidth: 0.1,
        font: 'helvetica'
      },
      headStyles: {
        fillColor: platformStyles.headerColor,
        textColor: platformStyles.headerTextColor,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: platformStyles.alternateRowColor
      },
      columnStyles: this.getColumnStyles(evidenciaConfig.fields),
      didDrawPage: (data) => {
        // Add platform watermark/logo
        this.addPlatformWatermark(platform, margins, data.cursor.y)
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
   * Get platform-specific table styles
   */
  getPlatformTableStyles(platform) {
    const styles = {
      facebook: {
        headerColor: [24, 119, 242], // Facebook blue
        headerTextColor: [255, 255, 255],
        lineColor: [225, 232, 237],
        alternateRowColor: [247, 249, 252]
      },
      google: {
        headerColor: [66, 133, 244], // Google blue
        headerTextColor: [255, 255, 255],
        lineColor: [218, 220, 224],
        alternateRowColor: [248, 249, 250]
      },
      tiktok: {
        headerColor: [255, 0, 80], // TikTok red/pink
        headerTextColor: [255, 255, 255],
        lineColor: [255, 229, 236],
        alternateRowColor: [255, 250, 251]
      }
    }
    return styles[platform] || styles.facebook
  }

  /**
   * Get column styles based on field types
   */
  getColumnStyles(fields) {
    const styles = {}
    fields.forEach((field, index) => {
      if (['cost', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'reach', 'conversions'].includes(field)) {
        styles[index] = { halign: 'right' }
      } else if (field === 'status') {
        styles[index] = { halign: 'center' }
      } else {
        styles[index] = { halign: 'left' }
      }
    })
    return styles
  }

  /**
   * Add platform watermark
   */
  addPlatformWatermark(platform, margins, yPos) {
    const platformNames = {
      facebook: 'Meta',
      google: 'Google Ads',
      tiktok: 'TikTok Ads'
    }
    
    this.doc.setFontSize(8)
    this.doc.setTextColor(200, 200, 200)
    this.doc.text(
      platformNames[platform] || platform.toUpperCase(),
      margins.left + 180,
      yPos + 15,
      { angle: 0 }
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

    // Group data by date and sum metrics
    const groupedData = {}
    data.forEach(row => {
      const date = this.formatDate(row.date)
      if (!groupedData[date]) {
        groupedData[date] = {}
      }
      metrics.forEach(metric => {
        groupedData[date][metric] = (groupedData[date][metric] || 0) + (row[metric] || 0)
      })
    })

    const dates = Object.keys(groupedData).sort()
    if (dates.length < 2) return

    // Draw axes
    this.doc.setDrawColor(this.colors.light)
    this.doc.setLineWidth(0.5)
    this.doc.line(x, y + height, x + width, y + height) // X axis
    this.doc.line(x, y, x, y + height) // Y axis

    // Draw data lines
    metrics.forEach((metric, metricIndex) => {
      const values = dates.map(date => groupedData[date][metric] || 0)
      const maxValue = Math.max(...values)
      if (maxValue === 0) return

      const color = this.getMetricColor(metricIndex)
      this.doc.setDrawColor(color)
      this.doc.setLineWidth(1)

      // Draw line
      dates.forEach((date, i) => {
        if (i === 0) return
        
        const x1 = x + ((i - 1) / (dates.length - 1)) * width
        const y1 = y + height - (values[i - 1] / maxValue) * height
        const x2 = x + (i / (dates.length - 1)) * width
        const y2 = y + height - (values[i] / maxValue) * height
        
        this.doc.line(x1, y1, x2, y2)
        
        // Draw points
        this.doc.setFillColor(color)
        this.doc.circle(x2, y2, 1, 'F')
      })
    })

    // Add date labels (first and last)
    this.doc.setFontSize(7)
    this.doc.setTextColor(this.colors.secondary)
    this.doc.text(dates[0], x, y + height + 4)
    this.doc.text(dates[dates.length - 1], x + width - 10, y + height + 4)
  }

  /**
   * Helper functions
   */
  getMetricLabel(metric) {
    const labels = {
      cost: 'Inversión',
      impressions: 'Impresiones',
      clicks: 'Clics',
      ctr: 'CTR',
      cpc: 'CPC',
      cpm: 'CPM',
      reach: 'Alcance',
      frequency: 'Frecuencia',
      conversions: 'Conversiones',
      purchases: 'Compras',
      revenue: 'Ingresos',
      roas: 'ROAS',
      campaign_name: 'Campaña',
      status: 'Estado',
      budget: 'Presupuesto',
      objective: 'Objetivo'
    }
    return labels[metric] || metric
  }

  getFieldLabel(field) {
    return this.getMetricLabel(field)
  }

  formatMetricValue(value, metric) {
    if (value == null || value === '') return '—'
    
    switch (metric) {
      case 'cost':
      case 'cpc':
      case 'cpm':
      case 'revenue':
      case 'budget':
        return `$${this.formatNumber(value)}`
      case 'ctr':
      case 'conversion_rate':
        return `${(value * 100).toFixed(2)}%`
      case 'roas':
      case 'frequency':
        return value.toFixed(2)
      case 'impressions':
      case 'clicks':
      case 'reach':
      case 'conversions':
      case 'purchases':
        return this.formatNumber(value)
      default:
        return String(value)
    }
  }

  formatFieldValue(value, field) {
    // Check if it's a metric field
    if (['cost', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'reach', 'conversions', 'revenue', 'roas'].includes(field)) {
      return this.formatMetricValue(value, field)
    }
    
    // Status field
    if (field === 'status') {
      return value || 'Activo'
    }
    
    // Date fields
    if (field === 'date' || field === 'date_start' || field === 'date_stop') {
      return this.formatDate(value)
    }
    
    // Text fields
    return value || '—'
  }

  formatNumber(num) {
    if (!num) return '0'
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toFixed(0)
  }

  formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  capitalize(str) {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  getMetricColor(index) {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#06b6d4'  // cyan
    ]
    return colors[index % colors.length]
  }
}

export default OnePagePDFGenerator