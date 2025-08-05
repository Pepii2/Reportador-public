import { queryBigQuery, getDatePartition } from './utils/bigquery.js';
import { successResponse, errorResponse, validationError } from './utils/response.js';

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return successResponse({});
  }

  try {
    const { platform, campaignIds, startDate, endDate } = JSON.parse(event.body || '{}');
    
    if (!platform || !campaignIds || campaignIds.length === 0) {
      return validationError('Platform and campaign IDs are required');
    }
    
    // Note: The unified_data table doesn't have adset-level data
    // Return empty array for now to allow the wizard to continue
    console.log('Note: Ad sets not available in unified_data table, returning empty array');
    return successResponse([]);

    const dateFilter = startDate && endDate 
      ? `AND ${getDatePartition(startDate, endDate)}`
      : 'AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)';

    const query = `
      WITH adset_metrics AS (
        SELECT 
          adset_id,
          adset_name,
          campaign,
          campaign_name,
          metric,
          SUM(value) as total_value
        FROM \`${process.env.BIGQUERY_DATASET}.unified_data\`
        WHERE platform = @platform
          AND campaign IN UNNEST(@campaignIds)
          ${dateFilter}
        GROUP BY adset_id, adset_name, campaign, campaign_name, metric
      )
      SELECT 
        adset_id,
        adset_name,
        campaign,
        campaign_name,
        MAX(CASE WHEN metric = 'cost' THEN total_value ELSE 0 END) as cost,
        MAX(CASE WHEN metric = 'impressions' THEN total_value ELSE 0 END) as impressions,
        MAX(CASE WHEN metric = 'clicks' THEN total_value ELSE 0 END) as clicks,
        MAX(CASE WHEN metric = 'reach' THEN total_value ELSE 0 END) as reach,
        MAX(CASE WHEN metric = 'frequency' THEN total_value ELSE 0 END) as frequency
      FROM adset_metrics
      GROUP BY adset_id, adset_name, campaign, campaign_name
      ORDER BY cost DESC
    `;

    const params = { 
      platform, 
      campaignIds
    };
    
    // Only add parameters if they have values (not null)
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }
    
    const adsets = await queryBigQuery(query, params);

    const adsetsByCampaign = {};
    
    adsets.forEach(adset => {
      if (!adsetsByCampaign[adset.campaign]) {
        adsetsByCampaign[adset.campaign] = {
          campaignId: adset.campaign,
          campaignName: adset.campaign_name,
          adsets: []
        };
      }
      
      adsetsByCampaign[adset.campaign].adsets.push({
        id: adset.adset_id,
        name: adset.adset_name,
        cost: adset.cost,
        impressions: adset.impressions,
        clicks: adset.clicks,
        reach: adset.reach || 0,
        frequency: adset.frequency || 0,
        ctr: adset.impressions > 0 ? (adset.clicks / adset.impressions * 100).toFixed(2) : 0,
        cpm: adset.impressions > 0 ? (adset.cost / adset.impressions * 1000).toFixed(2) : 0
      });
    });

    return successResponse({
      campaigns: Object.values(adsetsByCampaign),
      summary: {
        totalAdsets: adsets.length,
        totalCost: adsets.reduce((sum, a) => sum + a.cost, 0),
        avgCTR: calculateAverageCTR(adsets)
      }
    });
  } catch (error) {
    return errorResponse(error);
  }
};

function calculateAverageCTR(adsets) {
  const totalClicks = adsets.reduce((sum, a) => sum + a.clicks, 0);
  const totalImpressions = adsets.reduce((sum, a) => sum + a.impressions, 0);
  return totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0;
}