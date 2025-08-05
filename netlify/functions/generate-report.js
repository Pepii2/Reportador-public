import { queryBigQuery, getDatePartition } from './utils/bigquery.js';
import { successResponse, errorResponse, validationError } from './utils/response.js';

// Calculate derived metrics from base metrics in wide format
function calculateDerivedMetrics(rows) {
  return rows.map(row => {
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
}

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return successResponse({});
  }

  try {
    console.log('Generate report request received');
    console.log('Request body:', event.body);
    
    const reportConfig = JSON.parse(event.body || '{}');
    console.log('Parsed config:', JSON.stringify(reportConfig, null, 2));
    
    const { 
      platform, 
      reportType, 
      accountIds,
      campaignIds,
      adsetIds,
      startDate,
      endDate,
      metrics,
      groupBy,
      compareWith,
      extractDates
    } = reportConfig;

    // For date extraction, we don't need metrics validation
    if (extractDates) {
      if (!platform || !campaignIds || campaignIds.length === 0) {
        return validationError('Platform and campaign IDs are required for date extraction');
      }
    } else {
      // Regular report generation requires metrics
      if (!platform || !reportType || !metrics || metrics.length === 0) {
        return validationError('Platform, report type, and metrics are required');
      }
    }

    let reportData;

    // Handle date extraction as a special case
    if (extractDates) {
      reportData = await generateSimpleReport(reportConfig);
    } else {
      // Regular report generation
      switch (reportType) {
        case 'simple':
          reportData = await generateSimpleReport(reportConfig);
          break;
        case 'compare_campaigns':
          reportData = await generateCampaignComparison(reportConfig);
          break;
        case 'compare_periods':
          reportData = await generatePeriodComparison(reportConfig);
          break;
        default:
          return validationError('Invalid report type');
      }
    }

    // Return data directly as array for compatibility with wizard store
    return successResponse(reportData);
  } catch (error) {
    console.error('Generate report error:', error);
    console.error('Error stack:', error.stack);
    return errorResponse(error);
  }
};

async function generateSimpleReport(config) {
  const { platform, accountIds, campaignIds, adsetIds, startDate, endDate, metrics, groupBy, extractDates, team } = config;
  
  const filters = buildFilters(platform, accountIds, campaignIds, adsetIds, team);
  
  // For date extraction, we might not have date range yet, so make it optional
  let dateFilter = '';
  if (startDate && endDate) {
    dateFilter = `AND ${getDatePartition(startDate, endDate)}`;
  } else if (extractDates) {
    // For date extraction, look back further to find all available dates
    // Looking back 180 days to ensure we capture all campaign data
    const lookbackDays = 180;
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);
    const today = new Date();
    dateFilter = `AND ${getDatePartition(lookbackDate.toISOString().split('T')[0], today.toISOString().split('T')[0])}`;
    console.log(`Date extraction: Looking back ${lookbackDays} days from ${today.toISOString().split('T')[0]} to ${lookbackDate.toISOString().split('T')[0]}`);
  }
  
  const params = {
    platform
  };
  
  // Only add parameters if they have values
  if (team) {
    params.team = team;
  }
  if (accountIds && accountIds.length > 0) {
    params.accountIds = accountIds;
  }
  if (campaignIds && campaignIds.length > 0) {
    params.campaignIds = campaignIds;
  }
  if (startDate) {
    params.startDate = startDate;
  }
  if (endDate) {
    params.endDate = endDate;
  }

  // For date extraction, use a simpler query
  if (extractDates) {
    // Wide format query - directly check cost column
    const dateQuery = `
      SELECT DISTINCT
        date,
        campaign
      FROM \`${process.env.BIGQUERY_DATASET}.unified_data\`
      WHERE ${filters}
        ${dateFilter}
        AND cost > 0 -- Ensure we have actual data
      ORDER BY date DESC, campaign
    `;
    
    console.log('Date extraction query:', dateQuery);
    console.log('Date extraction params:', params);
    
    try {
      const dateRows = await queryBigQuery(dateQuery, params);
      console.log(`Found ${dateRows.length} date entries for campaigns`);
      
      // Log the date range found
      if (dateRows.length > 0) {
        const dates = [...new Set(dateRows.map(row => {
          if (row.date && row.date.value) {
            return row.date.value;
          }
          return row.date;
        }))].sort();
        console.log(`Date range found: ${dates[0]} to ${dates[dates.length - 1]} (${dates.length} unique dates)`);
        console.log('Sample dates:', dates.slice(0, 5));
      }
      
      // The frontend expects dates in BigQuery format with {value: 'YYYY-MM-DD'}
      // This ensures compatibility with the existing date parsing logic
      return dateRows.map(row => ({
        date: row.date, // Keep the original BigQuery date object format
        campaign: row.campaign
      }));
    } catch (error) {
      console.error('Date extraction query failed:', error);
      throw error;
    }
  }

  // Regular report generation - Wide format
  const groupByClause = buildGroupByClause(groupBy || 'date');
  
  // Ensure metrics is an array
  if (!Array.isArray(metrics) || metrics.length === 0) {
    throw new Error('Metrics must be provided as an array');
  }
  
  // In wide format, we directly SUM the metric columns
  const metricSelects = metrics.map(m => {
    // Handle calculated metrics that aren't in the table
    if (['ctr', 'cpm', 'cpc', 'roas', 'conversion_rate', 'cost_per_conversion'].includes(m)) {
      return null; // We'll calculate these after aggregation
    }
    // For percentage metrics from Google, use AVG instead of SUM
    if (['impression_share', 'is_lost_by_rank', 'is_lost_by_budget', 'is_top', 'is_absolute_top'].includes(m)) {
      return `AVG(${m}) as ${m}`;
    }
    return `SUM(${m}) as ${m}`;
  }).filter(Boolean).join(',\n        ');

  const query = `
    SELECT 
      ${groupByClause.select},
      ${metricSelects}
    FROM \`${process.env.BIGQUERY_DATASET}.unified_data\`
    WHERE ${filters}
      ${dateFilter}
    GROUP BY ${groupByClause.groupBy}
    ORDER BY ${groupByClause.orderBy}
  `;

  console.log('Generate simple report - Query:', query);
  console.log('Generate simple report - Params:', params);
  console.log('Generate simple report - Metrics:', metrics);
  
  const rows = await queryBigQuery(query, params);
  console.log(`Query returned ${rows.length} rows`);
  
  // Calculate derived metrics after aggregation
  const processedRows = calculateDerivedMetrics(rows);
  
  return processReportData(processedRows, metrics);
}

