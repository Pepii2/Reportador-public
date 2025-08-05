const calculateDerivedMetrics = (data) => {
  return data.map(row => {
    const calculated = { ...row };
    
    // CTR (Click-through Rate)
    if (row.clicks !== undefined && row.impressions !== undefined && row.impressions > 0) {
      calculated.ctr = (row.clicks / row.impressions * 100).toFixed(2);
    }
    
    // CPM (Cost per Mille)
    if (row.cost !== undefined && row.impressions !== undefined && row.impressions > 0) {
      calculated.cpm = (row.cost / row.impressions * 1000).toFixed(2);
    }
    
    // CPC (Cost per Click)
    if (row.cost !== undefined && row.clicks !== undefined && row.clicks > 0) {
      calculated.cpc = (row.cost / row.clicks).toFixed(2);
    }
    
    // ROAS (Return on Ad Spend)
    if (row.revenue !== undefined && row.cost !== undefined && row.cost > 0) {
      calculated.roas = (row.revenue / row.cost).toFixed(2);
    }
    
    // Conversion Rate
    if (row.conversions !== undefined && row.clicks !== undefined && row.clicks > 0) {
      calculated.conversion_rate = (row.conversions / row.clicks * 100).toFixed(2);
    }
    
    // Cost per Conversion
    if (row.cost !== undefined && row.conversions !== undefined && row.conversions > 0) {
      calculated.cost_per_conversion = (row.cost / row.conversions).toFixed(2);
    }
    
    return calculated;
  });
};

const aggregateMetrics = (data, metrics, groupBy) => {
  const aggregated = {};
  
  data.forEach(row => {
    const key = groupBy.map(field => row[field]).join('_');
    
    if (!aggregated[key]) {
      aggregated[key] = {};
      groupBy.forEach(field => {
        aggregated[key][field] = row[field];
      });
      metrics.forEach(metric => {
        aggregated[key][metric] = 0;
      });
    }
    
    metrics.forEach(metric => {
      if (row[metric] !== undefined) {
        aggregated[key][metric] += parseFloat(row[metric]);
      }
    });
  });
  
  return Object.values(aggregated);
};

const formatMetricValue = (value, format) => {
  if (value === null || value === undefined) return '-';
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
      
    case 'percentage':
      return `${parseFloat(value).toFixed(2)}%`;
      
    case 'decimal':
      return parseFloat(value).toFixed(2);
      
    case 'number':
      return new Intl.NumberFormat('es-MX').format(Math.round(value));
      
    default:
      return value.toString();
  }
};

const getMetricTrend = (current, previous) => {
  if (!previous || previous === 0) return { trend: 'neutral', change: 0 };
  
  const change = ((current - previous) / previous * 100).toFixed(1);
  const trend = current > previous ? 'up' : current < previous ? 'down' : 'neutral';
  
  return { trend, change: parseFloat(change) };
};

const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  if (start > end) {
    throw new Error('Start date must be before end date');
  }
  
  if (end > today) {
    throw new Error('End date cannot be in the future');
  }
  
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (daysDiff > 365) {
    throw new Error('Date range cannot exceed 365 days');
  }
  
  return { start, end, daysDiff };
};

module.exports = {
  calculateDerivedMetrics,
  aggregateMetrics,
  formatMetricValue,
  getMetricTrend,
  validateDateRange
};