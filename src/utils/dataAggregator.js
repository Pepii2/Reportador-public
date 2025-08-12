/**
 * Data Aggregator Utility
 * Aggregates campaign data across the entire analysis period
 * Sums metrics and groups by campaign/adset identifiers
 */

/**
 * Aggregate data by campaign for the entire period
 * @param {Array} data - Raw data with daily records
 * @param {String} groupBy - Field to group by (campaign_name, adset_name, etc.)
 * @returns {Array} Aggregated data with summed metrics
 */
export function aggregateDataByPeriod(data, groupBy = 'campaign_name') {
  if (!data || !data.length) return []
  
  // Group data by the specified field
  const grouped = {}
  
  data.forEach(row => {
    const key = row[groupBy] || 'Unknown'
    
    if (!grouped[key]) {
      // Initialize with identification fields
      grouped[key] = {
        [groupBy]: key,
        campaign_name: row.campaign_name || '',
        campaign_id: row.campaign_id || '',
        account_name: row.account_name || '',
        account_id: row.account_id || '',
        adset_name: row.adset_name || '',
        adset_id: row.adset_id || '',
        ad_name: row.ad_name || '',
        ad_id: row.ad_id || '',
        status: row.status || '',
        objective: row.objective || '',
        
        // Initialize metrics with 0
        cost: 0,
        impressions: 0,
        clicks: 0,
        reach: 0,
        conversions: 0,
        purchases: 0,
        revenue: 0,
        link_clicks: 0,
        video_views: 0,
        
        // TikTok specific
        p_video_play: 0,
        p_video_play_100: 0,
        p_video_play_75: 0,
        p_video_play_50: 0,
        p_video_play_25: 0,
        p_likes: 0,
        p_comments: 0,
        p_shares: 0,
        
        // Google specific
        all_conversions: 0,
        conversion_value: 0,
        search_impression_share: 0,
        
        // Date range
        date_start: row.date || row.date_start,
        date_stop: row.date || row.date_stop,
        
        // Count of days included
        days_count: 0
      }
    }
    
    // Sum up metrics
    const metrics = [
      'cost', 'impressions', 'clicks', 'reach', 'conversions', 
      'purchases', 'revenue', 'link_clicks', 'video_views',
      'p_video_play', 'p_likes', 'p_comments', 'p_shares',
      'all_conversions', 'conversion_value'
    ]
    
    metrics.forEach(metric => {
      if (row[metric] !== null && row[metric] !== undefined) {
        grouped[key][metric] = (grouped[key][metric] || 0) + Number(row[metric] || 0)
      }
    })
    
    // Handle percentage metrics (need weighted average)
    const percentageMetrics = [
      'p_video_play_100', 'p_video_play_75', 'p_video_play_50', 'p_video_play_25'
    ]
    
    percentageMetrics.forEach(metric => {
      if (row[metric] !== null && row[metric] !== undefined) {
        // Store sum for now, will calculate average later
        grouped[key][metric] = (grouped[key][metric] || 0) + Number(row[metric] || 0)
      }
    })
    
    // Update date range
    if (row.date || row.date_start) {
      const currentDate = row.date || row.date_start
      if (!grouped[key].date_start || currentDate < grouped[key].date_start) {
        grouped[key].date_start = currentDate
      }
      if (!grouped[key].date_stop || currentDate > grouped[key].date_stop) {
        grouped[key].date_stop = currentDate
      }
    }
    
    // Increment days count
    grouped[key].days_count++
    
    // Keep the most recent status
    if (row.status) {
      grouped[key].status = row.status
    }
    
    // Budget (take max or sum depending on business logic)
    if (row.budget) {
      grouped[key].budget = Math.max(grouped[key].budget || 0, Number(row.budget || 0))
    }
  })
  
  // Convert to array and calculate derived metrics
  return Object.values(grouped).map(campaign => {
    // Calculate CTR
    if (campaign.impressions > 0) {
      campaign.ctr = campaign.clicks / campaign.impressions
    } else {
      campaign.ctr = 0
    }
    
    // Calculate CPC
    if (campaign.clicks > 0) {
      campaign.cpc = campaign.cost / campaign.clicks
    } else {
      campaign.cpc = 0
    }
    
    // Calculate CPM
    if (campaign.impressions > 0) {
      campaign.cpm = (campaign.cost / campaign.impressions) * 1000
    } else {
      campaign.cpm = 0
    }
    
    // Calculate ROAS
    if (campaign.cost > 0) {
      campaign.roas = campaign.revenue / campaign.cost
    } else {
      campaign.roas = 0
    }
    
    // Calculate Frequency (Facebook)
    if (campaign.reach > 0) {
      campaign.frequency = campaign.impressions / campaign.reach
    } else {
      campaign.frequency = 0
    }
    
    // Calculate conversion rate
    if (campaign.clicks > 0) {
      campaign.conversion_rate = campaign.conversions / campaign.clicks
    } else {
      campaign.conversion_rate = 0
    }
    
    // Average percentage metrics
    const percentageMetrics = [
      'p_video_play_100', 'p_video_play_75', 'p_video_play_50', 'p_video_play_25'
    ]
    
    percentageMetrics.forEach(metric => {
      if (campaign[metric] !== undefined && campaign.days_count > 0) {
        campaign[metric] = campaign[metric] / campaign.days_count
      }
    })
    
    // TikTok ROAS
    if (campaign.cost > 0 && campaign.revenue) {
      campaign.p_complete_payment_roas = campaign.revenue / campaign.cost
    }
    
    // Format date range
    if (campaign.date_start && campaign.date_stop) {
      campaign.date_range = `${formatDate(campaign.date_start)} - ${formatDate(campaign.date_stop)}`
    }
    
    return campaign
  })
}