async function generateCampaignComparison(config) {
  const { platform, campaignIds, startDate, endDate, metrics, team } = config;
  
  // Filter out calculated metrics
  const dbMetrics = metrics.filter(m => 
    !['ctr', 'cpm', 'cpc', 'roas', 'conversion_rate', 'cost_per_conversion'].includes(m)
  );
  
  const metricSelects = dbMetrics.map(m => `SUM(${m}) as ${m}`).join(',\n        ');

  const query = `
    SELECT 
      campaign,
      MAX(account_name) as campaign_name,
      ${metricSelects}
    FROM \`${process.env.BIGQUERY_DATASET}.unified_data\`
    WHERE platform = @platform
      AND campaign IN UNNEST(@campaignIds)
      AND ${getDatePartition(startDate, endDate)}
    GROUP BY campaign
    ORDER BY campaign
  `;

  const params = {
    platform,
    campaignIds,
    startDate,
    endDate
  };
  
  if (team) {
    params.team = team;
  }

  const rows = await queryBigQuery(query, params);
  const processedRows = calculateDerivedMetrics(rows);
  return processComparisonData(processedRows, metrics, 'campaign');
}

async function generatePeriodComparison(config) {
  const { 
    platform, 
    accountIds, 
    campaignIds, 
    startDate, 
    endDate, 
    compareStartDate, 
    compareEndDate, 
    metrics,
    team 
  } = config;
  
  const filters = buildFilters(platform, accountIds, campaignIds, null, team);
  
  // Filter out calculated metrics
  const dbMetrics = metrics.filter(m => 
    !['ctr', 'cpm', 'cpc', 'roas', 'conversion_rate', 'cost_per_conversion'].includes(m)
  );
  
  const metricSelects = dbMetrics.map(m => `SUM(${m}) as ${m}`).join(',\n        ');

  const currentPeriodQuery = `
    SELECT 
      'current' as period,
      ${metricSelects}
    FROM \`${process.env.BIGQUERY_DATASET}.unified_data\`
    WHERE ${filters}
      AND ${getDatePartition(startDate, endDate)}
  `;

  const comparePeriodQuery = `
    SELECT 
      'previous' as period,
      ${metricSelects}
    FROM \`${process.env.BIGQUERY_DATASET}.unified_data\`
    WHERE ${filters}
      AND ${getDatePartition(compareStartDate, compareEndDate)}
  `;

  const query = `${currentPeriodQuery} UNION ALL ${comparePeriodQuery}`;

  const params = {
    platform,
    accountIds: accountIds || [],
    campaignIds: campaignIds || [],
    startDate,
    endDate,
    compareStartDate,
    compareEndDate
  };
  
  if (team) {
    params.team = team;
  }

  const rows = await queryBigQuery(query, params);
  const processedRows = calculateDerivedMetrics(rows);
  return processPeriodComparison(processedRows, metrics);
}

