import { queryBigQuery } from './utils/bigquery.js';
import { successResponse, errorResponse, validationError } from './utils/response.js';

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return successResponse({});
  }

  try {
    const { platform, team } = event.queryStringParameters || {};
    
    console.log('Get accounts request - Query params:', event.queryStringParameters);
    console.log('Platform:', platform, 'Team:', team);
    
    if (!platform) {
      console.error('Missing platform parameter in request');
      return validationError('Platform parameter is required');
    }

    const query = `
      SELECT
        account,
        MAX(account_name) as account_name,
        MAX(date) as last_active_date,
        COUNT(DISTINCT campaign) as active_campaigns,
        SUM(cost) as total_spend
      FROM \`${process.env.BIGQUERY_DATASET}.unified_data\`
      WHERE LOWER(platform) = LOWER(@platform)
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
        ${team ? 'AND team = @team' : ''}
      GROUP BY account
      ORDER BY total_spend DESC
    `;

    const params = { platform };
    if (team) {
      params.team = team;
    }
    
    console.log('Accounts query for platform:', platform);
    
    const accounts = await queryBigQuery(query, params);
    console.log(`Found ${accounts.length} accounts for platform "${platform}"`);

    const formattedAccounts = accounts.map(account => ({
      id: account.account,
      name: account.account_name,
      lastActive: account.last_active_date?.value || account.last_active_date,
      activeCampaigns: parseInt(account.active_campaigns) || 0,
      totalSpend: parseFloat(account.total_spend) || 0,
      status: getAccountStatus(account.last_active_date?.value || account.last_active_date)
    }));

    return successResponse(formattedAccounts);
  } catch (error) {
    return errorResponse(error);
  }
};

function getAccountStatus(lastActiveDate) {
  const daysSinceActive = Math.floor(
    (new Date() - new Date(lastActiveDate)) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceActive <= 7) return 'active';
  if (daysSinceActive <= 30) return 'inactive';
  return 'dormant';
}