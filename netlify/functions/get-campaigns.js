import { queryBigQuery, getDatePartition } from './utils/bigquery.js';
import { successResponse, errorResponse, validationError } from './utils/response.js';

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return successResponse({});
  }

  try {
    const { platform, accountIds, startDate, endDate, team } = JSON.parse(event.body || '{}');
    
    if (!platform || !accountIds || accountIds.length === 0) {
      return validationError('Platform and account IDs are required');
    }

    const dateFilter = startDate && endDate 
      ? `AND ${getDatePartition(startDate, endDate)}`
      : 'AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)';

    const query = `
      SELECT
        campaign,
        MAX(account) as account,
        MAX(account_name) as account_name,
        MIN(date) as start_date,
        MAX(date) as end_date,
        SUM(cost) as total_cost,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        COUNT(DISTINCT date) as active_days
      FROM \`${process.env.BIGQUERY_DATASET}.unified_data\`
      WHERE LOWER(platform) = LOWER(@platform)
        AND account IN UNNEST(@accountIds)
        ${dateFilter}
        ${team ? 'AND team = @team' : ''}
      GROUP BY campaign
      ORDER BY total_cost DESC
    `;

    const params = { 
      platform, 
      accountIds
    };
    
    // Only add parameters if they have values (not null)
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }
    if (team) {
      params.team = team;
    }
    
    console.log('Campaigns query params:', params);
    console.log('Campaigns query:', query);
    
    const campaigns = await queryBigQuery(query, params);
    
    console.log(`Found ${campaigns.length} campaigns for platform "${platform}"`);
    if (campaigns.length > 0) {
      console.log('Sample campaign data:', {
        campaign: campaigns[0].campaign,
        start_date: campaigns[0].start_date,
        end_date: campaigns[0].end_date,
        active_days: campaigns[0].active_days
      });
    }

    const formattedCampaigns = campaigns.map(campaign => {
      // Extract the actual date value from BigQuery date object
      const endDateValue = campaign.end_date?.value || campaign.end_date;
      const startDateValue = campaign.start_date?.value || campaign.start_date;
      
      return {
        id: campaign.campaign,
        name: campaign.campaign, // Use campaign name directly since it's the same
        accountId: campaign.account,
        accountName: campaign.account_name,
        startDate: startDateValue,
        endDate: endDateValue,
        totalCost: campaign.total_cost,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions * 100).toFixed(2) : 0,
        activeDays: campaign.active_days,
        status: getCampaignStatus(endDateValue)
      };
    });

    // Return campaigns array directly for compatibility with wizard store
    return successResponse(formattedCampaigns);
  } catch (error) {
    console.error('Get campaigns error:', error);
    console.error('Error stack:', error.stack);
    return errorResponse(error);
  }
};

function getCampaignStatus(endDate) {
  if (!endDate) return 'unknown';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for consistent comparison
  
  const lastDataDate = new Date(endDate);
  lastDataDate.setHours(0, 0, 0, 0);
  
  const daysSinceEnd = Math.floor(
    (today - lastDataDate) / (1000 * 60 * 60 * 24)
  );
  
  console.log(`Campaign status - Last data: ${endDate}, Days since: ${daysSinceEnd}`);
  
  // More generous thresholds considering data delays
  // Active: Data within last 14 days (accounts for weekly reporting delays)
  // Paused: Data within last 60 days
  // Completed: Older than 60 days
  if (daysSinceEnd <= 14) return 'active';
  if (daysSinceEnd <= 60) return 'paused';
  return 'completed';
}