function buildFilters(platform, accountIds, campaignIds, adsetIds, team) {
  const filters = [`LOWER(platform) = LOWER(@platform)`];
  
  if (team) {
    filters.push(`team = @team`);
  }
  if (accountIds && accountIds.length > 0) {
    filters.push(`account IN UNNEST(@accountIds)`);
  }
  if (campaignIds && campaignIds.length > 0) {
    filters.push(`campaign IN UNNEST(@campaignIds)`);
  }
  if (adsetIds && adsetIds.length > 0) {
    filters.push(`adset_id IN UNNEST(@adsetIds)`);
  }
  
  return filters.join(' AND ');
}

function buildGroupByClause(groupBy) {
  const groupByConfigs = {
    date: {
      select: 'date',
      groupBy: 'date',
      orderBy: 'date'
    },
    campaign: {
      select: 'campaign, campaign_name',
      groupBy: 'campaign, campaign_name',
      orderBy: 'campaign_name'
    },
    // Note: adset data not available in unified_data table
    // adset: {
    //   select: 'adset_id, adset_name, campaign_name',
    //   groupBy: 'adset_id, adset_name, campaign_name',
    //   orderBy: 'campaign_name, adset_name'
    // },
    account: {
      select: 'account, account_name',
      groupBy: 'account, account_name',
      orderBy: 'account_name'
    }
  };
  
  return groupByConfigs[groupBy] || groupByConfigs.date;
}

function processReportData(rows, metrics) {
  return {
    rows: rows.map(row => {
      const processedRow = { ...row };
      
      if (row.date) {
        processedRow.date = new Date(row.date.value).toISOString().split('T')[0];
      }
      
      metrics.forEach(metric => {
        processedRow[metric] = parseFloat(row[metric] || 0);
      });
      
      return processedRow;
    }),
    summary: calculateSummary(rows, metrics)
  };
}

function processComparisonData(rows, metrics, comparisonType) {
  const data = rows.map(row => {
    const item = {
      id: (comparisonType === 'campaign' || comparisonType === 'account') ? row[comparisonType] : row[`${comparisonType}_id`],
      name: row[`${comparisonType}_name`],
      metrics: {}
    };
    
    metrics.forEach(metric => {
      item.metrics[metric] = parseFloat(row[metric] || 0);
    });
    
    return item;
  });
  
  return {
    items: data,
    totals: calculateTotals(data, metrics)
  };
}

function processPeriodComparison(rows, metrics) {
  const periods = {};
  
  rows.forEach(row => {
    periods[row.period] = {};
    metrics.forEach(metric => {
      periods[row.period][metric] = parseFloat(row[metric] || 0);
    });
  });
  
  const changes = {};
  metrics.forEach(metric => {
    const current = periods.current?.[metric] || 0;
    const previous = periods.previous?.[metric] || 0;
    
    changes[metric] = {
      absolute: current - previous,
      percentage: previous > 0 ? ((current - previous) / previous * 100).toFixed(2) : 0
    };
  });
  
  return {
    current: periods.current || {},
    previous: periods.previous || {},
    changes
  };
}

function calculateSummary(rows, metrics) {
  const summary = {};
  
  metrics.forEach(metric => {
    summary[metric] = {
      total: rows.reduce((sum, row) => sum + parseFloat(row[metric] || 0), 0),
      average: rows.length > 0 ? 
        rows.reduce((sum, row) => sum + parseFloat(row[metric] || 0), 0) / rows.length : 0,
      min: Math.min(...rows.map(row => parseFloat(row[metric] || 0))),
      max: Math.max(...rows.map(row => parseFloat(row[metric] || 0)))
    };
  });
  
  return summary;
}

function calculateTotals(items, metrics) {
  const totals = {};
  
  metrics.forEach(metric => {
    totals[metric] = items.reduce((sum, item) => sum + item.metrics[metric], 0);
  });
  
  return totals;
}