/**
 * Aggregate data with multiple grouping levels
 * @param {Array} data - Raw data
 * @param {Array} groupByFields - Fields to group by in order
 * @returns {Array} Hierarchically aggregated data
 */
export function aggregateDataHierarchical(data, groupByFields = ['account_name', 'campaign_name']) {
  if (!data || !data.length) return []
  
  const result = []
  const grouped = {}
  
  // Create composite key for grouping
  data.forEach(row => {
    const key = groupByFields.map(field => row[field] || 'Unknown').join('|')
    
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(row)
  })
  
  // Aggregate each group
  Object.entries(grouped).forEach(([key, rows]) => {
    const aggregated = aggregateDataByPeriod(rows, groupByFields[groupByFields.length - 1])
    
    if (aggregated.length > 0) {
      // Add hierarchy information
      const keyParts = key.split('|')
      aggregated.forEach(item => {
        groupByFields.forEach((field, index) => {
          item[`level_${index}_${field}`] = keyParts[index]
        })
      })
      
      result.push(...aggregated)
    }
  })
  
  return result
}

/**
 * Filter and aggregate data based on selected fields only
 * @param {Array} data - Aggregated data
 * @param {Array} selectedFields - Fields to include in output
 * @returns {Array} Filtered data with only selected fields
 */
export function filterSelectedFields(data, selectedFields) {
  if (!data || !data.length || !selectedFields || !selectedFields.length) return []
  
  return data.map(row => {
    const filteredRow = {}
    
    selectedFields.forEach(field => {
      if (row.hasOwnProperty(field)) {
        filteredRow[field] = row[field]
      } else {
        // Handle calculated fields
        if (field === 'date_range' && row.date_start && row.date_stop) {
          filteredRow[field] = `${formatDate(row.date_start)} - ${formatDate(row.date_stop)}`
        } else {
          filteredRow[field] = null
        }
      }
    })
    
    return filteredRow
  })
}

/**
 * Sort aggregated data by a specific metric
 * @param {Array} data - Aggregated data
 * @param {String} sortBy - Field to sort by
 * @param {String} order - 'asc' or 'desc'
 * @returns {Array} Sorted data
 */
export function sortAggregatedData(data, sortBy = 'cost', order = 'desc') {
  if (!data || !data.length) return []
  
  const sorted = [...data]
  
  sorted.sort((a, b) => {
    const aVal = a[sortBy] || 0
    const bVal = b[sortBy] || 0
    
    if (order === 'desc') {
      return bVal - aVal
    } else {
      return aVal - bVal
    }
  })
  
  return sorted
}

/**
 * Format date for display
 * @param {String|Date} date - Date to format
 * @returns {String} Formatted date
 */
function formatDate(date) {
  if (!date) return ''
  
  try {
    const d = new Date(date)
    return d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return date
  }
}

/**
 * Main function to prepare evidencia data
 * @param {Array} rawData - Raw campaign data
 * @param {Object} config - Configuration object
 * @returns {Array} Prepared data for evidencia table
 */
export function prepareEvidenciaData(rawData, config = {}) {
  const {
    groupBy = 'campaign_name',
    selectedFields = [],
    sortBy = 'cost',
    sortOrder = 'desc',
    maxRows = null
  } = config
  
  // Step 1: Aggregate data by period
  let aggregated = aggregateDataByPeriod(rawData, groupBy)
  
  // Step 2: Sort data
  aggregated = sortAggregatedData(aggregated, sortBy, sortOrder)
  
  // Step 3: Limit rows if specified
  if (maxRows && maxRows > 0) {
    aggregated = aggregated.slice(0, maxRows)
  }
  
  // Step 4: Filter selected fields if specified
  if (selectedFields.length > 0) {
    aggregated = filterSelectedFields(aggregated, selectedFields)
  }
  
  return aggregated
}

export default {
  aggregateDataByPeriod,
  aggregateDataHierarchical,
  filterSelectedFields,
  sortAggregatedData,
  prepareEvidenciaData
}